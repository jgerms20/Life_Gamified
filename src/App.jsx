import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame, useLayout, useReducedMotion } from './lib/game';
import { Hud, Ribbons, BottomNav, Motes, TABS } from './components/Chrome';
import Ceremonies from './components/Ceremonies';
import Toasts from './components/Toasts';
import Onboarding from './pages/Onboarding';
import { QuestBoard, Chronicle } from './pages/Quests';
import { HeroSheet, HeroArts } from './pages/Hero';
import { TalentTree, TalentLore } from './pages/Talents';
import { TrophyHallLeft, TrophyHallRight } from './pages/Trophies';
import { Loot, RewardTable } from './pages/Treasury';
import { StatsLeft, StatsRight } from './pages/Stats';
import { SettingsLeft, SettingsRight } from './pages/Settings';

const SPREADS = {
  quests:    { left: QuestBoard,     right: Chronicle,       labels: ['Board', 'Chronicle'] },
  hero:      { left: HeroSheet,      right: HeroArts,        labels: ['Sheet', 'Arcana'] },
  talents:   { left: TalentTree,     right: TalentLore,      labels: ['Paths', 'Notes'] },
  trophies:  { left: TrophyHallLeft, right: TrophyHallRight, labels: ['Great hall', 'Feats'] },
  treasury:  { left: Loot,           right: RewardTable,     labels: ['Spoils', 'Reward table'] },
  chronicle: { left: StatsLeft,      right: StatsRight,      labels: ['Annals', 'Compass'] },
  settings:  { left: SettingsLeft,   right: SettingsRight,   labels: ['Settings', 'Agent'] },
};

const initialTab = () => {
  const h = location.hash.replace('#', '');
  return SPREADS[h] ? h : 'quests';
};

/** A sheet of parchment that sweeps across the spread when you change section. */
function PageTurn({ turn }) {
  if (!turn) return null;
  const forward = turn.dir > 0;
  return (
    <motion.div
      key={turn.id}
      className="turning-sheet"
      style={{ left: '50%', transformOrigin: 'left center' }}
      initial={{ rotateY: forward ? 0 : -180, opacity: 1 }}
      animate={{ rotateY: forward ? -180 : 0, opacity: [1, 1, 0] }}
      transition={{ duration: .75, ease: [.45, .05, .25, 1], opacity: { times: [0, .85, 1], duration: .75 } }}
    >
      <div className="face" /><div className="face back" />
    </motion.div>
  );
}

function Spread({ tab, turn, still }) {
  const S = SPREADS[tab];
  const L = S.left, R = S.right;
  const fade = still ? {} : { initial: { opacity: 0, filter: 'blur(2px)' }, animate: { opacity: 1, filter: 'blur(0px)' }, transition: { duration: .45, delay: .25 } };
  return (
    <div className="spread">
      <section className="page page--left">
        <motion.div key={`${tab}-l`} className="page-inner" {...fade}><L /></motion.div>
        <span className="folio">{TABS.findIndex(t => t.id === tab) * 2 + 1}</span>
      </section>
      <section className="page page--right">
        <motion.div key={`${tab}-r`} className="page-inner" {...fade}><R /></motion.div>
        <span className="folio">{TABS.findIndex(t => t.id === tab) * 2 + 2}</span>
      </section>
      {!still && <AnimatePresence>{turn && <PageTurn turn={turn} />}</AnimatePresence>}
    </div>
  );
}

function SinglePage({ tab, side, setSide, still }) {
  const S = SPREADS[tab];
  const C = side === 0 ? S.left : S.right;
  return (
    <div className="single-page">
      <div className="page-switch" role="tablist">
        {S.labels.map((l, i) => (
          <button key={l} role="tab" aria-selected={side === i} className={side === i ? 'on' : ''} onClick={() => setSide(i)}>
            {side === i && <motion.span layoutId="ps-pill" className="pill" />}
            {l}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${tab}-${side}`}
          className="page"
          initial={still ? false : { opacity: 0, rotateY: side ? 12 : -12, x: side ? 30 : -30 }}
          animate={{ opacity: 1, rotateY: 0, x: 0 }}
          exit={still ? undefined : { opacity: 0, x: side ? -30 : 30 }}
          transition={{ duration: .32, ease: [.16, 1, .3, 1] }}
          style={{ transformPerspective: 1200 }}
          drag={still ? false : 'x'} dragConstraints={{ left: 0, right: 0 }} dragElastic={.18} dragDirectionLock
          onDragEnd={(_, info) => {
            if (info.offset.x < -80 && side === 0) setSide(1);
            if (info.offset.x > 80 && side === 1) setSide(0);
          }}
        >
          <div className="page-inner"><C /></div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const { state, authReady } = useGame();
  const layout = useLayout();
  const still = useReducedMotion(state);
  const [tab, setTabState] = useState(initialTab);
  const [side, setSide] = useState(0);
  const [turn, setTurn] = useState(null);
  const turnId = useRef(0);

  const setTab = (next) => {
    if (next === tab) return;
    const dir = TABS.findIndex(t => t.id === next) - TABS.findIndex(t => t.id === tab);
    setTurn({ id: ++turnId.current, dir });
    setTabState(next);
    setSide(0);
    history.replaceState(null, '', `#${next}`);
    document.querySelectorAll('.page-inner').forEach(el => el.scrollTo?.(0, 0));
    window.scrollTo?.(0, 0);
  };
  useEffect(() => {
    if (!turn) return;
    const t = setTimeout(() => setTurn(null), 800);
    return () => clearTimeout(t);
  }, [turn]);
  useEffect(() => {
    const on = () => { const h = initialTab(); setTabState(h); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  if (!state.character) {
    return (
      <div className="desk">
        <div className="candlelight" />
        {!still && <Motes />}
        {authReady ? <Onboarding /> : null}
        <Toasts />
      </div>
    );
  }

  return (
    <div className="desk">
      <div className="candlelight" />
      {!still && <Motes />}
      <Hud onTab={setTab} compact={layout === 'phone'} />
      <main className="tome-wrap">
        {layout === 'spread' ? (
          <div className="tome">
            <Ribbons tab={tab} onTab={setTab} />
            <Spread tab={tab} turn={turn} still={still} />
          </div>
        ) : (
          <>
            {layout === 'page' && (
              <div className="chips" style={{ justifyContent: 'center', marginBottom: 12 }}>
                {TABS.map(t => <button key={t.id} className={`chip ${tab === t.id ? 'on' : ''}`} style={{ color: tab === t.id ? undefined : 'var(--vellum-200)', '--chip': t.ribbon }} onClick={() => setTab(t.id)}><t.icon size={14} /> {t.label}</button>)}
              </div>
            )}
            {layout === 'phone' && (tab === 'hero' || tab === 'talents' || tab === 'trophies') && (
              <div className="chips" style={{ justifyContent: 'center', marginBottom: 10 }}>
                {['hero', 'talents', 'trophies'].map(id => { const t = TABS.find(x => x.id === id); return <button key={id} className={`chip ${tab === id ? 'on' : ''}`} style={{ color: tab === id ? undefined : 'var(--vellum-200)', '--chip': t.ribbon }} onClick={() => setTab(id)}><t.icon size={14} /> {t.label}</button>; })}
              </div>
            )}
            <SinglePage tab={tab} side={side} setSide={setSide} still={still} />
          </>
        )}
      </main>
      {layout === 'phone' && <BottomNav tab={tab} onTab={setTab} />}
      <Ceremonies />
      <Toasts />
    </div>
  );
}
