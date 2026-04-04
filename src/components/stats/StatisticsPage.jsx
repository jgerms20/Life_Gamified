import { useGame, CATEGORIES, DIFFICULTIES, levelFromXp } from '../../context/GameContext';

function HeatmapCell({ count }) {
  const intensity = count === 0 ? 0 : Math.min(1, count / 5);
  const bg = count === 0
    ? 'rgba(255,255,255,0.03)'
    : `rgba(212,175,55,${0.2 + intensity * 0.7})`;
  return (
    <div
      title={count > 0 ? `${count} quest${count > 1 ? 's' : ''}` : 'No quests'}
      style={{
        width: 11, height: 11, borderRadius: 2,
        background: bg, border: '1px solid rgba(0,0,0,0.2)',
        flexShrink: 0,
      }}
    />
  );
}

export default function StatisticsPage() {
  const { state } = useGame();
  const { character, stats, completedQuests = [] } = state;

  const level = levelFromXp(character.xp || 0);
  const dailyLog = stats?.dailyLog || {};

  // Build 12-week heatmap
  const today = new Date();
  const cells = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    cells.push({ date: key, count: dailyLog[key] || 0 });
  }

  // Category distribution
  const catCounts = {};
  for (const q of completedQuests.filter(q => q.status === 'completed')) {
    catCounts[q.category] = (catCounts[q.category] || 0) + 1;
  }
  const totalDone = completedQuests.filter(q => q.status === 'completed').length;

  // Difficulty breakdown
  const diffCounts = {};
  for (const q of completedQuests.filter(q => q.status === 'completed')) {
    diffCounts[q.difficulty] = (diffCounts[q.difficulty] || 0) + 1;
  }

  const maxDiffCount = Math.max(1, ...Object.values(diffCounts));

  return (
    <div className="scroll-area" style={{ height: '100%', padding: '16px' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: '18px',
        color: 'var(--gold-leaf)', marginBottom: '20px', letterSpacing: '0.05em',
      }}>
        Chronicles & Statistics
      </h2>

      {/* Key stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Level',         value: level,                        icon: '⭐' },
          { label: 'Total XP',      value: (stats?.totalXpEarned || 0).toLocaleString(), icon: '⚡' },
          { label: 'Quests Done',   value: stats?.questsCompleted || 0,  icon: '✓' },
          { label: 'Quests Failed', value: stats?.questsFailed || 0,     icon: '✗' },
          { label: 'Best Streak',   value: `${stats?.longestStreak || 0}d`, icon: '🔥' },
          { label: 'Gold Earned',   value: (character.gold || 0).toLocaleString(), icon: '🪙' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '12px 10px', textAlign: 'center',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: '4px',
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '18px',
              color: 'var(--gold-bright)', lineHeight: 1,
            }}>
              {s.value}
            </div>
            <div style={{
              fontFamily: 'var(--font-header)', fontSize: '9px',
              letterSpacing: '0.12em', color: 'rgba(244,228,188,0.4)',
              marginTop: '3px', textTransform: 'uppercase',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Activity Heatmap */}
      <div style={{
        marginBottom: '20px', padding: '16px',
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '6px',
      }}>
        <h3 style={sectionTitle}>Quest Activity — Last 12 Weeks</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: '10px' }}>
          {cells.map((c, i) => <HeatmapCell key={i} count={c.count} />)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
          <span style={{ fontFamily: 'var(--font-header)', fontSize: '9px', color: 'rgba(244,228,188,0.3)' }}>Less</span>
          {[0, 1, 3, 5, 8].map(n => <HeatmapCell key={n} count={n} />)}
          <span style={{ fontFamily: 'var(--font-header)', fontSize: '9px', color: 'rgba(244,228,188,0.3)' }}>More</span>
        </div>
      </div>

      {/* Category Distribution */}
      <div style={{
        marginBottom: '20px', padding: '16px',
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '6px',
      }}>
        <h3 style={sectionTitle}>Quest Distribution by Category</h3>
        <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const count = catCounts[key] || 0;
            const pct = totalDone > 0 ? Math.round((count / totalDone) * 100) : 0;
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{
                    fontFamily: 'var(--font-header)', fontSize: '11px',
                    color: cat.color, letterSpacing: '0.08em',
                  }}>
                    {cat.icon} {cat.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-header)', fontSize: '11px', color: 'rgba(244,228,188,0.5)' }}>
                    {count} ({pct}%)
                  </span>
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.3)', borderRadius: '4px', height: '6px',
                  border: `1px solid ${cat.color}33`, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: `linear-gradient(90deg, ${cat.color}88, ${cat.color})`,
                    transition: 'width 0.5s ease',
                    boxShadow: `0 0 4px ${cat.color}66`,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div style={{
        marginBottom: '20px', padding: '16px',
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '6px',
      }}>
        <h3 style={sectionTitle}>Difficulty Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px', marginTop: '12px' }}>
          {Object.entries(DIFFICULTIES).map(([key, diff]) => {
            const count = diffCounts[key] || 0;
            const pct = Math.round((count / Math.max(1, totalDone)) * 100);
            const barH = Math.round((count / maxDiffCount) * 60);
            return (
              <div key={key} style={{ textAlign: 'center' }}>
                <div style={{
                  height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  marginBottom: '4px',
                }}>
                  <div style={{
                    width: '28px', height: `${Math.max(4, barH)}px`,
                    background: `linear-gradient(to top, ${diff.color}88, ${diff.color})`,
                    borderRadius: '3px 3px 0 0',
                    boxShadow: `0 0 4px ${diff.color}44`,
                    transition: 'height 0.5s ease',
                    minHeight: '4px',
                  }} />
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: '16px',
                  color: diff.color, fontWeight: 700,
                }}>{count}</div>
                <div style={{
                  fontFamily: 'var(--font-header)', fontSize: '9px',
                  letterSpacing: '0.05em', color: 'rgba(244,228,188,0.4)',
                }}>
                  {diff.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personal Records */}
      <div style={{
        padding: '16px',
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '6px',
      }}>
        <h3 style={sectionTitle}>Personal Records</h3>
        <div style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
          {[
            { label: 'Highest Level Reached',    value: level },
            { label: 'Total Gold Accumulated',   value: `🪙 ${(character.gold || 0).toLocaleString()}` },
            { label: 'Legendary Quests Slain',   value: diffCounts.legendary || 0 },
            { label: 'Epic Quests Completed',    value: diffCounts.epic || 0 },
            { label: 'Active Daily Streak',      value: `🔥 ${character.streak || 0} days` },
          ].map(r => (
            <div key={r.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0', borderBottom: '1px solid rgba(212,175,55,0.1)',
            }}>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: '14px',
                color: 'rgba(244,228,188,0.6)', fontStyle: 'italic',
              }}>
                {r.label}
              </span>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '15px',
                color: 'var(--gold-leaf)', fontWeight: 700,
              }}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const sectionTitle = {
  fontFamily: 'var(--font-header)', fontSize: '12px',
  letterSpacing: '0.2em', color: 'var(--gold-dark)',
  textTransform: 'uppercase',
};
