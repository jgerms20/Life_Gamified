import { useGame, TALENT_PATHS, levelFromXp } from '../../context/GameContext';

export default function TalentsPage() {
  const { state, dispatch } = useGame();
  const { character } = state;

  const available = character.talentPointsAvailable || 0;
  const earned    = character.talentPoints || [];
  const level     = levelFromXp(character.xp || 0);

  function spend(path) {
    if (available <= 0) return;
    if (earned.includes(path)) return;
    dispatch({ type: 'SPEND_TALENT_POINT', payload: path });
  }

  return (
    <div className="scroll-area" style={{ height: '100%', padding: '16px' }}>
      {/* Header */}
      <div style={{
        textAlign: 'center', marginBottom: '24px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(26,26,62,0.8), rgba(10,10,30,0.7))',
        border: '1px solid rgba(106,74,255,0.4)', borderRadius: '6px',
        boxShadow: '0 0 20px rgba(106,74,255,0.1)',
      }}>
        <div style={{
          fontFamily: 'var(--font-header)', fontSize: '10px', letterSpacing: '0.3em',
          color: 'rgba(106,74,255,0.7)', marginBottom: '6px',
        }}>
          ✦ ARCANE TALENTS ✦
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '20px',
          color: 'var(--parchment-light)', letterSpacing: '0.05em',
        }}>
          Talent Tree
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: '13px', color: 'rgba(244,228,188,0.5)', marginTop: '6px',
        }}>
          Earn talent points every 5 levels by completing quests
        </p>

        {/* Points display */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          marginTop: '12px', padding: '8px 20px',
          background: available > 0 ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${available > 0 ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '20px',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--gold-bright)' }}>
            {available}
          </span>
          <span style={{
            fontFamily: 'var(--font-header)', fontSize: '11px',
            letterSpacing: '0.15em', color: 'var(--gold-dark)',
          }}>
            TALENT POINTS AVAILABLE
          </span>
        </div>

        <p style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: '12px', color: 'rgba(244,228,188,0.3)',
          marginTop: '8px',
        }}>
          Next point at level {Math.ceil((level + 1) / 5) * 5}
        </p>
      </div>

      {/* Talent grid */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {Object.entries(TALENT_PATHS).map(([key, talent]) => {
          const isLearned = earned.includes(key);
          const canLearn  = !isLearned && available > 0;
          return (
            <TalentCard
              key={key}
              talent={talent}
              isLearned={isLearned}
              canLearn={canLearn}
              onLearn={() => spend(key)}
            />
          );
        })}
      </div>

      {/* Lore section */}
      <div style={{
        marginTop: '24px', padding: '14px 16px',
        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(212,175,55,0.1)',
        borderRadius: '6px',
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: '13px', color: 'rgba(244,228,188,0.4)', lineHeight: 1.6,
          textAlign: 'center',
        }}>
          "Talent points are gifted by the ancient Council of Elders every fifth level,
          a recognition of your growing mastery and dedication to the art of life."
        </p>
      </div>
    </div>
  );
}

function TalentCard({ talent, isLearned, canLearn, onLearn }) {
  const glowColor = isLearned ? 'rgba(212,175,55,0.4)' : 'rgba(106,74,255,0.2)';

  return (
    <div style={{
      padding: '16px 18px',
      background: isLearned
        ? 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.08))'
        : 'rgba(0,0,0,0.3)',
      border: `1px solid ${isLearned ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '6px',
      boxShadow: isLearned ? `0 0 16px ${glowColor}` : 'none',
      display: 'flex', alignItems: 'center', gap: '16px',
      transition: 'all 0.2s',
    }}>
      {/* Icon */}
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: isLearned
          ? 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(212,175,55,0.15))'
          : 'rgba(106,74,255,0.1)',
        border: `2px solid ${isLearned ? 'rgba(212,175,55,0.6)' : 'rgba(106,74,255,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', flexShrink: 0,
        boxShadow: isLearned ? '0 0 12px rgba(212,175,55,0.3)' : 'none',
      }}>
        {talent.icon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-header)', fontSize: '13px',
          color: isLearned ? 'var(--gold-leaf)' : 'var(--parchment-light)',
          marginBottom: '3px', letterSpacing: '0.05em',
        }}>
          {talent.label}
          {isLearned && (
            <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--gold-dark)' }}>✓ LEARNED</span>
          )}
        </div>
        <p style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: '13px', color: 'rgba(244,228,188,0.6)',
        }}>
          {talent.description}
        </p>
      </div>

      {!isLearned && (
        <button
          className="btn"
          onClick={onLearn}
          disabled={!canLearn}
          style={{
            padding: '7px 14px', fontSize: '11px', flexShrink: 0,
            background: canLearn
              ? 'linear-gradient(135deg, rgba(106,74,255,0.3), rgba(106,74,255,0.15))'
              : 'rgba(255,255,255,0.05)',
            borderColor: canLearn ? 'rgba(106,74,255,0.6)' : 'rgba(255,255,255,0.1)',
            color: canLearn ? '#9a88ff' : 'rgba(244,228,188,0.2)',
            cursor: canLearn ? 'pointer' : 'not-allowed',
          }}
        >
          {canLearn ? '✦ Learn' : '🔒 Locked'}
        </button>
      )}
    </div>
  );
}
