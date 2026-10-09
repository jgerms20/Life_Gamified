import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Check, Pencil, Trash2, Undo2 } from 'lucide-react';
import { REWARD_TIERS, TIER_ORDER, rewardChance } from '../lib/engine';
import { useGame } from '../lib/game';
import { Flourish } from '../components/Ornaments';

const TIER_ICON = { common: '🍪', uncommon: '🍵', rare: '💎', epic: '🔮', legendary: '👑' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function Loot() {
  const { state, dispatch } = useGame();
  const [showUsed, setShowUsed] = useState(false);
  const unclaimed = state.loot.filter(l => !l.redeemedAt && l.outcome === 'reward');
  const used = state.loot.filter(l => l.redeemedAt).slice(0, 30);
  const chance = Math.round(rewardChance(state, 'medium') * 100);
  return (
    <>
      <div className="eyebrow">Your treasury</div>
      <h2 className="page-title">Spoils Awaiting</h2>
      <p className="page-sub">Rewards you have won but not yet enjoyed. Go on — you earned them.</p>
      <div className="today-card">
        <div className="today-stats">
          <div><b>{unclaimed.length}</b><span>To enjoy</span></div>
          <div><b>{state.stats.rewardsWon}</b><span>Ever won</span></div>
          <div><b>{chance}%</b><span>Medium-quest odds</span></div>
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <AnimatePresence initial={false}>
          {unclaimed.map(l => {
            const tier = REWARD_TIERS[l.tier];
            return (
              <motion.div key={l.id} layout className="loot" style={{ '--tier': tier.color }} initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 60 }}>
                <div className="gem">{TIER_ICON[l.tier]}</div>
                <div style={{ minWidth: 0 }}>
                  <span className="tier">{tier.label}{l.label ? ` · ${l.label}` : ''}</span>
                  <b style={{ display: 'block' }}>{l.name}</b>
                  <span className="muted" style={{ fontSize: 14, fontStyle: 'italic' }}>for “{l.questTitle}” · {new Date(l.at).toLocaleDateString()}</span>
                </div>
                <button className="btn btn-gold btn-sm" onClick={() => dispatch({ type: 'REDEEM_LOOT', payload: { id: l.id } })}><Check /> Enjoyed</button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!unclaimed.length && <div className="empty"><div className="art">🗝️</div><h3>The coffer is empty</h3><p>Complete quests to roll for rewards. Harder quests and long streaks tilt the odds.</p></div>}
      </div>
      {used.length > 0 && (
        <>
          <h4 className="section-title" style={{ cursor: 'pointer' }} onClick={() => setShowUsed(s => !s)}>Already enjoyed <span className="count">{used.length}</span></h4>
          {showUsed && used.map(l => (
            <div key={l.id} className="reward-row redeemed" style={{ '--tier': REWARD_TIERS[l.tier]?.color || '#999' }}>
              <span className="dot" />
              <div><b>{l.name}</b><small>{new Date(l.redeemedAt).toLocaleDateString()}</small></div>
              {l.outcome === 'reward' && <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'REDEEM_LOOT', payload: { id: l.id, undo: true } })} aria-label="Mark unused"><Undo2 /></button>}
            </div>
          ))}
        </>
      )}
    </>
  );
}

