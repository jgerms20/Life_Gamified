import { useState } from 'react';
import { useGame, CATEGORIES, DIFFICULTIES } from '../../context/GameContext';
import QuestCard from './QuestCard';
import QuestModal from './QuestModal';

const STATUS_FILTERS = [
  { value: 'all',         label: 'All Quests' },
  { value: 'available',  label: 'Available' },
  { value: 'in_progress', label: 'In Progress' },
];

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest First' },
  { value: 'oldest',   label: 'Oldest First' },
  { value: 'xp_high',  label: 'Highest XP' },
  { value: 'xp_low',   label: 'Lowest XP' },
  { value: 'due_soon',  label: 'Due Soon' },
];

export default function QuestBoard() {
  const { state } = useGame();
  const [showModal, setShowModal] = useState(false);
  const [editQuest, setEditQuest] = useState(null);
  const [catFilter, setCatFilter]    = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [diffFilter, setDiffFilter]  = useState('all');
  const [sortBy, setSortBy]          = useState('newest');
  const [search, setSearch]          = useState('');

  let quests = state.quests || [];

  // Filters
  if (catFilter !== 'all')    quests = quests.filter(q => q.category === catFilter);
  if (statusFilter !== 'all') quests = quests.filter(q => q.status === statusFilter);
  if (diffFilter !== 'all')   quests = quests.filter(q => q.difficulty === diffFilter);
  if (search.trim())          quests = quests.filter(q => q.title.toLowerCase().includes(search.toLowerCase()));

  // Sort
  const xpMap = { trivial: 10, easy: 25, medium: 50, hard: 100, epic: 200, legendary: 500 };
  quests = [...quests].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':   return a.createdAt - b.createdAt;
      case 'xp_high':  return (xpMap[b.difficulty] || 0) - (xpMap[a.difficulty] || 0);
      case 'xp_low':   return (xpMap[a.difficulty] || 0) - (xpMap[b.difficulty] || 0);
      case 'due_soon': {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return da - db;
      }
      default:         return b.createdAt - a.createdAt;
    }
  });

  function openEdit(quest) {
    setEditQuest(quest);
    setShowModal(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid rgba(212,175,55,0.2)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        {/* Search */}
        <div style={{ marginBottom: '10px', position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(212,175,55,0.5)', fontSize: '13px', pointerEvents: 'none',
          }}>🔍</span>
          <input
            className="input-base"
            placeholder="Search quests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '30px', fontSize: '13px' }}
          />
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Category pills */}
          <button
            className="btn"
            style={filterPillStyle(catFilter === 'all')}
            onClick={() => setCatFilter('all')}
          >All</button>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <button
              key={k}
              className="btn"
              style={filterPillStyle(catFilter === k, v.color)}
              onClick={() => setCatFilter(catFilter === k ? 'all' : k)}
            >
              {v.icon} {v.label}
            </button>
          ))}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            <select
              className="input-base"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '12px', padding: '4px 8px' }}
            >
              {STATUS_FILTERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              className="input-base"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ width: 'auto', fontSize: '12px', padding: '4px 8px' }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Quest count + New Quest button */}
      <div style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
      }}>
        <span style={{
          fontFamily: 'var(--font-header)', fontSize: '11px', letterSpacing: '0.12em',
          color: 'rgba(212,175,55,0.6)',
        }}>
          {quests.length} {quests.length === 1 ? 'QUEST' : 'QUESTS'} POSTED
        </span>
        <button
          className="btn btn-gold"
          onClick={() => { setEditQuest(null); setShowModal(true); }}
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          + New Quest
        </button>
      </div>

      {/* Quest list */}
      <div className="scroll-area" style={{ flex: 1, padding: '12px 16px' }}>
        {quests.length === 0 ? (
          <EmptyState onAdd={() => { setEditQuest(null); setShowModal(true); }} />
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {quests.map(quest => (
              <QuestCard key={quest.id} quest={quest} onEdit={openEdit} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <QuestModal
          editQuest={editQuest}
          onClose={() => { setShowModal(false); setEditQuest(null); }}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div style={{
      textAlign: 'center', padding: '48px 24px',
      opacity: 0.7,
    }}>
      <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>📜</div>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: '16px',
        color: 'var(--gold-dark)', marginBottom: '8px',
      }}>
        The quest board awaits
      </p>
      <p style={{
        fontFamily: 'var(--font-body)', fontStyle: 'italic',
        fontSize: '14px', color: 'rgba(244,228,188,0.5)',
        marginBottom: '16px',
      }}>
        No quests match your search, or none have been posted yet.
      </p>
      <button className="btn btn-gold" onClick={onAdd}>Post Your First Quest</button>
    </div>
  );
}

function filterPillStyle(active, color) {
  return {
    padding: '3px 10px', fontSize: '10px', letterSpacing: '0.08em',
    background: active ? (color || 'var(--gold-dark)') : 'rgba(212,175,55,0.08)',
    borderColor: active ? (color || 'var(--gold-dark)') : 'rgba(212,175,55,0.25)',
    color: active ? '#fff' : 'rgba(212,175,55,0.7)',
    opacity: active ? 1 : 0.8,
  };
}
