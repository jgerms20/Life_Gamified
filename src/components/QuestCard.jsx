import { useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { Play, Pencil, Hourglass, X, Undo2, Trash2, Check, Repeat, Bot, ChevronDown } from 'lucide-react';
import { CATEGORIES, DIFFICULTIES, questDue, isLocked, ABILITIES } from '../lib/engine';
import { useGame } from '../lib/game';
import { SealGlyph, Stars } from './Ornaments';

function tiltFor(id) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 9) - 4) * 0.18;
}

export function dueLabel(due) {
  if (!due) return null;
  if (due.overdue) return { text: `${-due.days} moon${due.days === -1 ? '' : 's'} overdue`, cls: 'late' };
  if (due.today) return { text: 'Due before nightfall', cls: 'soon' };
  if (due.days === 1) return { text: '1 moon remaining', cls: 'soon' };
  return { text: `${due.days} moons remaining`, cls: '' };
}

export default function QuestCard({ quest, onEdit, compact }) {
  const { state, today, dispatch, derived } = useGame();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const cat = CATEGORIES[quest.category];
  const diff = DIFFICULTIES[quest.difficulty];
  const due = questDue(quest, today);
  const label = dueLabel(due);
  const locked = isLocked(state, quest);
  const bonusDone = quest.bonusObjectives.filter(b => b.done).length;
  const prereqs = quest.prerequisites.map(id => state.quests.find(q => q.id === id)).filter(Boolean);

  // Swipe right to complete (touch-friendly).
  const x = useMotionValue(0);
  const sealOpacity = useTransform(x, [0, 110], [0, 1]);

  const complete = () => {
    if (locked) return;
    dispatch({ type: 'COMPLETE_QUEST', payload: { id: quest.id } });
  };
  const act = (type, payload = {}) => { dispatch({ type, payload: { id: quest.id, ...payload } }); setConfirm(null); };

  const warpCost = Math.round(ABILITIES.time_warp.mp * (1 - 0.1 * (state.character?.talents?.wisdom || 0)));

  return (
    <motion.article
      layout
      className={`quest ${locked ? 'locked' : ''}`}
      style={{ '--cat': cat.color, '--tilt': `${tiltFor(quest.id)}deg` }}
      initial={{ opacity: 0, y: 14, scale: .98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 120, rotate: 6, transition: { duration: .35, ease: [.4, 0, 1, 1] } }}
      whileHover={{ y: -3, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      {due?.overdue && <div className="urgent-seal" aria-label="Urgent">URGENT</div>}

      <motion.div
        className="quest-head"
        drag={compact && !locked ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: .6 }}
        style={{ x }}
        onDragEnd={(_, info) => { if (info.offset.x > 110) complete(); }}
        onClick={() => setOpen(o => !o)}
        role="button" tabIndex={0} aria-expanded={open}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } }}
      >
        <div className="quest-main">
          <div className="quest-meta">
            <span>{cat.icon} {cat.label}</span>
            <span className="sep">◆</span>
            <span>{diff.label}</span>
            <Stars count={diff.stars} />
          </div>
          <h3 className="quest-title">{quest.title}</h3>
          {quest.description && !compact && <p className="quest-desc">{quest.description}</p>}
          <div className="quest-foot">
            {label && <span className={`due ${label.cls}`}>{label.text}</span>}
            <span className="hand" style={{ fontSize: 17, color: 'var(--gold-deep)' }}>⚡ {diff.xp} XP</span>
            {quest.status === 'in_progress' && <span className="tag prog">In progress</span>}
            {quest.recurrence !== 'none' && <span className="tag recur"><Repeat size={10} style={{ verticalAlign: -1 }} /> {quest.recurrence}</span>}
            {quest.bonusObjectives.length > 0 && <span className="tag">{bonusDone}/{quest.bonusObjectives.length} bonus</span>}
            {quest.source === 'agent' && <span className="tag agent"><Bot size={10} style={{ verticalAlign: -1 }} /> scribe</span>}
            {quest.tags?.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        </div>
        <motion.button
          className="seal-btn"
          onClick={(e) => { e.stopPropagation(); complete(); }}
          whileTap={{ scale: .85, rotate: -20 }}
          aria-label={locked ? 'Locked' : `Complete ${quest.title}`}
          title={locked ? 'Finish the prerequisite quests first' : 'Seal it — quest complete'}
          disabled={locked}
        >
          <SealGlyph />
        </motion.button>
        {compact && <motion.div style={{ opacity: sealOpacity, position: 'absolute', left: -40, top: '50%', marginTop: -12, color: 'var(--c-money)' }}><Check /></motion.div>}
      </motion.div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="quest-body"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: .28, ease: [.16, 1, .3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {quest.description && compact && <p className="quest-desc" style={{ marginBottom: 8 }}>{quest.description}</p>}
            {prereqs.length > 0 && (
              <p className="muted" style={{ fontSize: 15, marginBottom: 8 }}>
                🔗 Requires: {prereqs.map(p => `“${p.title}”`).join(', ')}
              </p>
            )}
            {quest.bonusObjectives.length > 0 && (
              <ul className="bonus-list">
                {quest.bonusObjectives.map((b, i) => (
                  <li key={i} className={`bonus-item ${b.done ? 'done' : ''}`} onClick={() => dispatch({ type: 'TOGGLE_BONUS', payload: { id: quest.id, index: i } })}>
                    <span className="box">{b.done && <Check size={14} strokeWidth={3} />}</span>
                    <span>{b.text}</span>
                    <em>+{Math.round(diff.xp * .25)} XP</em>
                  </li>
                ))}
              </ul>
            )}
            {confirm ? (
              <div className="quest-actions" style={{ alignItems: 'center' }}>
                <span style={{ fontStyle: 'italic', color: 'var(--rubric)' }}>
                  {confirm === 'FAIL_QUEST' && `Mark as failed? You lose ${Math.round(diff.hpLoss * (1 - .25 * (state.character?.talents?.resilience || 0)))} HP.`}
                  {confirm === 'ABANDON_QUEST' && 'Abandon this quest? Costs half the HP of failing.'}
                  {confirm === 'DELETE_QUEST' && 'Strike it from the board? No penalty.'}
                </span>
                <button className="btn btn-blood btn-sm" onClick={() => act(confirm)}>Yes</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>No</button>
              </div>
            ) : (
              <div className="quest-actions">
                {quest.status !== 'in_progress' && !locked && <button className="btn btn-ghost btn-sm" onClick={() => act('START_QUEST')}><Play /> Begin</button>}
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(quest)}><Pencil /> Amend</button>
                {quest.dueDate && (
                  <button className="btn btn-ghost btn-sm" disabled={(derived?.mp ?? 0) < warpCost}
                    onClick={() => dispatch({ type: 'USE_ABILITY', payload: { ability: 'time_warp', questId: quest.id } })}
                    title={`Time Warp: +1 day for ${warpCost} MP`}>
                    <Hourglass /> +1 day · {warpCost} MP
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirm('FAIL_QUEST')}><X /> Failed</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirm('ABANDON_QUEST')}><Undo2 /> Abandon</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirm('DELETE_QUEST')} aria-label="Delete"><Trash2 /></button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {!open && !compact && quest.bonusObjectives.length > 0 && (
        <ChevronDown size={14} style={{ position: 'absolute', bottom: 4, left: '50%', marginLeft: -7, color: 'var(--ink-faint)', opacity: .5 }} />
      )}
    </motion.article>
  );
}
