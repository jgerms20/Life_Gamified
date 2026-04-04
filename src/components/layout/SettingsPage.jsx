import { useGame } from '../../context/GameContext';

export default function SettingsPage() {
  const { state, dispatch } = useGame();

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
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--parchment-light)',
        }}>
          Journal Settings
        </h2>
      </div>

      {/* Data Management */}
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
          Preserve your chronicles in a sacred tome, or restore from a prior enchantment.
          Your quest journal is stored locally in this browser.
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

      {/* Character Info */}
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
            { label: 'Name',    value: state.character.name  || '—' },
            { label: 'Title',   value: state.character.title || '—' },
            { label: 'Class',   value: state.character.class  ? state.character.class.charAt(0).toUpperCase() + state.character.class.slice(1) : '—' },
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

      {/* Danger zone */}
      <section style={{
        padding: '20px',
        background: 'rgba(139,37,0,0.08)', border: '1px solid rgba(139,37,0,0.3)',
        borderRadius: '6px',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: '14px',
          color: '#cc5533', marginBottom: '10px',
        }}>
          ⚠ The Forbidden Ritual
        </h3>
        <p style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: '14px', color: 'rgba(244,228,188,0.4)',
          lineHeight: 1.6, marginBottom: '14px',
        }}>
          Erasing the chronicles is permanent and cannot be undone. All quests, achievements,
          and character progress will be lost to the void.
        </p>
        <button className="btn btn-danger" onClick={resetData}>
          ☠ Erase All Chronicles
        </button>
      </section>

      {/* Footer note */}
      <p style={{
        fontFamily: 'var(--font-script)', fontSize: '12px',
        color: 'rgba(244,228,188,0.2)', textAlign: 'center', marginTop: '24px',
      }}>
        Life Gamified · All data stored locally in your browser
      </p>
    </div>
  );
}
