import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { CATEGORIES, DIFFICULTIES, DIFFICULTY_ORDER } from '../lib/engine';
import { useGame } from '../lib/game';
import { Flourish, SignatureStroke } from './Ornaments';

export default function QuestContract({ quest, onClose }) {
  const { state, dispatch } = useGame();
  const editing = !!quest?.id;
  const [f, setF] = useState(() => ({
    title: quest?.title || '',
    description: quest?.description || '',
    category: quest?.category || 'health',
    difficulty: quest?.difficulty || 'medium',
    dueDate: quest?.dueDate || '',
    recurrence: quest?.recurrence || 'none',
    bonusObjectives: quest?.bonusObjectives?.map(b => b.text) || [],
    prerequisites: quest?.prerequisites || [],
  }));
  const [signing, setSigning] = useState(false);
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const diff = DIFFICULTIES[f.difficulty];
  const bonuses = f.bonusObjectives.filter(b => b.trim());
  const preview = diff.xp + Math.round(diff.xp * .25 * bonuses.length);
  const others = state.quests.filter(q => q.id !== quest?.id);

  function sign(e) {
    e?.preventDefault();
    if (!f.title.trim()) return;
    setSigning(true);
    const payload = { ...f, bonusObjectives: bonuses, dueDate: f.dueDate || null };
    if (editing) {
      payload.bonusObjectives = bonuses.map(text => ({ text, done: quest.bonusObjectives.find(b => b.text === text)?.done || false }));
    }
    setTimeout(() => {
      const r = dispatch(editing ? { type: 'UPDATE_QUEST', payload: { id: quest.id, ...payload } } : { type: 'ADD_QUEST', payload });
      if (r.ok) onClose();
      else setSigning(false);
    }, 650);
  }

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <motion.form
        className="contract"
        onSubmit={sign}
        initial={{ y: 40, scaleY: .2, opacity: 0, transformOrigin: 'top' }}
        animate={{ y: 0, scaleY: 1, opacity: 1 }}
        exit={{ y: 30, opacity: 0, scale: .96 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        role="dialog" aria-modal="true" aria-labelledby="contract-title"
      >
        <button type="button" className="close-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <div className="contract-head">
          <div className="eyebrow">{editing ? 'Amendment to a contract' : 'A new contract'}</div>
          <h2 id="contract-title" className="page-title" style={{ fontSize: 28 }}>The Quest Contract</h2>
          <Flourish width={150} />
        </div>

        <div className="contract-body">
          <label className="field">
            <span>The quest</span>
            <input className="input hand-input" autoFocus value={f.title} onChange={e => set('title', e.target.value)} placeholder="Name thy undertaking…" maxLength={160} />
          </label>
          <label className="field">
            <span>Flavour & particulars</span>
            <textarea className="textarea" rows={2} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Where, why, what glory awaits…" />
          </label>

          <div className="field">
            <span>Domain</span>
            <div className="cat-picker">
              {Object.entries(CATEGORIES).map(([k, c]) => (
                <button type="button" key={k} className={f.category === k ? 'on' : ''} style={{ '--cat': c.color }} onClick={() => set('category', k)}>
                  <div>{c.icon}</div><b>{c.label}</b>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Peril</span>
            <div className="diff-picker">
              {DIFFICULTY_ORDER.map(k => {
                const d = DIFFICULTIES[k];
                return (
                  <button type="button" key={k} className={f.difficulty === k ? 'on' : ''} onClick={() => set('difficulty', k)}>
                    <b>{d.label}</b><span>{d.stars < 1 ? '½★' : '★'.repeat(d.stars)}</span><small>{d.xp} xp</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="row">
            <label className="field">
              <span>Due by</span>
              <input className="input" type="date" value={f.dueDate || ''} onChange={e => set('dueDate', e.target.value)} />
            </label>
            <label className="field">
              <span>Returns</span>
              <select className="select input" value={f.recurrence} onChange={e => set('recurrence', e.target.value)}>
                <option value="none">Once</option>
                <option value="daily">Every day</option>
                <option value="weekly">Every week</option>
                <option value="monthly">Every month</option>
              </select>
            </label>
          </div>

          <div className="field">
            <span>Bonus objectives · +25% XP each</span>
            {f.bonusObjectives.map((b, i) => (
              <div key={i} className="row" style={{ marginBottom: 6, alignItems: 'center' }}>
                <input className="input" value={b} placeholder={`Bonus ${i + 1}`} onChange={e => set('bonusObjectives', f.bonusObjectives.map((x, j) => j === i ? e.target.value : x))} />
                <button type="button" className="btn btn-ghost btn-icon" style={{ flex: 'none' }} onClick={() => set('bonusObjectives', f.bonusObjectives.filter((_, j) => j !== i))} aria-label="Remove bonus"><X size={14} /></button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('bonusObjectives', [...f.bonusObjectives, ''])}><Plus /> Add a bonus objective</button>
          </div>

          {others.length > 0 && (
            <label className="field">
              <span>Quest chain · must finish first</span>
              <select className="select input" multiple value={f.prerequisites} onChange={e => set('prerequisites', Array.from(e.target.selectedOptions, o => o.value))} style={{ minHeight: 76 }}>
                {others.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
              </select>
            </label>
          )}

          <div className="xp-preview">
            <span className="muted" style={{ fontStyle: 'italic' }}>{CATEGORIES[f.category].icon} {CATEGORIES[f.category].label} · {diff.label}{f.recurrence !== 'none' ? ` · ${f.recurrence}` : ''}</span>
            <b>⚡ {preview} XP</b>
          </div>
        </div>

        <div className="contract-foot">
          <div className="signature">
            {signing ? state.character?.name : <span className="muted" style={{ fontSize: 18 }}>sign below…</span>}
            <SignatureStroke draw={signing} />
          </div>
          <button className="btn btn-ink" type="submit" disabled={!f.title.trim() || signing}>
            🪶 {editing ? 'Seal the amendment' : 'Sign & accept'}
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  );
}
