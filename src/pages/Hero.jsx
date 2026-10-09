import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Check } from 'lucide-react';
import { CATEGORIES, CLASSES, ABILITIES, ACHIEVEMENTS, talentRank } from '../lib/engine';
import { useGame } from '../lib/game';
import { Flourish } from '../components/Ornaments';

const STATS = [
  { key: 'vitality', label: 'Vitality', icon: '❤️', desc: 'Health quests · raises max HP', color: 'var(--c-health)' },
  { key: 'wisdom',   label: 'Wisdom',   icon: '📜', desc: 'Intelligence quests · raises max MP', color: 'var(--c-intelligence)' },
  { key: 'fortune',  label: 'Fortune',  icon: '🪙', desc: 'Money quests · more gold & loot', color: 'var(--c-money)' },
  { key: 'charisma', label: 'Charisma', icon: '💞', desc: 'Relationship quests · reputation', color: 'var(--c-relationships)' },
];

function Crest({ pct, icon }) {
  const r = 58, c = 2 * Math.PI * r;
  return (
    <div className="hero-crest">
      <svg className="ring" viewBox="0 0 132 132">
        <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(90,60,30,.15)" strokeWidth="6" />
        <motion.circle cx="66" cy="66" r={r} fill="none" stroke="url(#crest-g)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }}
          transform="rotate(-90 66 66)" transition={{ duration: 1.4, ease: [.16, 1, .3, 1] }} />
        <circle cx="66" cy="66" r="46" fill="rgba(255,252,240,.5)" stroke="rgba(154,116,32,.5)" strokeWidth="1" strokeDasharray="2 4" />
        <defs><linearGradient id="crest-g"><stop offset="0" stopColor="#9a7420" /><stop offset="1" stopColor="#f6dc7a" /></linearGradient></defs>
      </svg>
      <span className="icon">{icon}</span>
    </div>
  );
}

export function HeroSheet() {
  const { state, derived, dispatch } = useGame();
  const c = state.character;
  const cls = CLASSES[c.class];
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(c.name);
  const [title, setTitle] = useState(c.title);

  const save = () => { dispatch({ type: 'UPDATE_CHARACTER', payload: { name, title } }); setEditing(false); };

  return (
    <>
      <div className="eyebrow" style={{ textAlign: 'center' }}>Character sheet</div>
      <div className="hero-plate">
        <Crest pct={derived.xpPct} icon={cls.icon} />
        {editing ? (
          <div style={{ maxWidth: 320, margin: '0 auto' }}>
            <input className="input hand-input" value={name} onChange={e => setName(e.target.value)} style={{ textAlign: 'center', marginBottom: 6 }} />
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={{ textAlign: 'center', marginBottom: 8 }} />
            <select className="select input" value={c.class} onChange={e => dispatch({ type: 'UPDATE_CHARACTER', payload: { class: e.target.value } })} style={{ marginBottom: 8 }}>
              {Object.entries(CLASSES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label} — {v.blurb}</option>)}
            </select>
            <button className="btn btn-ink btn-sm" onClick={save}><Check /> Save</button>
          </div>
        ) : (
          <>
            <div className="hero-name">{c.name} <button onClick={() => setEditing(true)} aria-label="Edit name" style={{ color: 'var(--ink-faint)', verticalAlign: 4 }}><Pencil size={14} /></button></div>
            {c.title && <div className="hero-title">{c.title}</div>}
            <div className="class-badge">{cls.icon} Level {derived.level} {cls.label}</div>
            <p className="muted" style={{ fontStyle: 'italic', marginTop: 6 }}>{derived.xpInto.toLocaleString()} / {derived.xpNeed.toLocaleString()} XP to level {derived.level + 1}</p>
          </>
        )}
      </div>

      <h4 className="section-title">Vitals</h4>
      {[['HP · Health', derived.hp, derived.maxHp, 'linear-gradient(90deg,#6d140d,#d0402a)'], ['MP · Arcane power', derived.mp, derived.maxMp, 'linear-gradient(90deg,#1d2a72,#5f7cff)']].map(([l, v, m, bg]) => (
        <div className="res-bar" key={l}>
          <div className="lbl"><span>{l}</span><b>{v} / {m}</b></div>
          <div className="track"><motion.div className="fill" style={{ background: bg }} initial={{ width: 0 }} animate={{ width: `${(v / m) * 100}%` }} transition={{ duration: 1 }} /></div>
        </div>
      ))}
      {derived.wounded && <div className="notice warn" style={{ marginTop: 8 }}>You are wounded: XP gains are reduced by 25% until your HP recovers above a quarter. Rest, complete quests, or cast Second Wind.</div>}
      <div className="kv"><span>Gold in the coffers</span><b>🪙 {c.gold.toLocaleString()}</b></div>

      <h4 className="section-title">Attributes</h4>
      {STATS.map((s, i) => {
        const v = derived.stats[s.key];
        return (
          <motion.div key={s.key} className="stat-row" style={{ '--stat': s.color }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .07 }}>
            <span className="ico">{s.icon}</span>
            <span className="nm">{s.label}<small>{s.desc}</small></span>
            <span className="val">{v}</span>
            <div className="stat-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 1, delay: .2 + i * .07 }} /></div>
          </motion.div>
        );
      })}
      <p className="muted" style={{ fontSize: 14, fontStyle: 'italic', marginTop: 6 }}>Every level raises all four by one. Every ten quests in a domain raises its attribute by one more.</p>
    </>
  );
}

