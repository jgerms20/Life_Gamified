import { useGame, levelFromXp } from '../../context/GameContext';

const ACHIEVEMENTS = [
  // Progression
  { id: 'first_steps',  label: 'First Steps',     icon: '👣', desc: 'Complete your first quest', category: 'progression' },
  { id: 'apprentice',   label: 'Apprentice',       icon: '📜', desc: 'Reach Level 5',            category: 'progression' },
  { id: 'journeyman',   label: 'Journeyman',       icon: '🗡️', desc: 'Reach Level 10',           category: 'progression' },
  { id: 'expert',       label: 'Expert',           icon: '⚔️', desc: 'Reach Level 25',           category: 'progression' },
  { id: 'master',       label: 'Master',           icon: '🏆', desc: 'Reach Level 50',           category: 'progression' },
  { id: 'grandmaster',  label: 'Grandmaster',      icon: '👑', desc: 'Reach Level 100',          category: 'progression' },

  // Dedication
  { id: 'week_streak',    label: 'Week Warrior',   icon: '🔥', desc: '7-day streak',             category: 'dedication' },
  { id: 'month_streak',   label: 'Month of Fire',  icon: '💥', desc: '30-day streak',            category: 'dedication' },
  { id: 'century_streak', label: 'Iron Will',      icon: '⚡', desc: '100-day streak',           category: 'dedication' },
  { id: 'year_streak',    label: 'Legend',         icon: '✨', desc: '365-day streak',           category: 'dedication' },

  // Mastery
  { id: 'health_master',  label: 'Vitality Sage',    icon: '❤️', desc: '50 Health quests',       category: 'mastery' },
  { id: 'intel_master',   label: 'Arcane Scholar',   icon: '📚', desc: '50 Intelligence quests', category: 'mastery' },
  { id: 'money_master',   label: 'Golden Merchant',  icon: '🪙', desc: '50 Money quests',        category: 'mastery' },
  { id: 'rel_master',     label: 'Soul of Charisma', icon: '💞', desc: '50 Relationship quests', category: 'mastery' },
];

const CATEGORY_LABELS = {
  progression: { label: 'Hall of Progress', color: '#d4af37' },
  dedication:  { label: 'Fires of Dedication', color: '#ff6622' },
  mastery:     { label: 'Mastery Emblems', color: '#4488ff' },
};

export default function AchievementsPage() {
  const { state } = useGame();
  const earned = state.achievements || [];
  const level = levelFromXp(state.character.xp || 0);

  const grouped = {};
  for (const ach of ACHIEVEMENTS) {
    if (!grouped[ach.category]) grouped[ach.category] = [];
    grouped[ach.category].push(ach);
  }

  return (
    <div className="scroll-area" style={{ height: '100%', padding: '16px' }}>
      {/* Trophy Room header */}
      <div style={{
        textAlign: 'center', marginBottom: '24px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(45,27,14,0.8), rgba(26,14,8,0.6))',
        border: '1px solid var(--gold-dark)', borderRadius: '6px',
        position: 'relative',
      }}>
        <div style={{
          fontFamily: 'var(--font-header)', fontSize: '10px', letterSpacing: '0.3em',
          color: 'var(--gold-dark)', marginBottom: '6px',
        }}>
          ✦ TROPHY CHAMBER ✦
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '22px',
          color: 'var(--gold-bright)', textShadow: '0 0 20px rgba(255,215,0,0.3)',
        }}>
          Hall of Achievements
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: '14px', color: 'rgba(244,228,188,0.5)', marginTop: '6px',
        }}>
          {earned.length} of {ACHIEVEMENTS.length} trophies claimed
        </p>

        {/* Progress bar */}
        <div style={{ marginTop: '10px' }}>
          <div className="xp-bar-wrap">
            <div className="xp-bar-fill" style={{ width: `${Math.round((earned.length / ACHIEVEMENTS.length) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Achievement groups */}
      {Object.entries(grouped).map(([cat, achs]) => {
        const catInfo = CATEGORY_LABELS[cat];
        return (
          <div key={cat} style={{ marginBottom: '28px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
              paddingBottom: '6px', borderBottom: `1px solid ${catInfo.color}44`,
            }}>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: '14px',
                color: catInfo.color, letterSpacing: '0.05em',
              }}>
                {catInfo.label}
              </h3>
              <span style={{
                fontFamily: 'var(--font-header)', fontSize: '10px',
                color: 'rgba(244,228,188,0.3)',
              }}>
                {achs.filter(a => earned.includes(a.id)).length}/{achs.length}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
              {achs.map(ach => {
                const isEarned = earned.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    style={{
                      padding: '14px 12px',
                      background: isEarned
                        ? `linear-gradient(135deg, ${catInfo.color}22, ${catInfo.color}11)`
                        : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${isEarned ? catInfo.color + '66' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '4px',
                      textAlign: 'center',
                      filter: isEarned ? 'none' : 'grayscale(0.8) opacity(0.5)',
                      transition: 'all 0.2s',
                      boxShadow: isEarned ? `0 0 12px ${catInfo.color}33` : 'none',
                    }}
                  >
                    <div style={{
                      fontSize: '28px', marginBottom: '6px',
                      filter: isEarned ? `drop-shadow(0 0 8px ${catInfo.color})` : 'none',
                    }}>
                      {isEarned ? ach.icon : '🔒'}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-header)', fontSize: '11px',
                      color: isEarned ? catInfo.color : 'rgba(244,228,188,0.4)',
                      marginBottom: '3px', letterSpacing: '0.05em',
                    }}>
                      {ach.label}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-body)', fontStyle: 'italic',
                      fontSize: '11px', color: 'rgba(244,228,188,0.35)',
                    }}>
                      {ach.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
