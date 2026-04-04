import { useState } from 'react';
import { useGame, CATEGORIES, DIFFICULTIES } from '../../context/GameContext';

const RECURRENCE_OPTIONS = [
  { value: 'none',    label: 'One-time' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function QuestModal({ onClose, editQuest = null }) {
  const { dispatch } = useGame();

  const [title, setTitle]               = useState(editQuest?.title || '');
  const [description, setDescription]  = useState(editQuest?.description || '');
  const [category, setCategory]        = useState(editQuest?.category || 'health');
  const [difficulty, setDifficulty]    = useState(editQuest?.difficulty || 'medium');
  const [dueDate, setDueDate]          = useState(editQuest?.dueDate || '');
  const [recurrence, setRecurrence]    = useState(editQuest?.recurrence || 'none');
  const [bonuses, setBonuses]          = useState(editQuest?.bonusObjectives || ['']);
  const [error, setError]              = useState('');

  const cat = CATEGORIES[category];
  const diff = DIFFICULTIES[difficulty];

  function handleAddBonus() {
    setBonuses(prev => [...prev, '']);
  }
  function handleBonusChange(i, val) {
    setBonuses(prev => prev.map((b, idx) => idx === i ? val : b));
  }
  function handleRemoveBonus(i) {
    setBonuses(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit() {
    if (!title.trim()) { setError('A quest must have a title, scribe.'); return; }
    const cleanBonuses = bonuses.filter(b => b.trim());

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      dueDate: dueDate || null,
      recurrence,
      bonusObjectives: cleanBonuses,
    };

    if (editQuest) {
      dispatch({ type: 'UPDATE_QUEST', payload: { ...editQuest, ...payload } });
    } else {
      dispatch({ type: 'ADD_QUEST', payload });
    }
    onClose();
  }

  const xpDisplay = diff.xp + (bonuses.filter(b => b.trim()).length * Math.round(diff.xp * 0.25));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="parchment-bg on-parchment animate-fade-in-up"
        style={{
          width: '100%', maxWidth: 560,
          borderRadius: '6px',
          border: '2px solid var(--brown-mid)',
          boxShadow: '0 20px 80px rgba(0,0,0,0.8)',
          maxHeight: '90vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #2d1b0e, #1a0e08)',
          padding: '18px 24px', borderBottom: '2px solid var(--gold-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-header)', fontSize: '10px', letterSpacing: '0.3em',
              color: 'var(--gold-dark)', marginBottom: '3px',
            }}>
              {editQuest ? '✦ AMEND QUEST' : '✦ NEW QUEST CONTRACT'}
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '18px',
              color: 'var(--parchment-light)', fontWeight: 700,
            }}>
              {editQuest ? 'Edit Quest' : 'Post a New Quest'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid rgba(212,175,55,0.3)',
              color: 'rgba(244,228,188,0.6)', fontSize: '18px', cursor: 'pointer',
              width: 32, height: 32, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        <div className="scroll-area" style={{ padding: '24px', flex: 1 }}>
          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Quest Title *</label>
            <input
              className="input-base"
              placeholder="Name thy quest..."
              value={title}
              onChange={e => { setTitle(e.target.value); setError(''); }}
              style={{ fontFamily: 'var(--font-script)', fontSize: '17px' }}
            />
            {error && <p style={{ color: 'var(--ink-red)', fontSize: '13px', marginTop: '4px', fontStyle: 'italic' }}>{error}</p>}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Description <span style={{ opacity: 0.5 }}>(flavour text)</span></label>
            <textarea
              className="input-base"
              placeholder="Describe the nature of this quest..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', resize: 'vertical', fontSize: '14px' }}
            />
          </div>

          {/* Category & Difficulty row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select className="input-base" value={category} onChange={e => setCategory(e.target.value)}>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Difficulty</label>
              <select className="input-base" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                {Object.entries(DIFFICULTIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.symbol} {v.label} ({v.xp} XP)</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Recurrence */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input
                className="input-base"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Recurrence</label>
              <select className="input-base" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
                {RECURRENCE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bonus Objectives */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Bonus Objectives <span style={{ opacity: 0.5 }}>(+25% XP each)</span></label>
            {bonuses.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input
                  className="input-base"
                  placeholder={`Bonus objective ${i + 1}...`}
                  value={b}
                  onChange={e => handleBonusChange(i, e.target.value)}
                  style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}
                />
                <button
                  onClick={() => handleRemoveBonus(i)}
                  style={{
                    background: 'rgba(139,37,0,0.3)', border: '1px solid rgba(139,37,0,0.5)',
                    color: '#cc5533', borderRadius: '3px', cursor: 'pointer',
                    padding: '0 10px', flexShrink: 0, fontSize: '14px',
                  }}
                >✕</button>
              </div>
            ))}
            <button
              onClick={handleAddBonus}
              style={{
                background: 'rgba(212,175,55,0.1)', border: '1px dashed rgba(212,175,55,0.4)',
                color: 'var(--gold-dark)', borderRadius: '3px', cursor: 'pointer',
                padding: '6px 14px', width: '100%',
                fontFamily: 'var(--font-header)', fontSize: '11px', letterSpacing: '0.1em',
              }}
            >
              + Add Bonus Objective
            </button>
          </div>

          {/* XP Preview */}
          <div style={{
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: '4px', padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{cat.icon}</span>
              <span style={{
                fontFamily: 'var(--font-header)', fontSize: '11px',
                color: 'var(--gold-dark)', letterSpacing: '0.1em',
              }}>
                {cat.label} · {diff.symbol} {diff.label}
              </span>
            </div>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: '16px',
              color: 'var(--gold-leaf)', fontWeight: 700,
            }}>
              ⚡ {xpDisplay} XP
            </span>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(74,55,40,0.5)',
          background: 'rgba(212,184,133,0.3)',
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
        }}>
          <button className="btn btn-parchment" onClick={onClose}>
            Discard
          </button>
          <button
            className="btn btn-dark"
            onClick={handleSubmit}
            style={{ minWidth: '140px', justifyContent: 'center' }}
          >
            ✒ {editQuest ? 'Update Quest' : 'Sign & Post Quest'}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontFamily: 'var(--font-header)',
  fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
  color: 'var(--brown-mid)', marginBottom: '5px',
};
