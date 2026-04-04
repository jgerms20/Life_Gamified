import { useGame, levelFromXp, xpForLevel, xpIntoCurrentLevel } from '../../context/GameContext';
import QuestBoard from '../quests/QuestBoard';
import QuestLog from '../quests/QuestLog';
import CharacterSheet from '../character/CharacterSheet';
import TalentsPage from '../talents/TalentsPage';
import AchievementsPage from '../achievements/AchievementsPage';
import RewardsPage from '../rewards/RewardsPage';
import StatisticsPage from '../stats/StatisticsPage';
import SettingsPage from './SettingsPage';

const TABS = [
  { id: 'quests',       label: 'Quest Board', icon: '📜' },
  { id: 'character',    label: 'Character',   icon: '⚔️' },
  { id: 'talents',      label: 'Talents',     icon: '✨' },
  { id: 'achievements', label: 'Trophies',    icon: '🏆' },
  { id: 'rewards',      label: 'Rewards',     icon: '🎁' },
  { id: 'stats',        label: 'Chronicle',   icon: '📊' },
  { id: 'settings',     label: 'Settings',    icon: '⚙️' },
];

export default function BookLayout() {
  const { state, dispatch } = useGame();
  const { tab, character } = state;

  const level = levelFromXp(character.xp || 0);
  const xpInLevel = xpIntoCurrentLevel(character.xp || 0);
  const xpNeeded = xpForLevel(level + 1);
  const xpPct = Math.round((xpInLevel / xpNeeded) * 100);

  const vitality  = character.vitality  || 10;
  const wisdom    = character.wisdom    || 10;
  const maxHp = 100 + vitality * 5 + (character.talentPoints?.includes('resilience') ? 20 : 0);
  const maxMp = 50 + wisdom * 3;
  const hp = Math.min(character.hp ?? maxHp, maxHp);
  const hpPct = Math.round((hp / maxHp) * 100);
  const mpPct  = Math.round((Math.min(character.mp ?? maxMp, maxMp) / maxMp) * 100);

  // Two-page layout: quest board (left) + log/content (right)
  const isQuestTab = tab === 'quests';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(160deg, #1a0e08 0%, #2d1b0e 40%, #1a0e08 100%)',
    }}>
      {/* ── Top Bar ── */}
      <header style={{
        background: 'linear-gradient(90deg, #1a0e08, #2d1b0e, #1a0e08)',
        borderBottom: '1px solid var(--gold-dark)',
        padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: '16px',
        height: '52px', flexShrink: 0,
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Brand */}
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '16px',
          color: 'var(--gold-leaf)', letterSpacing: '0.08em', flexShrink: 0,
          textShadow: '0 0 12px rgba(212,175,55,0.3)',
        }}>
          ⚔ Life Gamified
        </div>

        {/* Streak */}
        <div style={{
          fontFamily: 'var(--font-script)', fontSize: '14px',
          color: character.streak > 0 ? '#ff6622' : 'rgba(244,228,188,0.3)',
          flexShrink: 0,
        }}>
          🔥 {character.streak || 0}
        </div>

        {/* Resource bars - middle */}
        <div style={{ flex: 1, display: 'flex', gap: '12px', alignItems: 'center', maxWidth: '400px', margin: '0 auto' }}>
          <MiniBar value={hpPct} color="#cc3333" label="HP" />
          <MiniBar value={mpPct} color="#3366cc" label="MP" />
          <MiniBar value={xpPct} color="#d4af37" label="XP" />
        </div>

        {/* Hero name + level */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'var(--font-header)', fontSize: '11px',
              color: 'var(--gold-leaf)', letterSpacing: '0.08em',
            }}>
              {character.name}
            </div>
            {character.title && (
              <div style={{
                fontFamily: 'var(--font-script)', fontSize: '11px',
                color: 'rgba(212,175,55,0.5)', fontStyle: 'italic',
              }}>
                {character.title}
              </div>
            )}
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #c9972a, #d4af37)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 8px rgba(212,175,55,0.4)', flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 900, color: '#2d1b0e', lineHeight: 1 }}>
              {level}
            </span>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <nav style={{
        background: 'linear-gradient(90deg, #251208, #2d1b0e)',
        borderBottom: '1px solid rgba(212,175,55,0.25)',
        display: 'flex', padding: '0 20px', gap: '2px',
        overflowX: 'auto', flexShrink: 0,
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => dispatch({ type: 'SET_TAB', payload: t.id })}
            style={{
              padding: '10px 16px',
              fontFamily: 'var(--font-header)', fontSize: '11px',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: tab === t.id
                ? 'linear-gradient(to bottom, rgba(212,175,55,0.15), rgba(212,175,55,0.05))'
                : 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--gold-leaf)' : '2px solid transparent',
              color: tab === t.id ? 'var(--gold-leaf)' : 'rgba(244,228,188,0.45)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap', display: 'flex', gap: '5px', alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '13px' }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {tab === 'quests' ? (
          // Two-page book spread
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 0 }}>
            {/* Left page - Active Quests */}
            <div style={{
              flex: 1, minWidth: 0, overflow: 'hidden',
              borderRight: '2px solid rgba(212,175,55,0.15)',
              display: 'flex', flexDirection: 'column',
              background: 'rgba(0,0,0,0.1)',
            }}>
              {/* Page header */}
              <div style={{
                padding: '10px 16px',
                background: 'linear-gradient(90deg, rgba(45,27,14,0.8), rgba(45,27,14,0.4))',
                borderBottom: '1px solid rgba(212,175,55,0.2)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ fontSize: '14px' }}>📋</span>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: '13px',
                  color: 'var(--gold-leaf)', letterSpacing: '0.05em',
                }}>
                  Active Quests
                </span>
                <span style={{
                  marginLeft: 'auto',
                  fontFamily: 'var(--font-header)', fontSize: '10px',
                  color: 'rgba(212,175,55,0.4)',
                }}>
                  {state.quests?.length || 0} posted
                </span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <QuestBoard />
              </div>
            </div>

            {/* Right page - Quest Log */}
            <div style={{
              flex: 1, minWidth: 0, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              background: 'rgba(0,0,0,0.05)',
            }}>
              {/* Page header */}
              <div style={{
                padding: '10px 16px',
                background: 'linear-gradient(90deg, rgba(45,27,14,0.4), rgba(45,27,14,0.8))',
                borderBottom: '1px solid rgba(212,175,55,0.2)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ fontSize: '14px' }}>📖</span>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: '13px',
                  color: 'var(--gold-leaf)', letterSpacing: '0.05em',
                }}>
                  Quest Log
                </span>
                <span style={{
                  marginLeft: 'auto',
                  fontFamily: 'var(--font-header)', fontSize: '10px',
                  color: 'rgba(212,175,55,0.4)',
                }}>
                  {state.completedQuests?.length || 0} entries
                </span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <QuestLog />
              </div>
            </div>
          </div>
        ) : (
          // Single page view for other tabs
          <div style={{
            flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            maxWidth: 900, margin: '0 auto', width: '100%',
          }}>
            <PageContent tab={tab} />
          </div>
        )}
      </main>
    </div>
  );
}

function PageContent({ tab }) {
  switch (tab) {
    case 'character':    return <CharacterSheet />;
    case 'talents':      return <TalentsPage />;
    case 'achievements': return <AchievementsPage />;
    case 'rewards':      return <RewardsPage />;
    case 'stats':        return <StatisticsPage />;
    case 'settings':     return <SettingsPage />;
    default: return null;
  }
}

function MiniBar({ value, color, label }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-header)', fontSize: '8px', letterSpacing: '0.1em', color: `${color}bb` }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-header)', fontSize: '8px', color: `${color}77` }}>
          {value}%
        </span>
      </div>
      <div style={{
        background: 'rgba(0,0,0,0.4)', borderRadius: '3px', height: '4px',
        border: `1px solid ${color}33`, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${value}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: 'width 0.5s',
          boxShadow: `0 0 4px ${color}66`,
        }} />
      </div>
    </div>
  );
}
