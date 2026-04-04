import { useGame, CLASSES, xpForLevel, levelFromXp, xpIntoCurrentLevel } from '../../context/GameContext';

const STAT_CONFIG = {
  vitality:  { label: 'Vitality',      icon: '❤️',  desc: 'Affects HP',          color: '#cc2222' },
  wisdom:    { label: 'Wisdom',         icon: '📚',  desc: 'Affects MP',          color: '#2244cc' },
  fortune:   { label: 'Fortune',        icon: '🪙',  desc: 'Affects Gold',        color: '#ccaa22' },
  charisma:  { label: 'Charisma',       icon: '💞',  desc: 'Affects Reputation',  color: '#cc22cc' },
};

function StatBar({ value, max = 100, color }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)', borderRadius: '4px', height: '5px',
      border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${(value / max) * 100}%`,
        background: `linear-gradient(90deg, ${color}aa, ${color})`,
        borderRadius: '4px',
        boxShadow: `0 0 4px ${color}66`,
        transition: 'width 0.5s ease',
      }} />
    </div>
  );
}

function ResourceBar({ value, max, color, label }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: 'var(--font-header)', fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(244,228,188,0.7)' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-header)', fontSize: '11px', color }}>
          {value}/{max}
        </span>
      </div>
      <div style={{
        background: 'rgba(0,0,0,0.4)', borderRadius: '6px', height: '8px',
        border: `1px solid ${color}44`, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 6px ${color}66`,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

