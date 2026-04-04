import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { NotionService, WORKER_SCRIPT } from '../../services/notionService';

const STEPS = ['worker', 'token', 'done'];

export default function NotionConnect({ onConnected }) {
  const { state, dispatch } = useGame();
  const notion = state.notion || {};

  const [step, setStep]             = useState(notion.connected ? 'done' : 'worker');
  const [workerUrl, setWorkerUrl]   = useState(notion.workerUrl || '');
  const [token, setToken]           = useState(notion.token || '');
  const [testing, setTesting]       = useState(false);
  const [error, setError]           = useState('');
  const [copied, setCopied]         = useState(false);
  const [showScript, setShowScript] = useState(false);

  async function handleTest() {
    if (!workerUrl.trim()) { setError('Enter your Worker URL first.'); return; }
    if (!token.trim())     { setError('Enter your Notion integration token.'); return; }
    setTesting(true);
    setError('');
    try {
      const svc  = new NotionService(workerUrl.trim(), token.trim());
      const user = await svc.testConnection();
      const botName = user?.name || user?.bot?.owner?.user?.name || 'Notion Bot';
      dispatch({
        type: 'SET_NOTION_CONFIG',
        payload: { workerUrl: workerUrl.trim(), token: token.trim(), connected: true, botName },
      });
      setStep('done');
      if (onConnected) onConnected();
    } catch (e) {
      setError(`Connection failed: ${e.message}`);
    } finally {
      setTesting(false);
    }
  }

  function handleDisconnect() {
    dispatch({
      type: 'SET_NOTION_CONFIG',
      payload: { workerUrl: '', token: '', connected: false, botName: '' },
    });
    setWorkerUrl('');
    setToken('');
    setStep('worker');
  }

  function copyScript() {
    navigator.clipboard.writeText(WORKER_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Connected state ─────────────────────────────────────────
  if (step === 'done' && notion.connected) {
    return (
      <div style={{
        padding: '16px 18px',
        background: 'rgba(50,120,50,0.12)',
        border: '1px solid rgba(80,180,80,0.35)',
        borderRadius: '6px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <div>
              <div style={{
                fontFamily: 'var(--font-header)', fontSize: '12px',
                letterSpacing: '0.1em', color: '#88dd88',
              }}>
                NOTION CONNECTED
              </div>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: '13px',
                color: 'rgba(244,228,188,0.6)', fontStyle: 'italic',
              }}>
                {notion.botName || 'Integration active'} · {notion.workerUrl}
              </div>
            </div>
          </div>
          <button
            className="btn"
            onClick={handleDisconnect}
            style={{
              fontSize: '10px', padding: '4px 10px',
              borderColor: 'rgba(200,80,80,0.4)', color: '#cc8888',
              background: 'rgba(139,37,0,0.15)',
            }}
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // ── Setup flow ───────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Step 1 — Deploy Worker */}
      <StepCard
        number="1"
        title="Deploy a Cloudflare Worker"
        active={step === 'worker'}
        done={step !== 'worker'}
      >
        <p style={bodyText}>
          Notion's API doesn't allow direct browser requests, so we need a tiny
          proxy. Cloudflare Workers are <strong style={{ color: 'var(--gold-leaf)' }}>free</strong> (100k req/day)
          and take about 3 minutes to set up.
        </p>

        <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          <li style={bodyText}>
            Go to{' '}
            <a
              href="https://workers.cloudflare.com/"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--gold-leaf)' }}
            >
              workers.cloudflare.com
            </a>
            {' '}→ Sign up free → <strong>Create a Worker</strong>
          </li>
          <li style={bodyText}>
            Replace all the default code with the script below, then click <strong>Deploy</strong>
          </li>
          <li style={bodyText}>
            Copy the Worker URL (e.g. <code style={codeStyle}>https://my-worker.yourname.workers.dev</code>)
            and paste it below
          </li>
        </ol>

        {/* Script toggle */}
        <button
          onClick={() => setShowScript(v => !v)}
          style={{
            marginTop: '10px', background: 'rgba(212,175,55,0.1)',
            border: '1px dashed rgba(212,175,55,0.35)',
            color: 'var(--gold-dark)', borderRadius: '3px', cursor: 'pointer',
            padding: '6px 14px', fontFamily: 'var(--font-header)',
            fontSize: '10px', letterSpacing: '0.1em',
          }}
        >
          {showScript ? '▲ Hide Worker Script' : '▼ Show Worker Script'}
        </button>

        {showScript && (
          <div style={{ position: 'relative', marginTop: '8px' }}>
            <pre style={{
              background: '#0d1117', color: '#c9d1d9',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: '4px', padding: '12px',
              fontSize: '11px', fontFamily: 'monospace',
              overflowX: 'auto', maxHeight: '220px', overflowY: 'auto',
              lineHeight: 1.5,
            }}>
              {WORKER_SCRIPT}
            </pre>
            <button
              onClick={copyScript}
              style={{
                position: 'absolute', top: '8px', right: '8px',
                background: copied ? 'rgba(80,180,80,0.3)' : 'rgba(212,175,55,0.2)',
                border: `1px solid ${copied ? 'rgba(80,180,80,0.5)' : 'rgba(212,175,55,0.4)'}`,
                color: copied ? '#88dd88' : 'var(--gold-dark)',
                borderRadius: '3px', cursor: 'pointer',
                padding: '3px 10px', fontFamily: 'var(--font-header)',
                fontSize: '10px', letterSpacing: '0.08em',
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
        )}

        <div style={{ marginTop: '14px' }}>
          <label style={labelStyle}>Worker URL</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="input-base"
              placeholder="https://my-worker.yourname.workers.dev"
              value={workerUrl}
              onChange={e => setWorkerUrl(e.target.value)}
            />
            <button
              className="btn btn-gold"
              onClick={() => { if (workerUrl.trim()) setStep('token'); }}
              style={{ flexShrink: 0, padding: '6px 14px', fontSize: '11px' }}
            >
              Next →
            </button>
          </div>
        </div>
      </StepCard>

      {/* Step 2 — Notion Integration Token */}
      <StepCard
        number="2"
        title="Add your Notion Integration Token"
        active={step === 'token'}
        done={false}
        locked={step === 'worker'}
      >
        <p style={bodyText}>
          Create a Notion integration to get a token, then share your databases with it.
        </p>

        <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          <li style={bodyText}>
            Go to{' '}
            <a
              href="https://www.notion.so/my-integrations"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--gold-leaf)' }}
            >
              notion.so/my-integrations
            </a>
            {' '}→ <strong>New integration</strong>
          </li>
          <li style={bodyText}>
            Give it any name (e.g. "Life Gamified"), select your workspace, click <strong>Submit</strong>
          </li>
          <li style={bodyText}>
            Copy the <strong>Internal Integration Token</strong> (starts with <code style={codeStyle}>secret_...</code>)
          </li>
          <li style={bodyText}>
            Open each Notion database you want to use → <strong>⋯ menu → Connections → Add connection</strong> → select your integration
          </li>
        </ol>

        <div style={{ marginTop: '14px' }}>
          <label style={labelStyle}>Integration Token</label>
          <input
            className="input-base"
            type="password"
            placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={token}
            onChange={e => setToken(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTest()}
          />
          <p style={{ ...bodyText, marginTop: '5px', opacity: 0.5 }}>
            Stored only in your browser's localStorage — never sent anywhere except your own Worker.
          </p>
        </div>

        {error && (
          <div style={{
            marginTop: '10px', padding: '8px 12px',
            background: 'rgba(139,37,0,0.2)', border: '1px solid rgba(139,37,0,0.4)',
            borderRadius: '4px', color: '#ff8866',
            fontFamily: 'var(--font-body)', fontSize: '13px',
          }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-dark"
            onClick={() => setStep('worker')}
            style={{ padding: '7px 14px', fontSize: '11px' }}
          >
            ← Back
          </button>
          <button
            className="btn btn-gold"
            onClick={handleTest}
            disabled={testing}
            style={{ padding: '7px 18px', fontSize: '11px' }}
          >
            {testing ? '⏳ Testing...' : '✓ Connect to Notion'}
          </button>
        </div>
      </StepCard>
    </div>
  );
}

function StepCard({ number, title, active, done, locked, children }) {
  return (
    <div style={{
      padding: '16px 18px',
      background: locked
        ? 'rgba(0,0,0,0.15)'
        : active
        ? 'rgba(212,175,55,0.06)'
        : 'rgba(0,0,0,0.25)',
      border: `1px solid ${active ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '6px',
      opacity: locked ? 0.45 : 1,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: active ? '14px' : '0' }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: done
            ? 'rgba(80,180,80,0.3)'
            : active
            ? 'rgba(212,175,55,0.3)'
            : 'rgba(255,255,255,0.07)',
          border: `1px solid ${done ? 'rgba(80,180,80,0.5)' : active ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.15)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: '12px',
          color: done ? '#88dd88' : active ? 'var(--gold-leaf)' : 'rgba(244,228,188,0.3)',
        }}>
          {done ? '✓' : number}
        </div>
        <h4 style={{
          fontFamily: 'var(--font-header)', fontSize: '13px',
          letterSpacing: '0.08em',
          color: active ? 'var(--parchment-light)' : 'rgba(244,228,188,0.45)',
        }}>
          {title}
        </h4>
      </div>
      {active && children}
    </div>
  );
}

const bodyText = {
  fontFamily: 'var(--font-body)', fontSize: '14px',
  color: 'rgba(244,228,188,0.65)', lineHeight: 1.6,
};
const labelStyle = {
  display: 'block', fontFamily: 'var(--font-header)',
  fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
  color: 'rgba(244,228,188,0.5)', marginBottom: '5px',
};
const codeStyle = {
  fontFamily: 'monospace', fontSize: '11px',
  background: 'rgba(0,0,0,0.3)', padding: '1px 5px',
  borderRadius: '3px', color: 'var(--gold-leaf)',
};
