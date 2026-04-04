import { useEffect } from 'react';
import { useGame } from '../../context/GameContext';

export default function Notification() {
  const { state, dispatch } = useGame();
  const { notification } = state;

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 2500);
      return () => clearTimeout(t);
    }
  }, [notification, dispatch]);

  if (!notification) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '80px', right: '24px',
      zIndex: 1500, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', gap: '6px',
      animation: 'fade-in-up 0.3s ease both',
    }}>
      {notification.xp && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(45,27,14,0.95), rgba(26,14,8,0.95))',
          border: '1px solid var(--gold-leaf)',
          borderRadius: '4px', padding: '8px 16px',
          fontFamily: 'var(--font-header)', fontSize: '14px',
          color: 'var(--gold-bright)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 10px rgba(212,175,55,0.3)',
          textShadow: '0 0 8px rgba(212,175,55,0.5)',
        }}>
          ⚡ +{notification.xp} XP
        </div>
      )}
      {notification.gold && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(45,27,14,0.95), rgba(26,14,8,0.95))',
          border: '1px solid var(--gold-dark)',
          borderRadius: '4px', padding: '8px 16px',
          fontFamily: 'var(--font-header)', fontSize: '13px',
          color: '#d4af37',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          🪙 +{notification.gold} Gold
        </div>
      )}
    </div>
  );
}
