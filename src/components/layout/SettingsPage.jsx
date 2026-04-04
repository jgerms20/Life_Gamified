import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import NotionConnect from '../notion/NotionConnect';
import NotionImport from '../notion/NotionImport';

export default function SettingsPage() {
  const { state, dispatch } = useGame();
  const [showImport, setShowImport] = useState(false);

  function exportData() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life_gamified_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.character || !data.quests) throw new Error('Invalid format');
        dispatch({ type: 'IMPORT_DATA', payload: data });
        alert('Quest journal restored successfully!');
      } catch {
        alert('Invalid backup file. Restore aborted.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function resetData() {
    if (!window.confirm(
      'This will erase ALL your character data, quests, and progress.\n\nAre you absolutely sure?'
    )) return;
    localStorage.removeItem('life_gamified_v1');
    window.location.reload();
  }

  const notion = state.notion || {};

  return (
    <div className="scroll-area" style={{ height: '100%', padding: '20px' }}>
      {/* Header */}
      <div style={{
        textAlign: 'center', marginBottom: '28px', padding: '20px',
        background: 'linear-gradient(135deg, rgba(45,27,14,0.8), rgba(26,14,8,0.6))',
        border: '1px solid var(--gold-dark)', borderRadius: '6px',
      }}>
        <div style={{
          fontFamily: 'var(--font-header)', fontSize: '10px', letterSpacing: '0.3em',
          color: 'var(--gold-dark)', marginBottom: '6px',
        }}>
          ✦ GUILD REGISTRY ✦
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--parchment-light)' }}>
          Journal Settings
        </h2>
      </div>

      {/* ── Notion Integration ── */}
      <section style={{
        marginBottom: '24px', padding: '20px',
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: '6px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Notion N logo (SVG) */}
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="18" fill="#fff"/>
              <path d="M20 20h13l35 46V20h9v60H64L29 34v46h-9V20z" fill="#000"/>
            </svg>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontSize: '15px',
              color: 'var(--gold-leaf)', letterSpacing: '0.05em',
            }}>
              Notion Integration
            </h3>
          </div>

          {notion.connected && (
            <button
              className="btn btn-gold"
              onClick={() => setShowImport(true)}
              style={{ padding: '6px 14px', fontSize: '11px' }}
            >
              📥 Import Projects
            </button>
          )}
        </div>

        <p style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: '14px', color: 'rgba(244,228,188,0.5)',
          lineHeight: 1.6, marginBottom: '16px',
        }}>
          Connect your Notion workspace to import projects and tasks as quests.
          Completing a quest will automatically mark it done in Notion.
        </p>

        <NotionConnect />

        {/* Quick import prompt once connected */}
        {notion.connected && (
          <div style={{
            marginTop: '16px', padding: '12px 16px',
            background: 'rgba(212,175,55,0.08)',
            border: '1px dashed rgba(212,175,55,0.3)',
            borderRadius: '4px', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontFamily: 'var(--font-body)', fontStyle: 'italic',
              fontSize: '14px', color: 'rgba(244,228,188,0.6)',
            }}>
              Ready to pull in your Notion projects?
            </span>
            <button
              className="btn btn-gold"
              onClick={() => setShowImport(true)}
              style={{ padding: '6px 16px', fontSize: '11px' }}
            >
              Browse & Import →
            </button>
          </div>
        )}
      </section>

      {/* ── Data Management ── */}
      <section style={{
        marginBottom: '24px', padding: '20px',
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: '6px',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: '14px',
          color: 'var(--gold-leaf)', marginBottom: '16px', letterSpacing: '0.05em',
        }}>
          Chronicle Preservation
        </h3>
        <p style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: '14px', color: 'rgba(244,228,188,0.5)',
          lineHeight: 1.6, marginBottom: '16px',
        }}>
          Export your journal as a backup file to transfer between devices.
          Data is stored locally in this browser's storage.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-gold" onClick={exportData}>
            📜 Export Backup
          </button>
          <label className="btn btn-dark" style={{ cursor: 'pointer' }}>
            📂 Import Backup
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={importData} />
          </label>
        </div>
      </section>

      {/* ── Hero Info ── */}
      <section style={{
        marginBottom: '24px', padding: '20px',
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: '6px',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: '14px',
          color: 'var(--gold-leaf)', marginBottom: '14px', letterSpacing: '0.05em',
        }}>
          Hero Identification
        </h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          {[
            { label: 'Name',  value: state.character.name  || '—' },
            { label: 'Title', value: state.character.title || '—' },
            { label: 'Class', value: state.character.class
                ? state.character.class.charAt(0).toUpperCase() + state.character.class.slice(1)
                : '—' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid rgba(212,175,55,0.1)',
            }}>
              <span style={{ fontFamily: 'var(--font-header)', fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(244,228,188,0.5)' }}>
                {row.label.toUpperCase()}
              </span>
              <span style={{ fontFamily: 'var(--font-script)', fontSize: '16px', color: 'var(--parchment-light)' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Danger ── */}
      <section style={{
        padding: '20px',
        background: 'rgba(139,37,0,0.08)', border: '1px solid rgba(139,37,0,0.3)',
        borderRadius: '6px',
      }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: '#cc5533', marginBottom: '10px' }}>
          ⚠ The Forbidden Ritual
        </h3>
        <p style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: '14px', color: 'rgba(244,228,188,0.4)',
          lineHeight: 1.6, marginBottom: '14px',
        }}>
          Erasing the chronicles is permanent and cannot be undone.
        </p>
        <button className="btn btn-danger" onClick={resetData}>
          ☠ Erase All Chronicles
        </button>
      </section>

      <p style={{
        fontFamily: 'var(--font-script)', fontSize: '12px',
        color: 'rgba(244,228,188,0.2)', textAlign: 'center', marginTop: '24px',
      }}>
        Life Gamified · Data stored locally in your browser
      </p>

      {showImport && <NotionImport onClose={() => setShowImport(false)} />}
    </div>
  );
}
