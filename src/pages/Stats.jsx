import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES, DIFFICULTIES, DIFFICULTY_ORDER, addDays, computeStreak } from '../lib/engine';
import { useGame } from '../lib/game';
import { Flourish } from '../components/Ornaments';

function Heatmap({ log, today, weeks = 20 }) {
  const cells = useMemo(() => {
    const dow = new Date(`${today}T12:00:00Z`).getUTCDay();
    const start = addDays(today, -(weeks * 7 - 1) + (6 - dow));
    const out = [];
    for (let i = 0; i < weeks * 7; i++) {
      const day = addDays(start, i);
      if (day > today) { out.push({ day, n: -1 }); continue; }
      out.push({ day, n: log[day] || 0 });
    }
    return out;
  }, [log, today, weeks]);
  const level = n => (n <= 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4);
  return (
    <>
      <div className="heatmap" role="img" aria-label="Quests completed per day">
        {cells.map(c => c.n < 0
          ? <i key={c.day} style={{ visibility: 'hidden' }} />
          : <i key={c.day} data-l={level(c.n)} className={c.day === today ? 'today' : ''} title={`${new Date(`${c.day}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}: ${c.n} quest${c.n === 1 ? '' : 's'}`} />)}
      </div>
      <div className="legend">Fewer {[0, 1, 2, 3, 4].map(l => <i key={l} className="heat-l" style={{ background: ['rgba(90,60,30,.1)', '#e5c46b', '#c9962e', '#9a6a14', '#6b4507'][l] }} />)} More</div>
    </>
  );
}

function StreakLine({ log, today, days = 60 }) {
  const pts = useMemo(() => Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1);
    return { day, v: (log[day] || 0) > 0 ? computeStreak(log, day) : 0 };
  }), [log, today, days]);
  const [hover, setHover] = useState(null);
  const W = 520, H = 150, P = 24;
  const max = Math.max(3, ...pts.map(p => p.v));
  const x = i => P + (i / (days - 1)) * (W - P * 2);
  const y = v => H - P - (v / max) * (H - P * 2);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(days - 1)},${H - P} L${x(0)},${H - P} Z`;
  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} onMouseLeave={() => setHover(null)}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        const i = Math.round(((e.clientX - r.left) / r.width * W - P) / (W - P * 2) * (days - 1));
        setHover(Math.max(0, Math.min(days - 1, i)));
      }} role="img" aria-label="Streak length over the last 60 days">
      {[0, .5, 1].map(f => <line key={f} x1={P} x2={W - P} y1={y(max * f)} y2={y(max * f)} stroke="rgba(90,60,30,.15)" />)}
      <text x={P - 6} y={y(max) + 4} textAnchor="end" fontSize="10" fill="#8a7058">{max}</text>
      <text x={P - 6} y={y(0) + 4} textAnchor="end" fontSize="10" fill="#8a7058">0</text>
      <motion.path d={area} fill="rgba(184,54,13,.1)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
      <motion.path d={line} fill="none" stroke="#b8360d" strokeWidth="2" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: 'easeInOut' }} />
      <text x={P} y={H - 6} fontSize="10" fill="#8a7058">{days} days ago</text>
      <text x={W - P} y={H - 6} fontSize="10" fill="#8a7058" textAnchor="end">today</text>
      {hover !== null && (
        <g>
          <line x1={x(hover)} x2={x(hover)} y1={P - 6} y2={H - P} stroke="rgba(42,26,16,.35)" strokeDasharray="3 3" />
          <circle cx={x(hover)} cy={y(pts[hover].v)} r="4.5" fill="#b8360d" stroke="#fbf3df" strokeWidth="2" />
          <g transform={`translate(${Math.min(W - 120, Math.max(0, x(hover) - 60))}, 0)`}>
            <rect width="120" height="22" rx="4" fill="#2a1a10" />
            <text x="60" y="15" textAnchor="middle" fontSize="11" fill="#f4e4bc">
              {new Date(`${pts[hover].day}T12:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })} · 🔥 {pts[hover].v}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}

/** A compass rose whose four points stretch with each domain's tally. */
function CompassRose({ counts }) {
  const keys = ['health', 'intelligence', 'money', 'relationships'];
  const max = Math.max(1, ...keys.map(k => counts[k] || 0));
  const [hover, setHover] = useState(null);
  const C = 130;
  return (
    <svg className="chart-svg" viewBox="0 0 260 260" style={{ maxWidth: 340, margin: '0 auto' }} role="img" aria-label="Quests by category">
      <circle cx={C} cy={C} r="104" fill="none" stroke="rgba(90,60,30,.25)" />
      <circle cx={C} cy={C} r="96" fill="none" stroke="rgba(90,60,30,.15)" strokeDasharray="2 5" />
      {Array.from({ length: 32 }, (_, i) => {
        const a = (i / 32) * Math.PI * 2;
        const r1 = i % 8 === 0 ? 92 : 98;
        return <line key={i} x1={C + Math.cos(a) * r1} y1={C + Math.sin(a) * r1} x2={C + Math.cos(a) * 104} y2={C + Math.sin(a) * 104} stroke="rgba(90,60,30,.35)" />;
      })}
      {keys.map((k, i) => {
        const cat = CATEGORIES[k];
        const n = counts[k] || 0;
        const len = 18 + (n / max) * 70;
        const a = -Math.PI / 2 + i * Math.PI / 2;
        const tip = [C + Math.cos(a) * len, C + Math.sin(a) * len];
        const l = [C + Math.cos(a - Math.PI / 2) * 13, C + Math.sin(a - Math.PI / 2) * 13];
        const r = [C + Math.cos(a + Math.PI / 2) * 13, C + Math.sin(a + Math.PI / 2) * 13];
        const lab = [C + Math.cos(a) * 120, C + Math.sin(a) * 120];
        return (
          <g key={k} onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
            <motion.path
              d={`M${C},${C} L${l[0]},${l[1]} L${tip[0]},${tip[1]} L${r[0]},${r[1]} Z`}
              fill={cat.color} stroke="#fbf3df" strokeWidth="2" opacity={hover && hover !== k ? .45 : .92}
              initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ originX: `${C}px`, originY: `${C}px` }}
              transition={{ delay: .1 + i * .1, type: 'spring', stiffness: 120, damping: 14 }} />
            <text x={lab[0]} y={lab[1] + 4} textAnchor="middle" fontSize="11" fill="#2a1a10" fontWeight="600">{cat.icon} {n}</text>
          </g>
        );
      })}
      <circle cx={C} cy={C} r="7" fill="url(#rose-gold)" stroke="#5a4330" />
      <defs><radialGradient id="rose-gold"><stop offset="0" stopColor="#fff1b0" /><stop offset="1" stopColor="#9a7420" /></radialGradient></defs>
      {hover && <text x={C} y={250} textAnchor="middle" fontSize="12" fill="#5a4330">{CATEGORIES[hover].label}: {counts[hover] || 0} quests</text>}
    </svg>
  );
}

export function StatsLeft() {
  const { state, today, derived } = useGame();
  const s = state.stats;
  return (
    <>
      <div className="eyebrow">Annals</div>
      <h2 className="page-title">The Long Road</h2>
      <p className="page-sub">Every square is a day; every gilded one, a day you moved your life forward.</p>
      <h4 className="section-title">Last twenty weeks</h4>
      <Heatmap log={s.dailyLog} today={today} />
      <h4 className="section-title">Streak history</h4>
      <StreakLine log={s.dailyLog} today={today} />
      <h4 className="section-title">Personal records</h4>
      <div className="records">
        <div className="record"><b>🔥 {s.longestStreak}</b><span>Longest streak</span></div>
        <div className="record"><b>⚡ {s.bestDay}</b><span>Most deeds in a day</span></div>
        <div className="record"><b>{s.totalXp.toLocaleString()}</b><span>Lifetime XP</span></div>
        <div className="record"><b>🪙 {s.totalGold.toLocaleString()}</b><span>Gold earned</span></div>
        <div className="record"><b>{s.perfectDays}</b><span>Perfect days</span></div>
        <div className="record"><b>{derived.level}</b><span>Level</span></div>
      </div>
    </>
  );
}

export function StatsRight() {
  const { state } = useGame();
  const s = state.stats;
  const maxD = Math.max(1, ...DIFFICULTY_ORDER.map(d => s.byDifficulty[d] || 0));
  const total = s.completed + s.failed + s.abandoned;
  return (
    <>
      <div className="eyebrow">Cartography</div>
      <h2 className="page-title">Where Your Days Go</h2>
      <p className="page-sub">The compass leans toward the domains you tend most.</p>
      <div style={{ marginTop: 14 }}><CompassRose counts={s.byCategory} /></div>
      <h4 className="section-title">By peril</h4>
      <div className="bars" role="img" aria-label="Quests completed by difficulty">
        {DIFFICULTY_ORDER.map((d, i) => {
          const n = s.byDifficulty[d] || 0;
          return (
            <div className="bar" key={d} style={{ '--bar': ['#9c9486', '#7d8a3a', '#c9962e', '#c26a1c', '#8a3fd1', '#e08a12'][i] }} title={`${DIFFICULTIES[d].label}: ${n}`}>
              <b>{n}</b>
              <motion.i initial={{ height: 0 }} animate={{ height: `${(n / maxD) * 100}%` }} transition={{ delay: i * .06, duration: .8, ease: [.16, 1, .3, 1] }} />
              <span>{DIFFICULTIES[d].label}</span>
            </div>
          );
        })}
      </div>
      <h4 className="section-title">Outcomes</h4>
      <div className="kv"><span>Completed</span><b>{s.completed} {total ? `(${Math.round(s.completed / total * 100)}%)` : ''}</b></div>
      <div className="kv"><span>Failed</span><b>{s.failed}</b></div>
      <div className="kv"><span>Abandoned</span><b>{s.abandoned}</b></div>
      <div className="kv"><span>Rewards won</span><b>{s.rewardsWon}</b></div>
      <div className="kv"><span>Logged by your scribe</span><b>{state.history.filter(h => h.actor === 'agent').length}</b></div>
      <Flourish />
    </>
  );
}
