import { useState } from 'react';
import { useGame, CATEGORIES, DIFFICULTIES } from '../../context/GameContext';

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function QuestLog() {
  const { state } = useGame();
  const [filter, setFilter] = useState('all');

  let logs = state.completedQuests || [];
  if (filter !== 'all') logs = logs.filter(q => q.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid rgba(212,175,55,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: '14px',
          color: 'var(--gold-leaf)', letterSpacing: '0.05em',
        }}>
          Chronicle of Deeds
        </h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { v: 'all',       l: 'All' },
            { v: 'completed', l: '✓ Done' },
            { v: 'failed',    l: '✗ Failed' },
            { v: 'abandoned', l: '↩ Abandoned' },
          ].map(opt => (
            <button
              key={opt.v}
              onClick={() => setFilter(opt.v)}
              style={{
                fontFamily: 'var(--font-header)', fontSize: '10px',
                letterSpacing: '0.08em', padding: '3px 8px',
                background: filter === opt.v ? 'rgba(212,175,55,0.2)' : 'transparent',
                border: `1px solid ${filter === opt.v ? 'rgba(212,175,55,0.5)' : 'rgba(212,175,55,0.2)'}`,
                color: filter === opt.v ? 'var(--gold-leaf)' : 'rgba(212,175,55,0.5)',
                borderRadius: '3px', cursor: 'pointer',
              }}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '12px 16px' }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', opacity: 0.5 }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📖</div>
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '14px', color: 'rgba(244,228,188,0.5)' }}>
              No entries in the chronicle yet...
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {logs.map((quest, i) => (
              <LogEntry key={quest.id || i} quest={quest} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogEntry({ quest }) {
  const cat = CATEGORIES[quest.category] || CATEGORIES.health;
  const diff = DIFFICULTIES[quest.difficulty] || DIFFICULTIES.medium;

  const statusInfo = {
    completed: { icon: '✓', color: '#44aa44', label: 'Completed' },
    failed:    { icon: '✗', color: '#cc3333', label: 'Failed' },
    abandoned: { icon: '↩', color: '#aa8833', label: 'Abandoned' },
  }[quest.status] || { icon: '?', color: '#888', label: quest.status };

  const ts = quest.completedAt || quest.failedAt || quest.abandonedAt;

  return (
    <div style={{
      padding: '10px 14px',
      background: `rgba(0,0,0,0.2)`,
      border: `1px solid ${statusInfo.color}33`,
      borderLeft: `3px solid ${statusInfo.color}`,
      borderRadius: '3px',
      display: 'flex', alignItems: 'flex-start', gap: '10px',
    }}>
      {/* Status badge */}
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: `${statusInfo.color}22`, border: `1px solid ${statusInfo.color}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-header)', fontSize: '12px', color: statusInfo.color,
      }}>
        {statusInfo.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-header)', fontSize: '13px',
            color: 'var(--parchment-light)', fontWeight: 600,
          }}>
            {quest.title}
          </span>
          <span style={{ fontSize: '12px' }}>{cat.icon}</span>
          <span style={{ color: diff.color, fontSize: '11px' }}>{diff.symbol}</span>
        </div>

        {quest.description && (
          <p style={{
            fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '12px',
            color: 'rgba(244,228,188,0.45)', marginTop: '2px',
          }}>
            {quest.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-script)', fontSize: '12px',
            color: statusInfo.color, opacity: 0.8,
          }}>
            {statusInfo.label}
          </span>
          {ts && (
            <span style={{
              fontFamily: 'var(--font-script)', fontSize: '11px',
              color: 'rgba(244,228,188,0.35)',
            }}>
              {formatDate(ts)}
            </span>
          )}
          {quest.status === 'completed' && (
            <span style={{ fontFamily: 'var(--font-header)', fontSize: '10px', color: 'var(--gold-dark)' }}>
              ⚡ {diff.xp} XP earned
            </span>
          )}
          {quest.bonusCompleted?.length > 0 && (
            <span style={{ fontFamily: 'var(--font-header)', fontSize: '10px', color: 'var(--gold-dark)' }}>
              + {quest.bonusCompleted.length} bonuses
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