export default function CharacterSheet() {
  const { state } = useGame();
  const { character } = state;
  const cls = CLASSES[character.class];

  const level = levelFromXp(character.xp || 0);
  const xpInLevel = xpIntoCurrentLevel(character.xp || 0);
  const xpNeeded = xpForLevel(level + 1);
  const xpPct = Math.round((xpInLevel / xpNeeded) * 100);

  const vitality  = character.vitality  || 10;
  const wisdom    = character.wisdom    || 10;
  const fortune   = character.fortune   || 10;
  const charisma  = character.charisma  || 10;

  const maxHp = 100 + vitality * 5 + (character.talentPoints?.includes('resilience') ? 20 : 0);
  const maxMp = 50 + wisdom * 3;
  const hp = Math.min(character.hp ?? maxHp, maxHp);
  const mp = Math.min(character.mp ?? maxMp, maxMp);

  const catQuests = character.categoryQuests || {};
  const totalQuests = Object.values(catQuests).reduce((a, b) => a + b, 0);

  return (
    <div className="scroll-area" style={{ height: '100%', padding: '20px' }}>
      {/* Hero Title Section */}
      <div style={{
        textAlign: 'center', marginBottom: '24px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(45,27,14,0.8), rgba(26,14,8,0.6))',
        border: '1px solid var(--gold-dark)',
        borderRadius: '6px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--gold-dark), transparent)',
        }} />

        {/* Class badge */}
        <div style={{
          display: 'inline-block', background: 'rgba(212,175,55,0.15)',
          border: '1px solid var(--gold-dark)', borderRadius: '20px',
          padding: '3px 14px', marginBottom: '10px',
          fontFamily: 'var(--font-header)', fontSize: '11px',
          letterSpacing: '0.15em', color: 'var(--gold-leaf)',
        }}>
          {cls.icon} {cls.label.toUpperCase()}
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '24px',
          color: 'var(--parchment-light)', lineHeight: 1.1,
        }}>
          {character.name}
        </h2>
        {character.title && (
          <p style={{
            fontFamily: 'var(--font-script)', fontSize: '16px',
            color: 'var(--gold-leaf)', fontStyle: 'italic', marginTop: '4px',
          }}>
            {character.title}
          </p>
        )}

        {/* Level Badge */}
        <div style={{
          margin: '14px auto 0',
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
          background: 'linear-gradient(135deg, #c9972a, #d4af37)',
          borderRadius: '50%', width: '64px', height: '64px',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(212,175,55,0.5)',
        }}>
          <span style={{ fontFamily: 'var(--font-header)', fontSize: '8px', letterSpacing: '0.1em', color: 'rgba(45,27,14,0.7)', fontWeight: 600 }}>LVL</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 900, color: '#2d1b0e', lineHeight: 1 }}>{level}</span>
        </div>

        {/* XP Bar */}
        <div style={{ marginTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'var(--font-header)', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(212,175,55,0.6)' }}>
              EXPERIENCE
            </span>
            <span style={{ fontFamily: 'var(--font-header)', fontSize: '10px', color: 'var(--gold-dark)' }}>
              {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} ({xpPct}%)
            </span>
          </div>
          <div className="xp-bar-wrap">
            <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </div>

      {/* Resources: HP / MP / Gold */}
      <div style={{
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: '6px', padding: '16px', marginBottom: '16px',
        display: 'grid', gap: '12px',
      }}>
        <ResourceBar value={hp} max={maxHp} color="#cc3333" label="HP — VITALITY" />
        <ResourceBar value={mp} max={maxMp} color="#3366cc" label="MP — ARCANE POWER" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-header)', fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(244,228,188,0.7)' }}>
            GOLD TREASURY
          </span>
          <span style={{ fontFamily: 'var(--font-script)', fontSize: '18px', color: 'var(--gold-leaf)' }}>
            🪙 {(character.gold || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Primary Stats */}
      <div style={{
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: '6px', padding: '16px', marginBottom: '16px',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-header)', fontSize: '12px', letterSpacing: '0.2em',
          color: 'var(--gold-dark)', marginBottom: '14px', textTransform: 'uppercase',
        }}>
          ✦ Primary Attributes
        </h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {Object.entries(STAT_CONFIG).map(([key, cfg]) => {
            const val = character[key] || 10;
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>{cfg.icon}</span>
                    <span style={{ fontFamily: 'var(--font-header)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--parchment-mid)' }}>
                      {cfg.label.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(244,228,188,0.4)', fontStyle: 'italic' }}>
                      — {cfg.desc}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: cfg.color, fontWeight: 700 }}>
                    {val}
                  </span>
                </div>
                <StatBar value={val} max={100} color={cfg.color} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Progress */}
      <div style={{
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: '6px', padding: '16px', marginBottom: '16px',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-header)', fontSize: '12px', letterSpacing: '0.2em',
          color: 'var(--gold-dark)', marginBottom: '14px', textTransform: 'uppercase',
        }}>
          ✦ Quest Mastery
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { key: 'health',        label: 'Health',        icon: '❤️',  color: '#cc3333' },
            { key: 'intelligence',  label: 'Intelligence',  icon: '📚',  color: '#3366cc' },
            { key: 'money',         label: 'Fortune',       icon: '🪙',  color: '#ccaa22' },
            { key: 'relationships', label: 'Charisma',      icon: '💞',  color: '#cc33cc' },
          ].map(({ key, label, icon, color }) => {
            const count = catQuests[key] || 0;
            const mastery = Math.floor(count / 10);
            return (
              <div key={key} style={{
                background: 'rgba(0,0,0,0.2)', borderRadius: '4px', padding: '10px',
                border: `1px solid ${color}33`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-header)', fontSize: '10px', color: 'rgba(244,228,188,0.7)' }}>
                    {icon} {label.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color }}>{count}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-script)', fontSize: '12px', color: 'var(--gold-dark)' }}>
                  {'⭐'.repeat(Math.min(mastery, 5))} Rank {mastery}
                </div>
              </div>
            );
          })}
        </div>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(244,228,188,0.5)',
          marginTop: '10px', textAlign: 'center', fontStyle: 'italic',
        }}>
          {totalQuests} total quests completed · {state.stats.questsFailed || 0} abandoned
        </p>
      </div>

      {/* Streak */}
      <div style={{
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: '6px', padding: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{
            fontFamily: 'var(--font-header)', fontSize: '12px', letterSpacing: '0.2em',
            color: 'var(--gold-dark)', textTransform: 'uppercase',
          }}>Daily Streak</h3>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(244,228,188,0.5)',
            fontStyle: 'italic', marginTop: '2px',
          }}>
            Best: {state.stats?.longestStreak || 0} days
          </p>
        </div>
        <div style={{
          fontFamily: 'var(--font-script)', fontSize: '32px',
          color: character.streak > 0 ? '#ff6622' : 'rgba(244,228,188,0.3)',
        }}>
          🔥 {character.streak || 0}
        </div>
      </div>
    </div>
  );
}
