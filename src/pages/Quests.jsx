import { useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Feather, ScrollText, Undo2, Bot } from 'lucide-react';
import { CATEGORIES, DIFFICULTIES, questDue, addDays } from '../lib/engine';
import { useGame, useLayout } from '../lib/game';
import { parseQuick } from '../lib/quickparse';
import QuestCard from '../components/QuestCard';
import QuestContract from '../components/QuestContract';
import { Flourish } from '../components/Ornaments';

function QuickAdd({ onOpenContract }) {
  const { dispatch, today } = useGame();
  const [text, setText] = useState('');
  const parsed = useMemo(() => parseQuick(text, today), [text, today]);

  function submit(e) {
    e.preventDefault();
    if (!parsed.title) return;
    const r = dispatch({ type: 'ADD_QUEST', payload: { title: parsed.title, category: parsed.category, difficulty: parsed.difficulty, dueDate: parsed.dueDate, recurrence: parsed.recurrence } });
    if (r.ok) setText('');
  }

  return (
    <form onSubmit={submit}>
      <div className="quick-add">
        <Feather size={18} color="var(--ink-faint)" />
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Post a quest… e.g. Run 5k #health !hard" aria-label="Quick add quest" />
        <button className="btn btn-ink btn-sm" disabled={!parsed.title}>Post</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpenContract(parsed.title ? { ...parsed, title: parsed.title } : null)} title="Open the full quest contract">
          <ScrollText /> Contract
        </button>
      </div>
      {text && parsed.tokens.length > 0 ? (
        <div className="quick-preview">
          {parsed.category && <span className="tag" style={{ color: CATEGORIES[parsed.category].color }}>{CATEGORIES[parsed.category].icon} {CATEGORIES[parsed.category].label}</span>}
          {parsed.difficulty && <span className="tag">{DIFFICULTIES[parsed.difficulty].label} · {DIFFICULTIES[parsed.difficulty].xp} XP</span>}
          {parsed.dueDate && <span className="tag">Due {parsed.dueDate}</span>}
          {parsed.recurrence && <span className="tag recur">{parsed.recurrence}</span>}
        </div>
      ) : (
        <p className="quick-hints">Shorthand: <code>#health</code> <code>!hard</code> <code>@tomorrow</code> <code>@fri</code> <code>*daily</code></p>
      )}
    </form>
  );
}

function Group({ title, quests, onEdit, compact }) {
  if (!quests.length) return null;
  return (
    <section>
      <h4 className="section-title">{title} <span className="count">{quests.length}</span></h4>
      <div className="quest-list">
        <AnimatePresence mode="popLayout" initial={false}>
          {quests.map(q => <QuestCard key={q.id} quest={q} onEdit={onEdit} compact={compact} />)}
        </AnimatePresence>
      </div>
    </section>
  );
}

