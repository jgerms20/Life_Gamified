import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, animate } from 'framer-motion';
import { Bot, Undo2 } from 'lucide-react';
import { useGame, useToasts } from '../lib/game';

function TickUp({ to, prefix = '+' }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: Math.min(1.4, .4 + to / 300), ease: [.2, .8, .3, 1], onUpdate: n => setV(Math.round(n)) });
    return () => c.stop();
  }, [to]);
  return <>{prefix}{v}</>;
}

function Toast({ t, onClose }) {
  const { dispatch } = useGame();
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    if (paused || open) return;
    const id = setTimeout(() => closeRef.current(), t.ttl);
    return () => clearTimeout(id);
  }, [paused, open, t.ttl]);

  return (
    <motion.div
      layout className={`toast ${t.kind}`}
      initial={{ x: 60, opacity: 0, scale: .96 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={{ x: 80, opacity: 0, transition: { duration: .2 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      role={t.kind === 'error' ? 'alert' : 'status'}
    >
      {t.kind === 'xp' ? (
        <>
          <div className="toast-row">
            <div className="xp-big"><TickUp to={t.xp} /> XP</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>Quest complete · +{t.gold}g</b>
              <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</p>
            </div>
            {t.undo && (
              <button className="btn btn-ghost on-dark btn-sm" onClick={() => { dispatch({ type: 'UNDO_HISTORY', payload: { id: t.undo } }, { silent: true }); onClose(); }} title="Undo">
                <Undo2 /> Undo
              </button>
            )}
          </div>
          {t.breakdown?.length > 1 && (
            <button className="link-btn" style={{ color: 'var(--gold)', marginTop: 6 }} onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'How it was earned'}</button>
          )}
          {open && (
            <div className="breakdown">
              {t.breakdown.map((b, i) => <div key={i}><span>{b.label}</span><b>{b.amount > 0 ? '+' : ''}{b.amount}</b></div>)}
            </div>
          )}
        </>
      ) : (
        <div className="toast-row">
          {t.kind === 'agent' && <Bot size={22} color="#b9b0ff" style={{ flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>
            <b>{t.title}</b>
            {t.body && <p>{t.body}</p>}
          </div>
          <button onClick={onClose} aria-label="Dismiss" style={{ color: 'rgba(244,228,188,.45)', alignSelf: 'flex-start' }}>✕</button>
        </div>
      )}
      {!paused && !open && <motion.div className="timer" initial={{ width: '100%' }} animate={{ width: 0 }} transition={{ duration: t.ttl / 1000, ease: 'linear' }} />}
    </motion.div>
  );
}

export default function Toasts() {
  const { toasts, dismissToast } = useToasts();
  return (
    <div className="toasts">
      <AnimatePresence initial={false}>
        {toasts.map(t => <Toast key={t.id} t={t} onClose={() => dismissToast(t.id)} />)}
      </AnimatePresence>
    </div>
  );
}
