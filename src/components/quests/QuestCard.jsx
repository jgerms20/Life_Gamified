import { useState } from 'react';
import { useGame, CATEGORIES, DIFFICULTIES } from '../../context/GameContext';

function moonsRemaining(dueDate) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: 'OVERDUE', overdue: true };
  if (diff === 0) return { text: 'Due today', urgent: true };
  if (diff === 1) return { text: '1 moon remaining', urgent: true };
  return { text: `${diff} moons remaining` };
}

export default function QuestCard({ quest, onEdit }) {
  const { dispatch } = useGame();
  const [showActions, setShowActions] = useState(false);
  const [bonusChecked, setBonusChecked] = useState([]);
  const [confirming, setConfirming] = useState(null);

  const cat = CATEGORIES[quest.category] || CATEGORIES.health;
  const diff = DIFFICULTIES[quest.difficulty] || DIFFICULTIES.medium;
  const due = moonsRemaining(quest.dueDate);
  const isOverdue = due?.overdue;
  const isUrgent = due?.urgent;

  const hasBonus = quest.bonusObjectives?.length > 0;

  function toggleBonus(i) {
    setBonusChecked(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  }

  function handleComplete() {
    dispatch({
      type: 'COMPLETE_QUEST',
      payload: { questId: quest.id, bonusCompleted: bonusChecked },
    });
  }

  function handleStart() {
    dispatch({ type: 'START_QUEST', payload: quest.id });
  }

  function handleFail() {
    dispatch({ type: 'FAIL_QUEST', payload: quest.id });
    setConfirming(null);
  }

  function handleAbandon() {
    dispatch({ type: 'ABANDON_QUEST', payload: quest.id });
    setConfirming(null);
  }

  const statusColors = {
    available:   'rgba(212,175,55,0.15)',
    in_progress: 'rgba(50,80,180,0.15)',
    completed:   'rgba(50,160,50,0.15)',
    failed:      'rgba(160,50,50,0.15)',
  };

  return (
    <div
      style={{
        background: statusColors[quest.status] || statusColors.available,
        border: `1px solid ${cat.color}55`,
        borderLeft: `4px solid ${cat.color}`,
        borderRadius: '4px',
        padding: '14px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        animation: 'fade-in-up 0.3s ease both',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.3), 0 0 8px ${cat.color}33`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
      onClick={() => setShowActions(v => !v)}
    >
      {/* OVERDUE wax seal */}
      {isOverdue && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'radial-gradient(circle at 35% 35%, #cc3300, #8b1500)',
          color: '#f4e4bc', borderRadius: '50%', width: 38, height: 38,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-header)', fontSize: '7px', letterSpacing: '0.05em',
          textAlign: 'center', fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          ⚠<br/>URGENT
        </div>
      )}

      {/* Recurrence badge */}
      {quest.recurrence && quest.recurrence !== 'none' && (
        <div style={{
          position: 'absolute', top: 6, right: isOverdue ? 54 : 8,
          fontFamily: 'var(--font-header)', fontSize: '9px', letterSpacing: '0.05em',
          background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)',
          color: 'var(--gold-dark)', borderRadius: '2px', padding: '1px 5px',
        }}>
          🔄 {quest.recurrence}
        </div>
      )}

      {/* Top row: category + difficulty */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '14px' }}>{cat.icon}</span>
        <span style={{
          fontFamily: 'var(--font-header)', fontSize: '10px', letterSpacing: '0.1em',
          color: cat.color, textTransform: 'uppercase',
        }}>
          {cat.label}
        </span>
        <span style={{ marginLeft: 'auto', color: diff.color, fontSize: '12px', letterSpacing: '1px' }}>
          {diff.symbol}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--font-header)', fontSize: '15px',
        color: 'var(--parchment-light)', marginBottom: quest.description ? '5px' : '0',
        fontWeight: 600, paddingRight: isOverdue ? '44px' : '0',
      }}>
        {quest.title}
      </h3>

      {/* Description */}
      {quest.description && (
        <p style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: '13px', color: 'rgba(244,228,188,0.6)',
          lineHeight: 1.4, marginBottom: '6px',
        }}>
          {quest.description}
        </p>
      )}

      {/* Due date */}
      {due && (
        <div style={{
          fontFamily: 'var(--font-script)', fontSize: '13px',
          color: isOverdue ? '#ff5533' : isUrgent ? '#ffaa33' : 'rgba(244,228,188,0.5)',
          marginBottom: '4px',
        }}>
          📅 {due.text}
        </div>
      )}

      {/* XP reward */}
      <div style={{
        fontFamily: 'var(--font-header)', fontSize: '10px', letterSpacing: '0.08em',
        color: 'var(--gold-dark)', marginTop: '4px',
      }}>
        ⚡ {diff.xp} XP
        {hasBonus && <span style={{ color: 'rgba(212,175,55,0.5)' }}> + bonuses</span>}
      </div>

      {/* Expanded actions */}
      {showActions && (
        <div
          style={{ marginTop: '12px', borderTop: '1px solid rgba(212,175,55,0.2)', paddingTop: '10px' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Bonus objectives */}
          {hasBonus && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{
                fontFamily: 'var(--font-header)', fontSize: '10px',
                letterSpacing: '0.1em', color: 'var(--gold-dark)', marginBottom: '6px',
              }}>BONUS OBJECTIVES</p>
              {quest.bonusObjectives.map((obj, i) => (
                <label key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', marginBottom: '4px',
                }}>
                  <input
                    type="checkbox"
                    checked={bonusChecked.includes(i)}
                    onChange={() => toggleBonus(i)}
                    style={{ accentColor: 'var(--gold-leaf)' }}
                  />
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: '13px',
                    color: bonusChecked.includes(i) ? 'var(--gold-leaf)' : 'rgba(244,228,188,0.7)',
                    textDecoration: bonusChecked.includes(i) ? 'line-through' : 'none',
                  }}>
                    {obj}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--gold-dark)' }}>
                    +{Math.round(diff.xp * 0.25)} XP
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {confirming === 'fail' ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#ff5533', fontStyle: 'italic' }}>
                Mark as failed? (lose HP)
              </span>
              <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleFail}>Yes</button>
              <button className="btn btn-dark" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setConfirming(null)}>No</button>
            </div>
          ) : confirming === 'abandon' ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#ffaa33', fontStyle: 'italic' }}>
                Abandon this quest?
              </span>
              <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleAbandon}>Yes</button>
              <button className="btn btn-dark" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setConfirming(null)}>No</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {quest.status === 'available' && (
                <button className="btn btn-dark" style={{ padding: '5px 10px', fontSize: '10px' }} onClick={handleStart}>
                  ▶ Start
                </button>
              )}
              <button
                className="btn btn-gold"
                style={{ padding: '5px 10px', fontSize: '10px' }}
                onClick={handleComplete}
              >
                ✓ Complete
              </button>
              {onEdit && (
                <button className="btn btn-dark" style={{ padding: '5px 10px', fontSize: '10px' }} onClick={() => onEdit(quest)}>
                  ✎ Edit
                </button>
              )}
              <button
                className="btn"
                style={{ padding: '5px 10px', fontSize: '10px', background: 'rgba(139,37,0,0.2)', borderColor: 'rgba(139,37,0,0.4)', color: '#cc5533' }}
                onClick={() => setConfirming('fail')}
              >
                ✗ Fail
              </button>
              <button
                className="btn"
                style={{ padding: '5px 10px', fontSize: '10px', background: 'rgba(100,80,20,0.2)', borderColor: 'rgba(180,130,20,0.3)', color: 'rgba(212,175,55,0.6)' }}
                onClick={() => setConfirming('abandon')}
              >
                ↩ Abandon
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
