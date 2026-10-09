import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { useGame, useReducedMotion } from '../lib/game';
import { REWARD_TIERS, CATEGORIES } from '../lib/engine';
import { sfx } from '../lib/sound';
import { Chest } from './Ornaments';

function useTypewriter(text = '', active = true, speed = 28) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!active) return;
    const id = setInterval(() => setN(v => (v >= text.length ? (clearInterval(id), v) : v + 1)), speed);
    return () => clearInterval(id);
  }, [text, active, speed]);
  return text.slice(0, n);
}

function Burst({ color = '#ffd76a', count = 34, spread = 220, still }) {
  const parts = useMemo(() => Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + Math.random() * .4;
    const r = spread * (.45 + Math.random() * .7);
    return { id: i, x: Math.cos(a) * r, y: Math.sin(a) * r - 60, s: 3 + Math.random() * 7, d: Math.random() * .25, c: Math.random() > .3 ? color : '#fff6d8' };
  }), [count, spread, color]);
  if (still) return null;
  return parts.map(p => (
    <motion.span key={p.id} className="particle"
      style={{ width: p.s, height: p.s, background: p.c, boxShadow: `0 0 ${p.s * 2}px ${p.c}` }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x: p.x, y: p.y, opacity: 0, scale: .3 }}
      transition={{ duration: 1.3 + Math.random() * .6, delay: p.d, ease: [.1, .7, .3, 1] }}
    />
  ));
}

function Swirl({ still }) {
  const parts = useMemo(() => Array.from({ length: 26 }, (_, i) => ({ id: i, r: 120 + Math.random() * 160, s: 2 + Math.random() * 5, d: Math.random() * 2, dur: 3 + Math.random() * 3, start: Math.random() * 360 })), []);
  if (still) return null;
  return (
    <div style={{ position: 'absolute', left: '50%', top: '40%', width: 0, height: 0, pointerEvents: 'none' }}>
      {parts.map(p => (
        <motion.div key={p.id} style={{ position: 'absolute', width: 0, height: 0 }}
          initial={{ rotate: p.start }} animate={{ rotate: p.start + 360 }} transition={{ duration: p.dur, repeat: Infinity, ease: 'linear', delay: -p.d }}>
          <motion.span style={{ position: 'absolute', left: p.r, width: p.s, height: p.s, borderRadius: '50%', background: '#ffd76a', boxShadow: '0 0 10px #ffd76a' }}
            animate={{ opacity: [0, 1, 0], left: [p.r, p.r * .55, p.r * .2] }} transition={{ duration: p.dur, repeat: Infinity, delay: -p.d }} />
        </motion.div>
      ))}
    </div>
  );
}

function Source({ c }) {
  if (c.actor !== 'agent') return null;
  return <div className="ceremony-source"><Bot size={12} style={{ verticalAlign: -2 }} /> Recorded by your scribe · {new Date(c.at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</div>;
}

function LevelUp({ c, onDone, still }) {
  const flavour = useTypewriter(c.flavour, true, 32);
  useEffect(() => { sfx.levelUp(); }, []);
  return (
    <div className="ceremony-card" onClick={onDone}>
      <motion.div className="rays" initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 1, rotate: still ? 0 : 40 }} transition={{ duration: 8, ease: 'linear' }} />
      <Swirl still={still} />
      <Source c={c} />
      <motion.div className="ceremony-title" initial={{ y: -20, opacity: 0, letterSpacing: '.5em' }} animate={{ y: 0, opacity: 1, letterSpacing: '.08em' }} transition={{ duration: .8, ease: [.16, 1, .3, 1] }}>
        LEVEL UP
      </motion.div>
      <motion.div className="levelup-number" initial={{ scale: 3, opacity: 0, filter: 'blur(12px)' }} animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }} transition={{ delay: .3, type: 'spring', stiffness: 120, damping: 12 }}>
        {c.level}
      </motion.div>
      <p className="ceremony-sub">“{flavour}”</p>
      <motion.div className="ceremony-perks" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: .12, delayChildren: 1 } } }}>
        {['+1 every attribute', 'HP & MP restored', c.talentPoint && '✦ Talent point earned'].filter(Boolean).map(p => (
          <motion.span key={p} variants={{ h: { opacity: 0, y: 10 }, s: { opacity: 1, y: 0 } }}>{p}</motion.span>
        ))}
      </motion.div>
      <motion.button className="btn btn-gold" onClick={onDone} initial={{ opacity: 0 }} animate={{ opacity: 1, scale: [1, 1.04, 1] }} transition={{ opacity: { delay: 1.4 }, scale: { repeat: Infinity, duration: 1.8, delay: 1.4 } }}>
        Onward
      </motion.button>
    </div>
  );
}

