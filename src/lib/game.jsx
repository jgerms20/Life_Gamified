import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createStore } from './store';
import { derive, dayKey } from './engine';
import { sfx, setSoundEnabled } from './sound';

const store = createStore();
const GameCtx = createContext(null);
const ToastCtx = createContext(null);

export function GameProvider({ children }) {
  const snap = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const toast = useCallback((t) => {
    const id = ++seq.current;
    setToasts(list => [...list.slice(-4), { id, ttl: 4200, ...t }]);
    return id;
  }, []);
  const dismissToast = useCallback((id) => setToasts(list => list.filter(t => t.id !== id)), []);

  useEffect(() => { setSoundEnabled(snap.state.settings?.sound !== false); }, [snap.state.settings?.sound]);

  // Your agent wrote something: tell the human, gently.
  useEffect(() => store.onEvent((e) => {
    if (e.type !== 'agent') return;
    const done = e.entries.filter(f => f.kind === 'completed');
    const xp = done.reduce((a, f) => a + (f.xp || 0), 0);
    toast({
      kind: 'agent',
      title: 'Your scribe updated the journal',
      body: done.length
        ? `${done.length === 1 ? done[0].text : `${done.length} deeds recorded`}${xp ? ` · +${xp} XP` : ''}`
        : e.entries[0].text,
      ttl: 6000,
    });
  }), [toast]);

  const dispatch = useCallback((action, opts = {}) => {
    const r = store.dispatch(action);
    if (!r.ok) {
      if (!opts.silent) toast({ kind: 'error', title: 'The quill refuses', body: r.error.message });
      sfx.fail();
      return r;
    }
    const completed = r.events.find(e => e.type === 'quest_completed');
    if (completed && !opts.silent) {
      sfx.complete();
      toast({
        kind: 'xp', xp: completed.xp, gold: completed.gold, breakdown: completed.breakdown,
        title: completed.title, undo: completed.historyId, ttl: 6500,
      });
    }
    if (r.events.some(e => e.type === 'quest_failed' || e.type === 'quest_abandoned')) sfx.fail();
    return r;
  }, [toast]);

  const value = useMemo(() => {
    const s = snap.state;
    const d = s.character ? derive(s) : null;
    const today = dayKey(Date.now(), s.settings?.timeZone);
    return { ...snap, state: s, derived: d, today, dispatch, store };
  }, [snap, dispatch]);

  return (
    <GameCtx.Provider value={value}>
      <ToastCtx.Provider value={{ toasts, toast, dismissToast }}>{children}</ToastCtx.Provider>
    </GameCtx.Provider>
  );
}

export const useGame = () => useContext(GameCtx);
export const useToasts = () => useContext(ToastCtx);

/** Track the viewport so layouts can switch between spread, page and phone. */
export function useLayout() {
  const get = () => {
    const w = typeof window === 'undefined' ? 1200 : window.innerWidth;
    return w >= 1100 ? 'spread' : w >= 720 ? 'page' : 'phone';
  };
  const [mode, setMode] = useState(get);
  useEffect(() => {
    const on = () => setMode(get());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return mode;
}

export function useReducedMotion(state) {
  const [media, setMedia] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!m) return;
    const on = () => setMedia(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return media || !!state?.settings?.reducedMotion;
}
