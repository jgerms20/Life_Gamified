import { useState, useEffect } from 'react';
import { useGame, REWARD_TIERS } from '../../context/GameContext';

export default function RewardChest() {
  const { state, dispatch } = useGame();
  const { pendingReward } = state;
  const [phase, setPhase] = useState('shake'); // shake | open | show | done

  useEffect(() => {
    if (!pendingReward) return;
    setPhase('shake');
    const t1 = setTimeout(() => setPhase('open'), 1200);
    const t2 = setTimeout(() => setPhase('show'), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pendingReward]);

  if (!pendingReward) return null;

  const { triggered, tier, reward } = pendingReward;
  const tierInfo = REWARD_TIERS[tier] || REWARD_TIERS.common;

  function handleClaim() {
    setPhase('done');
    setTimeout(() => dispatch({ type: 'CLEAR_REWARD' }), 300);
  }

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 1800 }}
      onClick={phase === 'show' ? handleClaim : undefined}
    >
      <div style={{
        textAlign: 'center', padding: '40px',
        background: 'linear-gradient(135deg, #2d1b0e, #1a0e08)',
        border: '2px solid var(--gold-dark)',
        borderRadius: '8px',
        boxShadow: '0 0 60px rgba(0,0,0,0.8)',
        maxWidth: 420, width: '100%',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow for tier */}
        {triggered && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at center, ${tierInfo.glow}22 0%, transparent 65%)`,
            pointerEvents: 'none',
          }} />
        )}

        {/* Chest */}
        <div style={{
          fontSize: '80px',
          marginBottom: '16px',
          display: 'inline-block',
          animation: phase === 'shake'
            ? 'shake 0.8s ease infinite'
            : phase === 'open'
            ? 'bounce-in 0.5s ease both'
            : 'none',
          filter: triggered
            ? `drop-shadow(0 0 20px ${tierInfo.glow}) drop-shadow(0 0 40px ${tierInfo.glow}66)`
            : 'none',
          transition: 'filter 0.5s',
        }}>
          {phase === 'shake' ? '📦' : triggered ? '🎁' : '📦'}
        </div>

        {phase === 'show' && (
          <>
            {triggered ? (
              <>
                {/* Tier banner */}
                <div style={{
                  display: 'inline-block', marginBottom: '12px',
                  padding: '4px 20px',
                  background: `linear-gradient(135deg, ${tierInfo.color}22, ${tierInfo.color}44)`,
                  border: `1px solid ${tierInfo.color}`,
                  borderRadius: '20px',
                  fontFamily: 'var(--font-display)', fontSize: '12px',
                  color: tierInfo.glow, letterSpacing: '0.2em',
                  animation: 'bounce-in 0.4s ease both',
                }}>
                  {tierInfo.icon} {tier.toUpperCase()} REWARD
                </div>

                {reward ? (
                  <>
                    <h2 style={{
                      fontFamily: 'var(--font-display)', fontSize: '24px',
                      color: tierInfo.glow,
                      textShadow: `0 0 20px ${tierInfo.glow}`,
                      marginBottom: '8px',
                      animation: 'fade-in-up 0.5s 0.1s ease both',
                    }}>
                      {reward.name}
                    </h2>
                    {reward.description && (
                      <p style={{
                        fontFamily: 'var(--font-body)', fontStyle: 'italic',
                        fontSize: '16px', color: 'rgba(244,228,188,0.7)',
                        marginBottom: '20px', lineHeight: 1.4,
                        animation: 'fade-in-up 0.5s 0.2s ease both',
                      }}>
                        {reward.description}
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{
                    fontFamily: 'var(--font-body)', fontStyle: 'italic',
                    fontSize: '16px', color: tierInfo.glow,
                    marginBottom: '20px',
                  }}>
                    A {tier} reward awaits you!
                  </p>
                )}

                <button
                  className="btn btn-gold"
                  onClick={handleClaim}
                  style={{
                    padding: '12px 32px', fontSize: '14px', justifyContent: 'center',
                    animation: 'pulse-gold 1.5s ease-in-out infinite, fade-in-up 0.5s 0.3s ease both',
                  }}
                >
                  ✦ Claim Reward
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🪙</div>
                <p style={{
                  fontFamily: 'var(--font-display)', fontSize: '14px',
                  color: 'rgba(212,175,55,0.7)', marginBottom: '8px',
                  letterSpacing: '0.05em',
                }}>
                  The fates were not generous...
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)', fontStyle: 'italic',
                  fontSize: '14px', color: 'rgba(244,228,188,0.5)',
                  marginBottom: '16px',
                }}>
                  but your XP is eternal.
                </p>
                <button className="btn btn-dark" onClick={handleClaim} style={{ padding: '8px 24px' }}>
                  Continue
                </button>
              </>
            )}
          </>
        )}

        {phase === 'shake' && (
          <p style={{
            fontFamily: 'var(--font-script)', fontSize: '16px',
            color: 'rgba(212,175,55,0.6)', marginTop: '8px',
          }}>
            Fate stirs within...
          </p>
        )}
      </div>
    </div>
  );
}
