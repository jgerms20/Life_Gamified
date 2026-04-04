import { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';

const FLAVOUR = [
  "The fates smile upon thee, champion!",
  "Thy power grows beyond mortal reckoning!",
  "The realm trembles at thy ascension!",
  "Ancient forces acknowledge your might!",
  "Legends will speak of this day!",
  "The stars align in your honour!",
  "You have transcended the ordinary!",
  "New horizons await, brave soul!",
];

export default function LevelUp() {
  const { state, dispatch } = useGame();
  const { levelUpEvent } = state;
  const [visible, setVisible] = useState(false);
  const [flavour, setFlavour] = useState('');

  useEffect(() => {
    if (levelUpEvent) {
      setFlavour(FLAVOUR[Math.floor(Math.random() * FLAVOUR.length)]);
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(() => dispatch({ type: 'CLEAR_LEVEL_UP' }), 400);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [levelUpEvent, dispatch]);

  if (!levelUpEvent) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        animation: `fade-in-up 0.4s ease both`,
        backdropFilter: 'blur(6px)',
      }}
      onClick={() => { setVisible(false); dispatch({ type: 'CLEAR_LEVEL_UP' }); }}
    >
      {/* Radial burst */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.25) 0%, transparent 65%)',
        animation: 'pulse-gold 1.5s ease-in-out infinite',
      }} />

      <div
        className="animate-bounce-in"
        style={{
          textAlign: 'center', padding: '48px 64px',
          background: 'linear-gradient(135deg, #2d1b0e, #1a0e08)',
          border: '2px solid #d4af37',
          borderRadius: '8px',
          boxShadow: '0 0 60px rgba(212,175,55,0.4), 0 0 120px rgba(212,175,55,0.15)',
          maxWidth: '480px', position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Ornamental top line */}
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '2px',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
        }} />

        <div style={{
          fontFamily: 'var(--font-header)', fontSize: '13px', letterSpacing: '0.3em',
          color: 'var(--gold-dark)', textTransform: 'uppercase', marginBottom: '12px',
        }}>
          ✦ Achievement Unlocked ✦
        </div>

        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '52px', fontWeight: '900',
          color: 'var(--gold-bright)',
          textShadow: '0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.4)',
          lineHeight: 1, marginBottom: '8px',
          animation: 'glow-pulse 1s ease-in-out infinite',
        }}>
          LEVEL UP!
        </div>

        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '72px', fontWeight: '900',
          color: '#fff',
          textShadow: '0 0 20px rgba(255,255,255,0.5)',
          lineHeight: 1, marginBottom: '20px',
        }}>
          {levelUpEvent.level}
        </div>

        <div style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: '18px', color: 'var(--parchment-light)',
          marginBottom: '16px', lineHeight: 1.4,
        }}>
          "{flavour}"
        </div>

        <div style={{
          fontFamily: 'var(--font-header)', fontSize: '12px',
          color: 'rgba(212,175,55,0.6)', letterSpacing: '0.1em',
        }}>
          +1 to all stats · click to continue
        </div>
      </div>
    </div>
  );
}
