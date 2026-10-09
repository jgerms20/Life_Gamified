/**
 * The journal store: local-first state with cloud sync.
 *
 * Every tap is applied instantly with the shared engine and saved to
 * localStorage. When signed in, changes are pushed to Supabase with an
 * optimistic version check. If your agent wrote in the meantime, we pull its
 * version and replay your pending taps on top — with the same timestamps and
 * dice rolls, so the chest you saw opening is the chest you keep.
 */
import { applyAction, createInitialState, migrate, EngineError } from './engine';
import { supabase } from './supabase';

const LS_STATE = 'lg_v2_state';
const LS_META = 'lg_v2_meta';
const LS_BACKUP = 'lg_v2_device_backup';
const LS_V1 = 'life_gamified_v1';

export const deviceTimeZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
};

const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };

function loadLocal() {
  const saved = read(LS_STATE);
  if (saved) return { state: migrate(saved), meta: read(LS_META) || {} };
  const v1 = read(LS_V1);
  if (v1) return { state: migrate(v1, { timeZone: deviceTimeZone() }), meta: {}, migrated: true };
  return { state: createInitialState({ timeZone: deviceTimeZone() }), meta: {} };
}

function recordingRng() {
  const values = [];
  const fn = () => { const v = Math.random(); values.push(v); return v; };
  fn.values = values;
  return fn;
}
function replayRng(values = []) {
  let i = 0;
  return () => (i < values.length ? values[i++] : Math.random());
}

