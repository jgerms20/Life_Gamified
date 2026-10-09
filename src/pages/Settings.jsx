import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellOff, Copy, Check, KeyRound, LogOut, Download, Upload, Trash2, Cloud, Bot } from 'lucide-react';
import { useGame } from '../lib/game';
import { supabase } from '../lib/supabase';
import { API_URL } from '../lib/config';
import { deviceTimeZone } from '../lib/store';
import { pushSupport, currentSubscription, enablePush, disablePush, sendTestPush } from '../lib/push';
import AuthPanel from '../components/AuthPanel';
import { Flourish } from '../components/Ornaments';

function Toggle({ on, onChange, label, hint }) {
  return (
    <div className="kv" style={{ alignItems: 'center' }}>
      <span>{label}{hint && <small style={{ display: 'block', fontSize: 13 }} className="muted">{hint}</small>}</span>
      <button className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} aria-label={label} />
    </div>
  );
}

function CopyBlock({ text, label }) {
  const [done, setDone] = useState(false);
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <div className="field" style={{ marginBottom: 4 }}><span>{label}</span></div>}
      <div className="codeblock">
        {text}
        <button className="btn btn-ghost on-dark btn-sm copy" onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}>
          {done ? <Check /> : <Copy />} {done ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hourLabel = h => new Date(2026, 0, 1, h).toLocaleTimeString([], { hour: 'numeric' });

export function SettingsLeft() {
  const { state, dispatch, session, sync, syncError, pending, hasDeviceBackup, store } = useGame();
  const n = state.settings.notifications;
  const setN = (patch) => dispatch({ type: 'UPDATE_SETTINGS', payload: { notifications: patch } }, { silent: true });
  const [push, setPush] = useState({ status: 'checking' });
  const tz = deviceTimeZone();

  useEffect(() => {
    const support = pushSupport();
    if (support !== 'ok') { setPush({ status: support }); return; }
    currentSubscription().then(sub => setPush({ status: sub ? 'on' : 'off' })).catch(() => setPush({ status: 'off' }));
  }, [session]);

  async function togglePush() {
    setPush(p => ({ ...p, busy: true, msg: null }));
    try {
      if (push.status === 'on') { await disablePush(); setPush({ status: 'off' }); }
      else { await enablePush(session); setPush({ status: 'on', msg: 'Notifications enabled on this device.' }); }
    } catch (e) { setPush(p => ({ ...p, busy: false, msg: e.message })); }
  }
  async function test() {
    setPush(p => ({ ...p, busy: true, msg: null }));
    try {
      const sent = await sendTestPush(session);
      setPush(p => ({ ...p, busy: false, msg: sent ? 'Test sent — it should arrive in a moment.' : 'No subscribed devices found. Enable notifications first.' }));
    } catch (e) { setPush(p => ({ ...p, busy: false, msg: e.message })); }
  }

  return (
    <>
      <div className="eyebrow">Guild registry</div>
      <h2 className="page-title">Settings</h2>
      <p className="page-sub">Where the journal lives, and how it may reach you.</p>

      <h4 className="section-title"><Cloud size={14} /> Cloud journal</h4>
      {session ? (
        <div className="panel">
          <div className="kv"><span>Signed in as</span><b style={{ fontFamily: 'var(--f-body)', fontSize: 15 }}>{session.user.email}</b></div>
          <div className="kv"><span>Status</span><b>{{ synced: '✓ Saved to the cloud', syncing: 'Saving…', offline: 'Offline — queued', error: 'Retrying…', local: 'Local only' }[sync]}{pending ? ` · ${pending} pending` : ''}</b></div>
          {syncError && <p className="notice warn" style={{ margin: '8px 0' }}>{syncError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => store.pull()}>Refresh now</button>
            <button className="btn btn-ghost btn-sm" onClick={() => store.signOut()}><LogOut /> Sign out</button>
          </div>
        </div>
      ) : (
        <div className="panel">
          <p style={{ marginBottom: 12 }}>Your journal currently lives only in this browser. Sign in to keep it safe, open it on any device, and let your AI scribe update it.</p>
          <AuthPanel />
        </div>
      )}
      {hasDeviceBackup && (
        <div className="notice" style={{ marginBottom: 14 }}>
          This device had its own journal before you signed in. It was set aside safely.
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-ink btn-sm" onClick={() => confirm('Replace the cloud journal with this device’s older journal?') && store.restoreDeviceBackup()}>Use this device’s journal</button>
            <button className="btn btn-ghost btn-sm" onClick={() => store.discardDeviceBackup()}>Discard it</button>
          </div>
        </div>
      )}

      <h4 className="section-title"><Bell size={14} /> Notifications</h4>
      <div className="panel">
        {!session ? <p className="muted" style={{ fontStyle: 'italic' }}>Sign in to receive notifications.</p> : (
          <>
            <div className="kv" style={{ alignItems: 'center' }}>
              <span>Push on this device<small className="muted" style={{ display: 'block', fontSize: 13 }}>
                {push.status === 'ios-install' ? 'iPhone: Share → Add to Home Screen, then open from there.' : push.status === 'denied' ? 'Blocked in browser settings.' : push.status === 'unsupported' ? 'Not supported in this browser.' : push.status === 'on' ? 'Enabled' : 'Off'}
              </small></span>
              <div style={{ display: 'flex', gap: 6 }}>
                {push.status === 'on' && <button className="btn btn-ghost btn-sm" onClick={test} disabled={push.busy}>Test</button>}
                <button className={`btn btn-sm ${push.status === 'on' ? 'btn-ghost' : 'btn-gold'}`} onClick={togglePush} disabled={push.busy || ['ios-install', 'unsupported', 'denied', 'checking'].includes(push.status)}>
                  {push.status === 'on' ? <><BellOff /> Turn off</> : <><Bell /> Enable</>}
                </button>
              </div>
            </div>
            {push.msg && <p className="notice" style={{ margin: '8px 0' }}>{push.msg}</p>}
          </>
        )}
        <Toggle on={n.digest} onChange={v => setN({ digest: v })} label="Morning digest" hint="What’s due today and your streak" />
        {n.digest && (
          <div className="kv"><span>Send at</span>
            <select className="select input" style={{ width: 'auto' }} value={n.digestHour} onChange={e => setN({ digestHour: Number(e.target.value) })}>{HOURS.map(h => <option key={h} value={h}>{hourLabel(h)}</option>)}</select>
          </div>
        )}
        <Toggle on={n.streakGuard} onChange={v => setN({ streakGuard: v })} label="Streak guard" hint="An evening nudge if today has no deeds yet" />
        {n.streakGuard && (
          <div className="kv"><span>Send at</span>
            <select className="select input" style={{ width: 'auto' }} value={n.streakHour} onChange={e => setN({ streakHour: Number(e.target.value) })}>{HOURS.map(h => <option key={h} value={h}>{hourLabel(h)}</option>)}</select>
          </div>
        )}
        <Toggle on={n.agentActivity} onChange={v => setN({ agentActivity: v })} label="When your scribe logs something" hint="Level-ups, loot and completed deeds" />
      </div>

      <h4 className="section-title">Journal</h4>
      <div className="panel">
        <div className="kv" style={{ alignItems: 'center' }}>
          <span>Time zone<small className="muted" style={{ display: 'block', fontSize: 13 }}>Decides when a day (and a streak) ends</small></span>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <b style={{ fontFamily: 'var(--f-body)', fontSize: 15 }}>{state.settings.timeZone}</b>
            {state.settings.timeZone !== tz && <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { timeZone: tz } })}>Use {tz}</button>}
          </span>
        </div>
        <Toggle on={state.settings.sound !== false} onChange={v => dispatch({ type: 'UPDATE_SETTINGS', payload: { sound: v } }, { silent: true })} label="Sound effects" />
        <Toggle on={!!state.settings.reducedMotion} onChange={v => dispatch({ type: 'UPDATE_SETTINGS', payload: { reducedMotion: v } }, { silent: true })} label="Calm mode" hint="Fewer animations and particles" />
        <Toggle on={n.ceremonies !== false} onChange={v => setN({ ceremonies: v })} label="Level-up & trophy ceremonies" hint="Treasure chests always play" />
      </div>
    </>
  );
}