function ChestReveal({ c, onDone, still }) {
  const loot = c.loot;
  const tier = REWARD_TIERS[loot.tier] || REWARD_TIERS.common;
  const [phase, setPhase] = useState(still ? 'open' : 'arrive');
  const desc = useTypewriter(loot.description, phase === 'open', 24);
  useEffect(() => {
    if (still) return;
    const t1 = setTimeout(() => setPhase('shaking'), 500);
    const t2 = setTimeout(() => { setPhase('open'); sfx.chest(); }, 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [still]);
  return (
    <div className="ceremony-card" style={{ '--tier': tier.color }}>
      <Source c={c} />
      {loot.label && <div className="ceremony-source" style={{ color: 'var(--gold-bright)' }}>✦ {loot.label} bonus ✦</div>}
      <div className="chest-stage">
        {phase === 'open' && <Burst color={tier.color} still={still} />}
        <motion.div initial={{ y: -200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
          <Chest state={phase === 'arrive' ? 'closed' : phase} glow={tier.color} width={210} />
        </motion.div>
      </div>
      <AnimatePresence>
        {phase === 'open' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="tier-banner" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16, delay: .15 }}>
              {tier.label} {loot.outcome === 'gold' ? 'coffer' : 'reward'}
            </motion.div>
            <motion.div className="reward-name" initial={{ y: 30, opacity: 0, filter: 'blur(8px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} transition={{ delay: .35, duration: .7, ease: [.16, 1, .3, 1] }}>
              {loot.name}
            </motion.div>
            <p className="reward-desc">{desc}</p>
            <motion.button className="btn btn-gold" onClick={onDone} style={{ padding: '14px 34px', fontSize: 13 }}
              animate={{ scale: [1, 1.06, 1], boxShadow: ['0 0 0 rgba(255,215,106,0)', `0 0 30px ${tier.color}`, '0 0 0 rgba(255,215,106,0)'] }}
              transition={{ repeat: Infinity, duration: 1.6 }}>
              {loot.outcome === 'gold' ? `Pocket ${loot.gold} gold` : 'Claim reward'}
            </motion.button>
            {loot.outcome === 'reward' && <div className="tap-hint">It waits in your Treasury until you enjoy it.</div>}
          </motion.div>
        )}
      </AnimatePresence>
      {phase !== 'open' && <div className="tap-hint">{loot.questTitle ? `For “${loot.questTitle}”…` : 'Fate stirs…'}</div>}
    </div>
  );
}

const FULLSCREEN = c => c.type === 'level_up' || (c.type === 'chest' && c.loot?.outcome !== 'nothing');

export default function Ceremonies() {
  const { state, dispatch } = useGame();
  const still = useReducedMotion(state);
  const queue = state.ceremonies || [];
  const current = queue[0];
  const ack = (id) => dispatch({ type: 'ACK_CEREMONY', payload: { id } }, { silent: true });

  // Banners (small moments) dismiss themselves.
  useEffect(() => {
    if (!current || FULLSCREEN(current)) return;
    if (current.type === 'achievement') sfx.trophy();
    else if (current.type === 'chest') sfx.coin();
    const t = setTimeout(() => ack(current.id), current.type === 'chest' ? 2600 : 4200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const banner = current && !FULLSCREEN(current) ? current : null;
  return (
    <>
      <AnimatePresence mode="wait">
        {current && FULLSCREEN(current) && (
          <motion.div key={current.id} className="ceremony" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: .3 } }}>
            {current.type === 'level_up'
              ? <LevelUp c={current} onDone={() => ack(current.id)} still={still} />
              : <ChestReveal c={current} onDone={() => ack(current.id)} still={still} />}
            {queue.length > 2 && (
              <button className="btn btn-ghost on-dark btn-sm" style={{ position: 'absolute', top: 16, right: 16 }} onClick={() => dispatch({ type: 'ACK_CEREMONY', payload: { all: true } }, { silent: true })}>
                Skip {queue.length - 1} more
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="banner-stack" aria-live="polite">
        <AnimatePresence>
          {banner && (
            <motion.div key={banner.id} className="banner" onClick={() => ack(banner.id)}
              initial={{ y: -40, opacity: 0, scale: .9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
              {banner.type === 'achievement' && <>
                <motion.div className="medal" initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: .1 }}>{banner.icon}</motion.div>
                <div><b>Trophy earned</b><p>{banner.name} — {banner.description}</p></div>
              </>}
              {banner.type === 'mastery' && <>
                <div className="medal">{CATEGORIES[banner.category]?.icon}</div>
                <div><b>Mastery rank {banner.rank}</b><p>{CATEGORIES[banner.category]?.label} grows stronger · +50 XP</p></div>
              </>}
              {banner.type === 'chest' && <>
                <div className="medal wood"><Chest small width={40} state="open" glow="#b07a4a" /></div>
                <div><b>A few copper coins</b><p>{banner.loot.flavour} (+{banner.loot.copper}g)</p></div>
              </>}
              <span className="hand" style={{ color: 'rgba(244,228,188,.4)' }}>✕</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