export function createStore() {
  const loaded = loadLocal();
  let state = loaded.state;
  let version = loaded.meta.version || 0;
  let userId = loaded.meta.userId || null;
  let queue = Array.isArray(loaded.meta.pending) ? loaded.meta.pending : [];
  let session = null;
  let authReady = false;
  let sync = 'local'; // local | syncing | synced | offline | error
  let syncError = null;
  let channel = null;
  let flushing = false;
  let retryTimer = null;
  const listeners = new Set();
  const eventListeners = new Set();

  let snapshot;
  const makeSnapshot = () => ({
    state, sync, syncError, session, authReady, userId,
    pending: queue.length, hasDeviceBackup: !!read(LS_BACKUP), migrated: !!loaded.migrated,
  });
  snapshot = makeSnapshot();

  const emit = () => { snapshot = makeSnapshot(); listeners.forEach(l => l()); };
  const persist = () => {
    write(LS_STATE, state);
    write(LS_META, { version, userId, pending: queue });
  };
  const setSync = (s, err = null) => { sync = s; syncError = err; emit(); };
  const announce = (payload) => eventListeners.forEach(l => l(payload));

  // ── Local actions ──────────────────────────────────────────────────────
  function dispatch(action) {
    const rng = recordingRng();
    const now = Date.now();
    let r;
    try {
      r = applyAction(state, action, { now, rng, actor: 'human' });
    } catch (e) {
      if (e instanceof EngineError) return { ok: false, error: e };
      throw e;
    }
    state = r.state;
    if (userId) queue.push({ action, now, rng: rng.values });
    persist();
    emit();
    if (userId) flush();
    return { ok: true, events: r.events, result: r.result };
  }

  // ── Cloud ──────────────────────────────────────────────────────────────
  async function fetchRemote(uid = userId) {
    const { data, error } = await supabase.from('lg_journals').select('state, version').eq('user_id', uid).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function saveRemote(s, v) {
    if (v === 0) {
      const { error } = await supabase.from('lg_journals').insert({ user_id: userId, state: s, version: 1, updated_by: 'human' });
      if (!error) return 1;
      if (error.code === '23505') return null; // someone created it first
      throw error;
    }
    const { data, error } = await supabase.from('lg_journals')
      .update({ state: s, version: v + 1, updated_by: 'human' })
      .eq('user_id', userId).eq('version', v).select('version');
    if (error) throw error;
    return data?.length ? v + 1 : null;
  }

  function replayOnto(base) {
    let s = migrate(base);
    const kept = [];
    for (const item of queue) {
      try {
        s = applyAction(s, item.action, { now: item.now, rng: replayRng(item.rng), actor: 'human' }).state;
        kept.push(item);
      } catch (e) {
        // e.g. your agent already completed the quest you just tapped — skip it.
        console.info('Skipped a tap that no longer applies:', item.action.type, e.message);
      }
    }
    queue = kept;
    return s;
  }

  async function flush() {
    if (flushing || !userId) return;
    flushing = true;
    clearTimeout(retryTimer);
    setSync('syncing');
    try {
      let guard = 0;
      while (queue.length && guard++ < 8) {
        const count = queue.length;
        const saved = await saveRemote(state, version);
        if (saved) {
          version = saved;
          queue.splice(0, count);
        } else {
          const remote = await fetchRemote();
          const before = state;
          state = replayOnto(remote?.state ?? before);
          version = remote?.version ?? 0;
          noticeAgentActivity(before, state);
        }
        persist();
        emit();
      }
      setSync(queue.length ? 'error' : 'synced');
    } catch (e) {
      const offline = !navigator.onLine || /fetch|network/i.test(String(e?.message));
      setSync(offline ? 'offline' : 'error', offline ? null : String(e?.message || e));
      retryTimer = setTimeout(flush, offline ? 8000 : 15000);
    } finally {
      flushing = false;
    }
  }

  /** Pull the latest cloud journal (e.g. after your agent wrote to it). */
  async function pull() {
    if (!userId || flushing) return;
    if (queue.length) return flush();
    try {
      const remote = await fetchRemote();
      if (remote && remote.version > version) {
        const before = state;
        state = migrate(remote.state);
        version = remote.version;
        persist();
        noticeAgentActivity(before, state);
      }
      setSync('synced');
    } catch {
      setSync(navigator.onLine ? 'error' : 'offline');
    }
  }

  function noticeAgentActivity(before, after) {
    const seen = new Set((before.feed || []).map(f => f.id));
    const fresh = (after.feed || []).filter(f => !seen.has(f.id) && f.actor === 'agent');
    if (fresh.length) announce({ type: 'agent', entries: fresh.reverse() });
  }

  function subscribe(uid) {
    if (channel) supabase.removeChannel(channel);
    channel = supabase
      .channel(`lg-journal-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lg_journals', filter: `user_id=eq.${uid}` }, (payload) => {
        const v = payload.new?.version;
        if (!v || v > version) pull();
      })
      .subscribe();
  }

  async function attach(uid) {
    setSync('syncing');
    try {
      const remote = await fetchRemote(uid);
      const sameUser = userId === uid;
      if (remote) {
        if (sameUser) {
          if (queue.length) {
            flush();
          } else if (remote.version !== version) {
            const before = state;
            state = migrate(remote.state);
            version = remote.version;
            noticeAgentActivity(before, state);
          }
        } else if (!remote.state?.character && state.character) {
          // The cloud journal is empty but this device has a hero: keep it.
          version = remote.version;
          queue = [{ action: { type: 'NOOP' }, now: Date.now(), rng: [] }];
        } else {
          if (state.character) write(LS_BACKUP, { state, savedAt: Date.now() });
          state = migrate(remote.state);
          version = remote.version;
          queue = [];
        }
        userId = uid;
      } else {
        // First sign-in: this device's journal becomes the cloud journal.
        userId = uid;
        version = 0;
        queue = [{ action: { type: 'NOOP' }, now: Date.now(), rng: [] }];
      }
      persist();
      emit();
      subscribe(uid);
      if (queue.length) await flush();
      else setSync('synced');
    } catch (e) {
      setSync('error', String(e?.message || e));
    }
  }

  function detach() {
    if (channel) supabase.removeChannel(channel);
    channel = null;
    userId = null;
    version = 0;
    queue = [];
    persist();
    setSync('local');
  }

  // ── Auth wiring ────────────────────────────────────────────────────────
  supabase.auth.getSession().then(({ data }) => {
    session = data.session;
    authReady = true;
    if (session?.user) attach(session.user.id);
    else if (userId) detach();
    else emit();
  });
  supabase.auth.onAuthStateChange((event, s) => {
    const prev = session?.user?.id;
    session = s;
    authReady = true;
    if (s?.user && s.user.id !== prev) attach(s.user.id);
    if (!s && prev) detach();
    emit();
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => (queue.length ? flush() : pull()));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pull(); });
  }

  return {
    subscribe: (l) => { listeners.add(l); return () => listeners.delete(l); },
    getSnapshot: () => snapshot,
    onEvent: (l) => { eventListeners.add(l); return () => eventListeners.delete(l); },
    dispatch,
    pull,
    flush,
    restoreDeviceBackup() {
      const b = read(LS_BACKUP);
      if (!b) return { ok: false };
      const r = dispatch({ type: 'REPLACE_STATE', payload: { state: b.state } });
      if (r.ok) localStorage.removeItem(LS_BACKUP);
      return r;
    },
    discardDeviceBackup() { localStorage.removeItem(LS_BACKUP); emit(); },
    async signOut() { await supabase.auth.signOut(); },
    resetEverything() {
      [LS_STATE, LS_META, LS_BACKUP, LS_V1].forEach(k => localStorage.removeItem(k));
    },
  };
}
