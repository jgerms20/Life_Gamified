import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { APP_URL } from '../lib/config';

const redirectTo = () => (location.hostname === 'localhost' ? location.origin + location.pathname : APP_URL);

export default function AuthPanel({ onDone, intro }) {
  const [mode, setMode] = useState('signin'); // signin | signup | magic | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onDone?.();
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
        if (error) throw error;
        if (data.session) onDone?.();
        else setMsg({ ok: true, text: 'A confirmation raven is on its way. Click the link in the email, then return here and sign in.' });
      } else if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo(), shouldCreateUser: true } });
        if (error) throw error;
        setMsg({ ok: true, text: 'Check your inbox for a sign-in link. Open it on this device.' });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() });
        if (error) throw error;
        setMsg({ ok: true, text: 'If that address has a journal, a reset link is on its way.' });
      }
    } catch (err) {
      setMsg({ ok: false, text: err.message || String(err) });
    } finally {
      setBusy(false);
    }
  }

  const needsPassword = mode === 'signin' || mode === 'signup';
  return (
    <form onSubmit={submit}>
      {intro && <p className="lede" style={{ marginBottom: 14 }}>{intro}</p>}
      <div className="chips" style={{ marginBottom: 14 }}>
        {[['signin', 'Sign in'], ['signup', 'Create account'], ['magic', 'Email me a link']].map(([k, l]) => (
          <button type="button" key={k} className={`chip ${mode === k ? 'on' : ''}`} onClick={() => { setMode(k); setMsg(null); }}>{l}</button>
        ))}
      </div>
      <label className="field">
        <span>Email</span>
        <input className="input" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      {needsPassword && (
        <label className="field">
          <span>Password</span>
          <input className="input" type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" />
        </label>
      )}
      {msg && <div className={`notice ${msg.ok ? '' : 'warn'}`} style={{ marginBottom: 12 }}>{msg.text}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-ink" disabled={busy}>
          {busy ? 'One moment…' : mode === 'signin' ? 'Open my journal' : mode === 'signup' ? 'Create & sync' : mode === 'magic' ? 'Send link' : 'Send reset link'}
        </button>
        {mode === 'signin' && <button type="button" className="link-btn" onClick={() => setMode('reset')}>Forgot password?</button>}
      </div>
    </form>
  );
}
