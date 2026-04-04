import { useState, useEffect, useCallback } from 'react';
import { useGame, CATEGORIES, DIFFICULTIES } from '../../context/GameContext';
import {
  NotionService,
  getPageTitle,
  getRichText,
  getDate,
  getSelect,
  getStatus,
  getCheckbox,
  detectStatusProperty,
} from '../../services/notionService';

export default function NotionImport({ onClose }) {
  const { state, dispatch } = useGame();
  const notion = state.notion;

  const svc = new NotionService(notion.workerUrl, notion.token);

  const [phase, setPhase]             = useState('databases'); // databases | pages | mapping | importing
  const [databases, setDatabases]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');

  const [selectedDb, setSelectedDb]   = useState(null);
  const [dbSchema, setDbSchema]       = useState(null);
  const [pages, setPages]             = useState([]);
  const [selected, setSelected]       = useState(new Set());

  // Mapping: how to translate Notion properties → quest fields
  const [mapping, setMapping] = useState({
    titleProp:       'title',       // auto-detected
    descriptionProp: '',
    dueDateProp:     '',
    category:        'health',
    difficulty:      'medium',
    syncBackStatus:  true,
  });

  const [importCount, setImportCount] = useState(0);
  const [importing, setImporting]     = useState(false);

  // ── Load databases ─────────────────────────────────────────
  const loadDatabases = useCallback(async (q = '') => {
    setLoading(true);
    setError('');
    try {
      const dbs = await svc.searchDatabases(q);
      setDatabases(dbs);
    } catch (e) {
      setError(`Could not load databases: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [notion.workerUrl, notion.token]);

  useEffect(() => { loadDatabases(); }, []);

  // ── Select a database ──────────────────────────────────────
  async function selectDatabase(db) {
    setSelectedDb(db);
    setLoading(true);
    setError('');
    try {
      const [schema, items] = await Promise.all([
        svc.getDatabase(db.id),
        svc.queryDatabase(db.id),
      ]);
      setDbSchema(schema);
      setPages(items);

      // Auto-detect useful properties
      const props = schema.properties || {};
      const richTextProps = Object.entries(props)
        .filter(([, p]) => p.type === 'rich_text')
        .map(([k]) => k);
      const dateProps = Object.entries(props)
        .filter(([, p]) => p.type === 'date')
        .map(([k]) => k);

      setMapping(prev => ({
        ...prev,
        descriptionProp: richTextProps[0] || '',
        dueDateProp: dateProps[0] || '',
      }));

      setPhase('pages');
    } catch (e) {
      setError(`Could not load database: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ── Toggle page selection ─────────────────────────────────
  function togglePage(id) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function selectAll()   { setSelected(new Set(pages.map(p => p.id))); }
  function deselectAll() { setSelected(new Set()); }

  // ── Import selected pages as quests ──────────────────────
  async function runImport() {
    setImporting(true);
    let count = 0;
    const statusProp = dbSchema ? detectStatusProperty(dbSchema) : null;

    for (const page of pages.filter(p => selected.has(p.id))) {
      const title = getPageTitle(page);
      if (!title || title === '(Untitled)') continue;

      const props   = page.properties || {};
      let desc = '';
      if (mapping.descriptionProp && props[mapping.descriptionProp]) {
        desc = getRichText(props[mapping.descriptionProp]);
      }

      let dueDate = null;
      if (mapping.dueDateProp && props[mapping.dueDateProp]) {
        dueDate = getDate(props[mapping.dueDateProp]);
      }

      dispatch({
        type: 'ADD_QUEST',
        payload: {
          title,
          description: desc,
          category:    mapping.category,
          difficulty:  mapping.difficulty,
          dueDate,
          recurrence:  'none',
          bonusObjectives: [],
          // Notion metadata for sync-back
          notionPageId:    page.id,
          notionDbId:      selectedDb.id,
          notionStatusProp: statusProp?.propName || null,
          notionStatusType: statusProp?.type || null,
        },
      });
      count++;
    }

    setImportCount(count);
    setImporting(false);
    setPhase('done');
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="animate-fade-in-up"
        style={{
          width: '100%', maxWidth: 640,
          background: 'linear-gradient(135deg, #2d1b0e, #1a0e08)',
          border: '2px solid var(--gold-dark)',
          borderRadius: '6px',
          boxShadow: '0 20px 80px rgba(0,0,0,0.8)',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(212,175,55,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-header)', fontSize: '9px', letterSpacing: '0.3em', color: 'var(--gold-dark)' }}>
              ✦ NOTION SYNC
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--parchment-light)', marginTop: '2px' }}>
              Import Projects as Quests
            </h2>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* Breadcrumb */}
        <div style={{
          padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.15)',
        }}>
          {[
            { id: 'databases', label: 'Databases' },
            { id: 'pages',     label: selectedDb ? dbTitle(selectedDb) : 'Pages' },
            { id: 'mapping',   label: 'Options' },
          ].map((crumb, i) => (
            <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {i > 0 && <span style={{ color: 'rgba(212,175,55,0.3)', fontSize: '10px' }}>›</span>}
              <span style={{
                fontFamily: 'var(--font-header)', fontSize: '10px', letterSpacing: '0.08em',
                color: phase === crumb.id ? 'var(--gold-leaf)' : 'rgba(244,228,188,0.3)',
              }}>
                {crumb.label}
              </span>
            </span>
          ))}
        </div>

        <div className="scroll-area" style={{ flex: 1, padding: '16px 20px' }}>
          {error && (
            <div style={{
              padding: '8px 12px', marginBottom: '12px',
              background: 'rgba(139,37,0,0.2)', border: '1px solid rgba(139,37,0,0.4)',
              borderRadius: '4px', color: '#ff8866',
              fontFamily: 'var(--font-body)', fontSize: '13px',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* ── Phase: Databases ── */}
          {phase === 'databases' && (
            <>
              <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                <input
                  className="input-base"
                  placeholder="Search databases..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadDatabases(search)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-dark"
                  onClick={() => loadDatabases(search)}
                  style={{ padding: '6px 14px', fontSize: '11px', flexShrink: 0 }}
                >
                  🔍 Search
                </button>
              </div>

              {loading ? (
                <LoadingState label="Fetching your Notion databases..." />
              ) : databases.length === 0 ? (
                <EmptyDatabases />
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {databases.map(db => (
                    <DatabaseRow key={db.id} db={db} onSelect={() => selectDatabase(db)} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Phase: Pages ── */}
          {phase === 'pages' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button
                  className="btn btn-dark"
                  onClick={() => { setPhase('databases'); setSelectedDb(null); setPages([]); setSelected(new Set()); }}
                  style={{ padding: '5px 12px', fontSize: '10px' }}
                >
                  ← Back
                </button>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={selectAll}   style={ghostBtn}>Select all</button>
                  <button onClick={deselectAll} style={ghostBtn}>Clear</button>
                </div>
                <span style={{
                  fontFamily: 'var(--font-header)', fontSize: '10px',
                  color: 'rgba(212,175,55,0.6)',
                }}>
                  {selected.size} / {pages.length} selected
                </span>
              </div>

              {loading ? (
                <LoadingState label="Loading database items..." />
              ) : pages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', opacity: 0.5 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '14px', color: 'rgba(244,228,188,0.5)' }}>
                    No items found in this database.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '6px' }}>
                  {pages.map(page => (
                    <PageRow
                      key={page.id}
                      page={page}
                      selected={selected.has(page.id)}
                      onToggle={() => togglePage(page.id)}
                    />
                  ))}
                </div>
              )}

              {selected.size > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <button
                    className="btn btn-gold"
                    onClick={() => setPhase('mapping')}
                    style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                  >
                    Configure Import ({selected.size} items) →
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Phase: Mapping ── */}
          {phase === 'mapping' && dbSchema && (
            <MappingPanel
              schema={dbSchema}
              mapping={mapping}
              onChange={setMapping}
              selectedCount={selected.size}
              onBack={() => setPhase('pages')}
              onImport={runImport}
              importing={importing}
            />
          )}

          {/* ── Phase: Done ── */}
          {phase === 'done' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚔️</div>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: '20px',
                color: 'var(--gold-bright)', marginBottom: '8px',
              }}>
                {importCount} Quest{importCount !== 1 ? 's' : ''} Posted!
              </h3>
              <p style={{
                fontFamily: 'var(--font-body)', fontStyle: 'italic',
                fontSize: '15px', color: 'rgba(244,228,188,0.6)',
                marginBottom: '20px',
              }}>
                Your Notion projects have been inscribed in the quest journal.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="btn btn-dark" onClick={() => { setPhase('databases'); setSelected(new Set()); }}>
                  Import More
                </button>
                <button className="btn btn-gold" onClick={onClose}>
                  View Quest Board
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function DatabaseRow({ db, onSelect }) {
  const title = dbTitle(db);
  const icon  = db.icon?.emoji || '🗄️';
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%', textAlign: 'left',
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: '4px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '12px',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.08)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'; }}
    >
      <span style={{ fontSize: '22px', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-header)', fontSize: '13px',
          color: 'var(--parchment-light)', marginBottom: '2px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: '11px',
          color: 'rgba(244,228,188,0.4)', fontStyle: 'italic',
        }}>
          {Object.keys(db.properties || {}).length} properties · last edited {timeAgo(db.last_edited_time)}
        </div>
      </div>
      <span style={{ color: 'rgba(212,175,55,0.5)', fontSize: '14px' }}>›</span>
    </button>
  );
}

function PageRow({ page, selected, onToggle }) {
  const title = getPageTitle(page);
  const icon  = page.icon?.emoji || '📄';
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '9px 12px',
      background: selected ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${selected ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '3px', cursor: 'pointer',
      transition: 'all 0.12s',
    }}>
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        style={{ accentColor: 'var(--gold-leaf)', flexShrink: 0 }}
      />
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: '14px',
        color: selected ? 'var(--parchment-light)' : 'rgba(244,228,188,0.7)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {title}
      </span>
    </label>
  );
}

function MappingPanel({ schema, mapping, onChange, selectedCount, onBack, onImport, importing }) {
  const props = schema.properties || {};
  const richTextProps = Object.entries(props).filter(([, p]) => p.type === 'rich_text').map(([k]) => k);
  const dateProps     = Object.entries(props).filter(([, p]) => p.type === 'date').map(([k]) => k);

  function set(key, val) { onChange(prev => ({ ...prev, [key]: val })); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        padding: '10px 14px', background: 'rgba(212,175,55,0.08)',
        border: '1px solid rgba(212,175,55,0.25)', borderRadius: '4px',
        fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '14px',
        color: 'rgba(244,228,188,0.7)',
      }}>
        Importing <strong style={{ color: 'var(--gold-leaf)' }}>{selectedCount} items</strong>.
        Choose how to map them to quests:
      </div>

      {/* Description property */}
      <div>
        <label style={lbl}>Description property <span style={{ opacity: 0.4 }}>(optional)</span></label>
        <select className="input-base" value={mapping.descriptionProp} onChange={e => set('descriptionProp', e.target.value)}>
          <option value="">— None —</option>
          {richTextProps.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {/* Due date property */}
      <div>
        <label style={lbl}>Due date property <span style={{ opacity: 0.4 }}>(optional)</span></label>
        <select className="input-base" value={mapping.dueDateProp} onChange={e => set('dueDateProp', e.target.value)}>
          <option value="">— None —</option>
          {dateProps.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Default category */}
        <div>
          <label style={lbl}>Quest Category</label>
          <select className="input-base" value={mapping.category} onChange={e => set('category', e.target.value)}>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
        </div>

        {/* Default difficulty */}
        <div>
          <label style={lbl}>Quest Difficulty</label>
          <select className="input-base" value={mapping.difficulty} onChange={e => set('difficulty', e.target.value)}>
            {Object.entries(DIFFICULTIES).map(([k, v]) => (
              <option key={k} value={k}>{v.symbol} {v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sync back */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={mapping.syncBackStatus}
          onChange={e => set('syncBackStatus', e.target.checked)}
          style={{ accentColor: 'var(--gold-leaf)' }}
        />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(244,228,188,0.7)' }}>
          Mark as complete in Notion when quest is completed
        </span>
      </label>

      <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
        <button className="btn btn-dark" onClick={onBack} style={{ padding: '7px 14px', fontSize: '11px' }}>
          ← Back
        </button>
        <button
          className="btn btn-gold"
          onClick={onImport}
          disabled={importing}
          style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '12px' }}
        >
          {importing ? '⏳ Importing...' : `⚔ Import ${selectedCount} Quest${selectedCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}

function LoadingState({ label }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px', opacity: 0.6 }}>
      <div style={{ fontSize: '24px', marginBottom: '8px', animation: 'spin-slow 2s linear infinite' }}>⚙️</div>
      <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '14px', color: 'rgba(244,228,188,0.5)' }}>
        {label}
      </p>
    </div>
  );
}

function EmptyDatabases() {
  return (
    <div style={{ textAlign: 'center', padding: '32px', opacity: 0.6 }}>
      <div style={{ fontSize: '36px', marginBottom: '8px' }}>🗄️</div>
      <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '14px', color: 'rgba(244,228,188,0.5)', marginBottom: '6px' }}>
        No databases found.
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(244,228,188,0.35)' }}>
        Make sure you've shared your databases with the integration
        (open a database in Notion → ⋯ → Connections → Add your integration).
      </p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function dbTitle(db) {
  return db.title?.map(t => t.plain_text).join('') || 'Untitled Database';
}

function timeAgo(isoDate) {
  if (!isoDate) return '';
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const lbl = {
  display: 'block', fontFamily: 'var(--font-header)',
  fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
  color: 'rgba(244,228,188,0.5)', marginBottom: '5px',
};
const ghostBtn = {
  background: 'none', border: '1px solid rgba(212,175,55,0.25)',
  color: 'rgba(212,175,55,0.6)', borderRadius: '3px', cursor: 'pointer',
  padding: '3px 10px', fontFamily: 'var(--font-header)', fontSize: '10px',
  letterSpacing: '0.08em',
};
const closeBtn = {
  background: 'none', border: '1px solid rgba(212,175,55,0.25)',
  color: 'rgba(244,228,188,0.5)', fontSize: '16px', cursor: 'pointer',
  width: 30, height: 30, borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