export function HeroArts() {
  const { state, derived, dispatch } = useGame();
  const wis = talentRank(state, 'wisdom');
  const recent = ACHIEVEMENTS.filter(a => state.achievements[a.id]).sort((a, b) => state.achievements[b.id] - state.achievements[a.id]).slice(0, 3);
  return (
    <>
      <div className="eyebrow">Arcana</div>
      <h2 className="page-title">Abilities</h2>
      <p className="page-sub">Spend MP for an edge. MP returns with every quest and every night’s rest.</p>
      <div style={{ marginTop: 16 }}>
        {Object.entries(ABILITIES).filter(([k]) => k !== 'time_warp').map(([k, a]) => {
          const cost = Math.round(a.mp * (1 - .1 * wis));
          const active = k === 'divination' && state.buffs.divination;
          return (
            <div className="ability" key={k}>
              <div className="orb">{a.icon}</div>
              <div><b>{a.label}</b><p>{a.blurb}</p><span className="cost">{cost} MP</span></div>
              <button className="btn btn-gold btn-sm" disabled={derived.mp < cost || active} onClick={() => dispatch({ type: 'USE_ABILITY', payload: { ability: k } })}>
                {active ? 'Active' : 'Cast'}
              </button>
            </div>
          );
        })}
        <p className="muted" style={{ fontSize: 14, fontStyle: 'italic' }}>⏳ Time Warp is cast from a quest card: it pushes that quest’s due date back a day.</p>
      </div>

      <h4 className="section-title">Mastery</h4>
      <div className="grid-2">
        {Object.entries(CATEGORIES).map(([k, cat]) => {
          const n = state.stats.byCategory[k] || 0;
          return (
            <div className="panel" key={k} style={{ marginBottom: 0 }}>
              <h4 style={{ color: cat.color }}>{cat.icon} {cat.label}</h4>
              <p style={{ fontFamily: 'var(--f-display)', fontSize: 26, color: 'var(--ink)' }}>Rank {Math.floor(n / 10)}</p>
              <div className="stat-bar" style={{ '--stat': cat.color, margin: '6px 0 4px' }}><i style={{ width: `${(n % 10) * 10}%` }} /></div>
              <p className="muted" style={{ fontSize: 13.5 }}>{n} quests · {10 - (n % 10)} to next rank</p>
            </div>
          );
        })}
      </div>

      {recent.length > 0 && (
        <>
          <h4 className="section-title">Latest honours</h4>
          {recent.map(a => (
            <div key={a.id} className="kv"><span>{a.icon} {a.name}</span><b className="hand" style={{ fontSize: 17, fontFamily: 'var(--f-hand)' }}>{new Date(state.achievements[a.id]).toLocaleDateString()}</b></div>
          ))}
        </>
      )}
      <Flourish />
    </>
  );
}