function randomKey() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return 'lg_' + Array.from(bytes, b => abc[b % abc.length]).join('');
}
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}

function AgentAccess() {
  const { session } = useGame();
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState('My assistant');
  const [fresh, setFresh] = useState(null);
  const [err, setErr] = useState(null);

  async function load() {
    const { data, error } = await supabase.from('lg_agent_keys').select('id, name, prefix, created_at, last_used_at, revoked_at').order('created_at', { ascending: false });
    if (!error) setKeys(data);
  }
  useEffect(() => { if (session) load(); }, [session]);

  async function create(e) {
    e.preventDefault();
    setErr(null);
    const key = randomKey();
    const { error } = await supabase.from('lg_agent_keys').insert({ user_id: session.user.id, name: name.trim() || 'Agent', key_hash: await sha256(key), prefix: key.slice(0, 9) });
    if (error) { setErr(error.message); return; }
    setFresh(key);
    load();
  }
  async function revoke(id) {
    if (!confirm('Revoke this key? Anything using it will stop working.')) return;
    await supabase.from('lg_agent_keys').update({ revoked_at: new Date().toISOString() }).eq('id', id);
    load();
  }

  if (!session) return <p className="muted" style={{ fontStyle: 'italic' }}>Sign in first — agent keys belong to your cloud journal.</p>;
  const k = fresh || 'lg_YOUR_KEY';
  const mcp = JSON.stringify({ mcpServers: { 'life-gamified': { type: 'http', url: `${API_URL}/mcp`, headers: { Authorization: `Bearer ${k}` } } } }, null, 2);
  const prompt = `You keep my Life Gamified quest journal in step with my real life.
API: ${API_URL}  (Authorization: Bearer ${k})
Read ${API_URL}/docs once, then:
- When I mention something I need to do, add it as a quest (pick an honest category and difficulty; set due_date if there is one).
- When I've done something, complete the matching quest, or log it as a deed if it wasn't on the board. Use external_id for anything from another system (e.g. notion:<page id>, calendar:<event id>) so nothing is counted twice.
- Never invent completions. If unsure, ask or add it as a quest.
- Check GET / each morning and tell me what's due.`;
  const curl = `curl -X POST ${API_URL}/deeds \\
  -H "Authorization: Bearer ${k}" -H "Content-Type: application/json" \\
  -d '{"title":"Run 5k","category":"health","difficulty":"hard","note":"From Strava"}'`;

  return (
    <>
      <form onSubmit={create} className="row" style={{ alignItems: 'flex-end', marginBottom: 10 }}>
        <label className="field" style={{ marginBottom: 0 }}><span>Key name</span><input className="input" value={name} onChange={e => setName(e.target.value)} maxLength={80} /></label>
        <button className="btn btn-ink" style={{ flex: 'none' }}><KeyRound /> Create key</button>
      </form>
      {err && <p className="notice warn">{err}</p>}
      <AnimatePresence>
        {fresh && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="notice" style={{ margin: '10px 0' }}>
            <b>Copy this key now — it will not be shown again.</b>
            <div style={{ marginTop: 8 }}><CopyBlock text={fresh} /></div>
          </motion.div>
        )}
      </AnimatePresence>
      {keys.map(key => (
        <div key={key.id} className="key-row" style={{ opacity: key.revoked_at ? .45 : 1 }}>
          <div>
            <b style={{ fontWeight: 600 }}>{key.name}</b> <code>{key.prefix}…</code>
            <small className="muted" style={{ display: 'block', fontStyle: 'italic' }}>
              {key.revoked_at ? 'Revoked' : key.last_used_at ? `Last used ${new Date(key.last_used_at).toLocaleString()}` : 'Never used yet'}
            </small>
          </div>
          {!key.revoked_at && <button className="btn btn-ghost btn-sm" onClick={() => revoke(key.id)}>Revoke</button>}
        </div>
      ))}
      <h4 className="section-title" style={{ marginTop: 20 }}>Hand these to your agent</h4>
      <CopyBlock label="Instructions to paste into your assistant" text={prompt} />
      <CopyBlock label="MCP connector (Claude, Cursor, etc.)" text={mcp} />
      <CopyBlock label="Or plain HTTP" text={curl} />
    </>
  );
}

