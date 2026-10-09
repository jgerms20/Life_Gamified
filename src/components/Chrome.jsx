import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Swords, Sparkles, Trophy, Gem, BookOpenText, Settings2, Coins, Flame } from 'lucide-react';
import { useGame } from '../lib/game';
import { Logo } from './Ornaments';
import { CLASSES } from '../lib/engine';

export const TABS = [
  { id: 'quests',   label: 'Quests',    icon: ScrollText,   ribbon: '#7a1d14' },
  { id: 'hero',     label: 'Hero',      icon: Swords,       ribbon: '#1f3a6b' },
  { id: 'talents',  label: 'Talents',   icon: Sparkles,     ribbon: '#3b2470' },
  { id: 'trophies', label: 'Trophies',  icon: Trophy,       ribbon: '#8a6418' },
  { id: 'treasury', label: 'Treasury',  icon: Gem,          ribbon: '#25563a' },
  { id: 'chronicle', label: 'Chronicle', icon: BookOpenText, ribbon: '#5b2a1a' },
  { id: 'settings', label: 'Settings',  icon: Settings2,    ribbon: '#3a3a3a' },
];
export const PHONE_TABS = ['quests', 'hero', 'treasury', 'chronicle', 'settings'];

function useBadges() {
  const { state, derived } = useGame();
  return {
    treasury: state.loot.filter(l => !l.redeemedAt).length,
    talents: derived?.talentPoints || 0,
  };
}

export function Ribbons({ tab, onTab }) {
  const badges = useBadges();
  return (
    <nav className="ribbons" aria-label="Sections">
      {TABS.map((t, i) => {
        const Icon = t.icon;
        return (
          <motion.button
            key={t.id}
            className={`ribbon ${tab === t.id ? 'on' : ''}`}
            style={{ '--rib': t.ribbon }}
            onClick={() => onTab(t.id)}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ delay: .15 + i * .05, type: 'spring', stiffness: 220, damping: 18 }}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <Icon />
            <span>{t.label}</span>
            {badges[t.id] > 0 && <span className="badge">{badges[t.id]}</span>}
          </motion.button>
        );
      })}
    </nav>
  );
}

export function BottomNav({ tab, onTab }) {
  const badges = useBadges();
  return (
    <nav className="bottom-nav" aria-label="Sections">
      {PHONE_TABS.map(id => {
        const t = TABS.find(x => x.id === id);
        const Icon = t.icon;
        const on = tab === id || (id === 'hero' && (tab === 'talents' || tab === 'trophies'));
        return (
          <button key={id} className={on ? 'on' : ''} onClick={() => onTab(id)} aria-current={on ? 'page' : undefined}>
            {on && <motion.span layoutId="bn-glow" className="glow" />}
            <Icon />
            {t.label}
            {(badges[id] || (id === 'hero' && badges.talents)) > 0 && <span className="badge">{badges[id] || badges.talents}</span>}
          </button>
        );
      })}
    </nav>
  );
}

function Meter({ kind, label, value, max, display }) {
  const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={`meter meter--${kind}`} title={`${label} ${display}`}>
      <div className="meter-label"><span>{label}</span><span>{display}</span></div>
      <div className="meter-track">
        <motion.div className="meter-fill" initial={false} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 90, damping: 20 }} />
      </div>
    </div>
  );
}

const SYNC_LABEL = {
  local: 'Saved on this device only',
  syncing: 'Saving to the cloud…',
  synced: 'Saved to the cloud',
  offline: 'Offline — will sync when back online',
  error: 'Cloud save failed — retrying',
};

export function Hud({ onTab, compact }) {
  const { state, derived, sync, syncError } = useGame();
  const c = state.character;
  const streak = derived?.streak || 0;
  const cls = CLASSES[c?.class];
  return (
    <header className="hud">
      <div className="brand"><Logo /><span className="word">Life Gamified</span></div>
      {derived && (
        <div className="hud-meters">
          <Meter kind="hp" label="HP" value={derived.hp} max={derived.maxHp} display={`${derived.hp}`} />
          <Meter kind="mp" label="MP" value={derived.mp} max={derived.maxMp} display={`${derived.mp}`} />
          <Meter kind="xp" label="XP" value={derived.xpInto} max={derived.xpNeed} display={`${Math.round(derived.xpPct * 100)}%`} />
        </div>
      )}
      <div className="hud-right">
        {derived && !compact && (
          <span className="gold-count" title="Gold"><Coins size={16} /> {c.gold.toLocaleString()}<span className="lbl" /></span>
        )}
        {derived && (
          <motion.span
            className={`streak-flame ${streak ? '' : 'cold'}`} title={`${streak}-day streak`}
            animate={streak ? { scale: [1, 1.08, 1] } : {}} transition={{ duration: 2.4, repeat: Infinity }}
          >
            <Flame size={18} fill={streak ? 'currentColor' : 'none'} /> {streak}
          </motion.span>
        )}
        <span className={`sync-dot ${sync}`} title={syncError ? `${SYNC_LABEL[sync]}: ${syncError}` : SYNC_LABEL[sync]} role="status" aria-label={SYNC_LABEL[sync]} />
        {derived && (
          <button className="hero-chip" onClick={() => onTab('hero')} aria-label="Open character sheet">
            <span className="who"><b>{c.name}</b><i>{c.title || cls?.label}</i></span>
            <span className="level-seal"><small>LVL</small><span>{derived.level}</span></span>
          </button>
        )}
      </div>
    </header>
  );
}

export function Motes({ count = 22 }) {
  const motes = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: 60 + Math.random() * 50,
    size: 1 + Math.random() * 2.6,
    dur: 16 + Math.random() * 22,
    delay: -Math.random() * 30,
    dx: (Math.random() - .5) * 160,
    o: .15 + Math.random() * .45,
  })), [count]);
  return (
    <div className="motes" aria-hidden="true">
      {motes.map(m => (
        <span key={m.id} className="mote" style={{
          left: `${m.left}%`, top: `${m.top}%`, width: m.size, height: m.size,
          animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s`, '--dx': `${m.dx}px`, '--o': m.o,
        }} />
      ))}
    </div>
  );
}
