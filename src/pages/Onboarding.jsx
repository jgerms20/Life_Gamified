import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLASSES } from '../lib/engine';
import { useGame } from '../lib/game';
import { deviceTimeZone } from '../lib/store';
import { Flourish, Logo, SignatureStroke } from '../components/Ornaments';
import AuthPanel from '../components/AuthPanel';

export default function Onboarding() {
  const { dispatch, session, sync } = useGame();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [cls, setCls] = useState('adventurer');
  const [signed, setSigned] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  function create(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSigned(true);
    setTimeout(() => dispatch({ type: 'CREATE_CHARACTER', payload: { name, title, class: cls, timeZone: deviceTimeZone() } }), 900);
  }

  return (
    <div className="gate">
      <motion.div className="gate-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: [.16, 1, .3, 1] }}>
        <div className="gate-title">
          <motion.div initial={{ scale: .6, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', delay: .2 }} style={{ display: 'inline-block', marginBottom: 10 }}>
            <Logo size={64} />
          </motion.div>
          <h1>Life Gamified</h1>
          <p>Every errand a quest. Every habit a legend in the making.</p>
        </div>

        <div className="page" style={{ borderRadius: 6 }}>
          <div className="page-inner" style={{ position: 'relative', overflow: 'visible' }}>
            <AnimatePresence mode="wait">
              {!showAuth ? (
                <motion.form key="create" onSubmit={create} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="eyebrow" style={{ textAlign: 'center' }}>Guild registration</div>
                  <h2 className="page-title" style={{ textAlign: 'center' }}>Inscribe your hero</h2>
                  <Flourish />
                  <label className="field">
                    <span>Name</span>
                    <input className="input hand-input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Your name, brave soul" maxLength={60} />
                  </label>
                  <label className="field">
                    <span>Title <em className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</em></span>
                    <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="the Relentless, Keeper of Mornings…" maxLength={80} />
                  </label>
                  <div className="field">
                    <span>Calling</span>
                    <div className="class-grid">
                      {Object.entries(CLASSES).map(([k, c]) => (
                        <button type="button" key={k} className={cls === k ? 'on' : ''} onClick={() => setCls(k)}>
                          <div>{c.icon}</div><b>{c.label}</b>
                        </button>
                      ))}
                    </div>
                    <p className="hand" style={{ textAlign: 'center', fontSize: 20, color: 'var(--rubric)', marginTop: 8 }}>{CLASSES[cls].blurb}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
                    <div className="signature">{signed ? name : <span className="muted" style={{ fontSize: 18 }}>signed…</span>}<SignatureStroke draw={signed} /></div>
                    <button className="btn btn-ink" disabled={!name.trim() || signed}>🪶 Sign the ledger</button>
                  </div>
                  <div className="divider-text">or</div>
                  <p style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>
                    Already have a journal in the cloud?{' '}
                    <button type="button" className="link-btn" onClick={() => setShowAuth(true)}>Sign in to restore it</button>
                  </p>
                </motion.form>
              ) : (
                <motion.div key="auth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="eyebrow">The archive</div>
                  <h2 className="page-title">Open your journal</h2>
                  <Flourish />
                  {session ? (
                    <div className="notice">{sync === 'syncing' ? 'Fetching your journal from the archive…' : 'Signed in, but no hero was found in the cloud yet. Go back and inscribe one — it will sync automatically.'}</div>
                  ) : (
                    <AuthPanel intro="Sign in and your hero, quests and treasure follow you to every device." />
                  )}
                  <p style={{ marginTop: 18 }}><button type="button" className="link-btn" onClick={() => setShowAuth(false)}>← Back to registration</button></p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