function RewardForm({ reward, onClose }) {
  const { dispatch } = useGame();
  const [f, setF] = useState({
    name: reward?.name || '', description: reward?.description || '', tier: reward?.tier || 'common',
    cooldownMinutes: reward?.cooldownMinutes || 0, months: reward?.months || [],
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const save = (e) => {
    e.preventDefault();
    const r = dispatch(reward ? { type: 'UPDATE_REWARD', payload: { id: reward.id, ...f } } : { type: 'ADD_REWARD', payload: f });
    if (r.ok) onClose();
  };
  return (
    <motion.form className="panel" onSubmit={save} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
      <label className="field"><span>Reward</span><input className="input" autoFocus required value={f.name} onChange={e => set('name', e.target.value)} placeholder="An hour of reading in the bath" /></label>
      <label className="field"><span>Details</span><input className="input" value={f.description} onChange={e => set('description', e.target.value)} placeholder="Optional" /></label>
      <div className="field"><span>Rarity</span>
        <div className="chips">{TIER_ORDER.map(t => <button type="button" key={t} className={`chip ${f.tier === t ? 'on' : ''}`} style={{ '--chip': REWARD_TIERS[t].color }} onClick={() => set('tier', t)}>{TIER_ICON[t]} {REWARD_TIERS[t].label}</button>)}</div>
      </div>
      <label className="field"><span>Cooldown after winning</span>
        <select className="select input" value={f.cooldownMinutes} onChange={e => set('cooldownMinutes', Number(e.target.value))}>
          {[[0, 'None'], [60, '1 hour'], [240, '4 hours'], [1440, '1 day'], [4320, '3 days'], [10080, '1 week'], [43200, '1 month']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <div className="field"><span>Seasonal · only in these months (none = always)</span>
        <div className="chips">{MONTHS.map((m, i) => <button type="button" key={m} className={`chip ${f.months.includes(i + 1) ? 'on' : ''}`} onClick={() => set('months', f.months.includes(i + 1) ? f.months.filter(x => x !== i + 1) : [...f.months, i + 1])}>{m}</button>)}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-ink btn-sm">Save</button><button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button></div>
    </motion.form>
  );
}

export function RewardTable() {
  const { state, dispatch } = useGame();
  const [editing, setEditing] = useState(null);
  return (
    <>
      <div className="eyebrow">The reward table</div>
      <h2 className="page-title">What the Fates May Grant</h2>
      <p className="page-sub">When a chest drops, it holds one of these. You choose the treats; the dice choose the timing.</p>
      <div style={{ margin: '14px 0' }}>
        <button className="btn btn-ink btn-sm" onClick={() => setEditing('new')}><Plus /> Add a reward</button>
      </div>
      <AnimatePresence>{editing === 'new' && <RewardForm onClose={() => setEditing(null)} />}</AnimatePresence>
      {TIER_ORDER.map(t => {
        const list = state.rewards.filter(r => r.tier === t);
        return (
          <section key={t}>
            <h4 className="section-title" style={{ color: REWARD_TIERS[t].color }}>{TIER_ICON[t]} {REWARD_TIERS[t].label} <span className="count">{REWARD_TIERS[t].weight}% of drops</span></h4>
            {!list.length && <p className="muted" style={{ fontStyle: 'italic', fontSize: 15 }}>No {t} rewards — chests of this rarity pay out gold instead.</p>}
            {list.map(r => (
              <div key={r.id}>
                <div className={`reward-row ${r.enabled === false ? 'off' : ''}`} style={{ '--tier': REWARD_TIERS[r.tier].color }}>
                  <span className="dot" />
                  <div>
                    <b>{r.name}</b>
                    <small>{[r.description, r.cooldownMinutes ? `cooldown ${r.cooldownMinutes >= 1440 ? `${Math.round(r.cooldownMinutes / 1440)}d` : `${Math.round(r.cooldownMinutes / 60)}h`}` : null, r.months?.length ? r.months.map(m => MONTHS[m - 1]).join('/') : null].filter(Boolean).join(' · ')}</small>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className={`toggle ${r.enabled !== false ? 'on' : ''}`} onClick={() => dispatch({ type: 'UPDATE_REWARD', payload: { id: r.id, enabled: r.enabled === false } })} aria-label="Enabled" />
                    <button className="btn btn-ghost btn-icon" style={{ boxShadow: 'none' }} onClick={() => setEditing(r.id)} aria-label="Edit"><Pencil size={14} /></button>
                    <button className="btn btn-ghost btn-icon" style={{ boxShadow: 'none' }} onClick={() => confirm(`Remove “${r.name}”?`) && dispatch({ type: 'DELETE_REWARD', payload: { id: r.id } })} aria-label="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
                <AnimatePresence>{editing === r.id && <RewardForm reward={r} onClose={() => setEditing(null)} />}</AnimatePresence>
              </div>
            ))}
          </section>
        );
      })}
      <Flourish />
    </>
  );
}