export function SettingsRight() {
  const { state, dispatch, store } = useGame();
  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `life-gamified-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function importJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(t => {
      try {
        const data = JSON.parse(t);
        if (!confirm('Replace your journal with this backup?')) return;
        dispatch({ type: 'REPLACE_STATE', payload: { state: data } });
      } catch { alert('That file is not a Life Gamified backup.'); }
    });
    e.target.value = '';
  }
  return (
    <>
      <div className="eyebrow">The scribe’s desk</div>
      <h2 className="page-title"><Bot size={24} style={{ verticalAlign: -2 }} /> Agent access</h2>
      <p className="page-sub">Let an AI assistant keep the journal for you — adding quests as plans come up and logging deeds as you live them. It uses the same rules as you do, and every change appears here live.</p>
      <div style={{ marginTop: 14 }}><AgentAccess /></div>

      <h4 className="section-title">Backups</h4>
      <div className="panel">
        <p style={{ marginBottom: 10 }}>Download a copy of everything, or restore one. Signed-in journals are already backed up in the cloud.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={exportJson}><Download /> Export JSON</button>
          <label className="btn btn-ghost btn-sm"><Upload /> Import JSON<input type="file" accept="application/json,.json" hidden onChange={importJson} /></label>
        </div>
      </div>

      <h4 className="section-title" style={{ color: 'var(--rubric)' }}>The forbidden ritual</h4>
      <div className="panel" style={{ boxShadow: 'inset 0 0 0 1px rgba(139,37,0,.35)' }}>
        <p style={{ marginBottom: 10 }}>Start a brand-new hero. Your current journal is erased everywhere it syncs.</p>
        <button className="btn btn-blood btn-sm" onClick={() => {
          if (prompt('Type ERASE to confirm') !== 'ERASE') return;
          dispatch({ type: 'REPLACE_STATE', payload: { state: { schemaVersion: 2, character: null, settings: state.settings } } });
          store.discardDeviceBackup();
        }}><Trash2 /> Erase and begin anew</button>
      </div>
      <Flourish />
    </>
  );
}