export function QuestBoard() {
  const { state, today } = useGame();
  const layout = useLayout();
  const [cat, setCat] = useState('all');
  const [contract, setContract] = useState(undefined);
  const quests = state.quests.filter(q => cat === 'all' || q.category === cat);

  const groups = useMemo(() => {
    const byDue = (a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || b.createdAt - a.createdAt;
    const now = [], doing = [], soon = [], later = [];
    for (const q of [...quests].sort(byDue)) {
      const due = questDue(q, today);
      if (due && (due.overdue || due.today)) now.push(q);
      else if (q.status === 'in_progress') doing.push(q);
      else if (q.dueDate && q.dueDate <= addDays(today, 7)) soon.push(q);
      else later.push(q);
    }
    return { now, doing, soon, later };
  }, [quests, today]);

  const counts = Object.fromEntries(Object.keys(CATEGORIES).map(k => [k, state.quests.filter(q => q.category === k).length]));
  const compact = layout === 'phone';

  return (
    <>
      <div className="eyebrow">The tavern board</div>
      <h2 className="page-title">Active Quests</h2>
      <p className="page-sub">{state.quests.length ? `${state.quests.length} contract${state.quests.length === 1 ? '' : 's'} pinned · ${groups.now.length} demand attention today` : 'The board is bare. Pin your first contract.'}</p>
      <div style={{ marginTop: 18 }}><QuickAdd onOpenContract={(draft) => setContract(draft || {})} /></div>

      <div className="chips" style={{ marginTop: 16 }}>
        <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>All · {state.quests.length}</button>
        {Object.entries(CATEGORIES).map(([k, c]) => (
          <button key={k} className={`chip ${cat === k ? 'on' : ''}`} style={{ '--chip': c.color }} onClick={() => setCat(cat === k ? 'all' : k)}>
            {c.icon} {c.label} · {counts[k]}
          </button>
        ))}
      </div>

      {quests.length === 0 ? (
        <div className="empty">
          <div className="art">📜</div>
          <h3>{state.quests.length ? 'Nothing in this domain' : 'No quests yet'}</h3>
          <p>{state.quests.length ? 'Try another category, or post a new contract.' : 'Write something you mean to do today — even something small. Your scribe can fill the board for you too.'}</p>
          <button className="btn btn-gold" onClick={() => setContract({})}>Draw up a contract</button>
        </div>
      ) : (
        <LayoutGroup>
          <Group title="Before nightfall" quests={groups.now} onEdit={setContract} compact={compact} />
          <Group title="Under way" quests={groups.doing} onEdit={setContract} compact={compact} />
          <Group title="This week" quests={groups.soon} onEdit={setContract} compact={compact} />
          <Group title="Whenever the road allows" quests={groups.later} onEdit={setContract} compact={compact} />
        </LayoutGroup>
      )}
      {compact && quests.length > 0 && <p className="quick-hints" style={{ textAlign: 'center', marginTop: 16 }}>Tip: swipe a quest right to seal it.</p>}

      <AnimatePresence>
        {contract !== undefined && <QuestContract quest={contract} onClose={() => setContract(undefined)} />}
      </AnimatePresence>
    </>
  );
}

function dayLabel(day, today) {
  if (day === today) return 'Today';
  if (day === addDays(today, -1)) return 'Yesterday';
  return new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function Entry({ h }) {
  const { dispatch } = useGame();
  const [open, setOpen] = useState(false);
  const cat = CATEGORIES[h.category];
  const icon = h.outcome === 'completed' ? '✓' : h.outcome === 'failed' ? '✗' : '↩';
  return (
    <motion.div layout="position" className="entry" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
      <span className={`entry-icon ${h.outcome}`} style={{ '--cat': cat?.color }}>{icon}</span>
      <div style={{ minWidth: 0, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div className="entry-title">
          {h.title}
          {h.actor === 'agent' && <span className="who"><Bot size={9} style={{ verticalAlign: -1 }} /> scribe</span>}
        </div>
        <div className="entry-sub">
          {cat?.label} · {DIFFICULTIES[h.difficulty]?.label}
          {h.bonuses?.done ? ` · ${h.bonuses.done} bonus` : ''}
          {' · '}{new Date(h.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              {h.note && <p className="hand" style={{ fontSize: 18, color: 'var(--ink-soft)', marginTop: 4 }}>“{h.note}”</p>}
              {h.breakdown?.length > 0 && (
                <div className="breakdown">
                  {h.breakdown.map((b, i) => <div key={i}><span>{b.label}</span><b>+{b.amount}</b></div>)}
                  <div><span>Gold</span><b>+{h.gold}g</b></div>
                </div>
              )}
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={(e) => { e.stopPropagation(); dispatch({ type: 'UNDO_HISTORY', payload: { id: h.id } }); }}>
                <Undo2 /> Strike from the chronicle
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className={`entry-xp ${h.outcome !== 'completed' ? 'neg' : ''}`}>
        {h.outcome === 'completed' ? `+${h.xp}` : h.damage ? `−${h.damage} HP` : '—'}
      </span>
    </motion.div>
  );
}

export function Chronicle() {
  const { state, today, derived } = useGame();
  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(40);
  const history = state.history.filter(h => filter === 'all' || h.outcome === filter);
  const shown = history.slice(0, limit);
  const days = [];
  for (const h of shown) {
    const last = days[days.length - 1];
    if (last && last.day === h.day) last.items.push(h);
    else days.push({ day: h.day, items: [h] });
  }
  const todays = state.history.filter(h => h.day === today && h.outcome === 'completed');
  const xpToday = todays.reduce((a, h) => a + h.xp, 0);
  const dueLeft = state.quests.filter(q => q.dueDate && q.dueDate <= today).length;
  const scribeNotes = state.feed.filter(f => f.actor === 'agent' && f.kind === 'quest_added' && Date.now() - f.at < 2 * 86400e3).slice(0, 4);

  return (
    <>
      <div className="eyebrow">The chronicle</div>
      <h2 className="page-title">Deeds of {state.character?.name}</h2>
      <p className="page-sub drop-cap" style={{ marginTop: 8 }}>
        {todays.length
          ? `Today you have completed ${todays.length} deed${todays.length === 1 ? '' : 's'} and earned ${xpToday} experience.`
          : derived?.streak
            ? `Your ${derived.streak}-day streak burns on — one deed today keeps it alight.`
            : 'Here the scribe records each quest you complete, fail or abandon.'}
      </p>

      <div className="today-card">
        <div className="today-stats">
          <div><b>{todays.length}</b><span>Deeds today</span></div>
          <div><b>{xpToday}</b><span>XP today</span></div>
          <div><b>{dueLeft === 0 && todays.length ? '🌅' : dueLeft}</b><span>{dueLeft === 0 && todays.length ? (state.today.perfectAwarded ? 'Perfect day' : 'All clear') : 'Due today'}</span></div>
        </div>
      </div>

      {scribeNotes.length > 0 && (
        <>
          <h4 className="section-title">From your scribe</h4>
          {scribeNotes.map(f => (
            <p key={f.id} style={{ fontSize: 15.5, color: 'var(--ink-soft)', marginBottom: 4 }}>
              <Bot size={13} style={{ verticalAlign: -2, color: 'var(--arcane)' }} /> {f.text}
            </p>
          ))}
        </>
      )}

      <div className="chips" style={{ marginTop: 20 }}>
        {[['all', 'All'], ['completed', 'Completed'], ['failed', 'Failed'], ['abandoned', 'Abandoned']].map(([k, l]) => (
          <button key={k} className={`chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      {days.length === 0 ? (
        <div className="empty"><div className="art">🪶</div><h3>The ink is still wet</h3><p>Complete a quest and the scribe will set it down here.</p></div>
      ) : (
        days.map(d => (
          <section key={d.day}>
            <div className="day-heading">{dayLabel(d.day, today)} <span className="hand">{d.items.filter(i => i.outcome === 'completed').reduce((a, i) => a + i.xp, 0)} xp</span></div>
            {d.items.map(h => <Entry key={h.id} h={h} />)}
          </section>
        ))
      )}
      {history.length > limit && <div style={{ textAlign: 'center', marginTop: 14 }}><button className="btn btn-ghost btn-sm" onClick={() => setLimit(l => l + 60)}>Turn back further</button></div>}
      <Flourish />
    </>
  );
}
