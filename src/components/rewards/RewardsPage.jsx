import { useState } from 'react';
import { useGame, REWARD_TIERS } from '../../context/GameContext';

export default function RewardsPage() {
  const { state, dispatch } = useGame();
  const [showForm, setShowForm] = useState(false);
  const [editReward, setEditReward] = useState(null);

  function openEdit(r) { setEditReward(r); setShowForm(true); }
  function openNew()   { setEditReward(null); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditReward(null); }

  const grouped = Object.fromEntries(
    Object.keys(REWARD_TIERS).map(tier => [
      tier,
      state.rewards.filter(r => r.tier === tier),
    ])
  );

  return (
    <div className="scroll-area" style={{ height: '100%', padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '18px',
            color: 'var(--gold-leaf)', letterSpacing: '0.05em', marginBottom: '2px',
          }}>
            Reward Vault
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)', fontStyle: 'italic',
            fontSize: '13px', color: 'rgba(244,228,188,0.5)',
          }}>
            Your treasury of earned delights
          </p>
        </div>
        <button className="btn btn-gold" onClick={openNew} style={{ padding: '7px 14px', fontSize: '11px' }}>
          + Add Reward
        </button>
      </div>

      {/* Tier sections */}
      {Object.entries(REWARD_TIERS).map(([tier, info]) => (
        <div key={tier} style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '10px', paddingBottom: '6px',
            borderBottom: `1px solid ${info.color}44`,
          }}>
            <span style={{ fontSize: '18px' }}>{info.icon}</span>
            <h3 style={{
              fontFamily: 'var(--font-header)', fontSize: '12px',
              letterSpacing: '0.2em', color: info.glow,
              textTransform: 'uppercase',
            }}>
              {info.label} Rewards
            </h3>
            <span style={{
              fontFamily: 'var(--font-header)', fontSize: '10px',
              color: 'rgba(244,228,188,0.3)',
            }}>
              {Math.round(info.chance * 100)}% drop chance
            </span>
          </div>

          {grouped[tier]?.length === 0 ? (
            <p style={{
              fontFamily: 'var(--font-body)', fontStyle: 'italic',
              fontSize: '13px', color: 'rgba(244,228,188,0.3)', paddingLeft: '8px',
            }}>
              No {tier} rewards yet...
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {grouped[tier].map(reward => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  onEdit={() => openEdit(reward)}
                  onDelete={() => dispatch({ type: 'DELETE_REWARD', payload: reward.id })}
                  info={info}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {showForm && (
        <RewardForm
          initial={editReward}
          onClose={closeForm}
          onSave={data => {
            if (editReward) dispatch({ type: 'UPDATE_REWARD', payload: { ...editReward, ...data } });
            else dispatch({ type: 'ADD_REWARD', payload: data });
            closeForm();
          }}
        />
      )}
    </div>
  );
}

function RewardCard({ reward, onEdit, onDelete, info }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: `${info.color}11`,
      border: `1px solid ${info.color}33`,
      borderLeft: `3px solid ${info.color}`,
      borderRadius: '3px',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-header)', fontSize: '13px',
          color: 'var(--parchment-light)', marginBottom: '2px',
        }}>
          {reward.name}
        </div>
        {reward.description && (
          <p style={{
            fontFamily: 'var(--font-body)', fontStyle: 'italic',
            fontSize: '12px', color: 'rgba(244,228,188,0.5)',
          }}>
            {reward.description}
          </p>
        )}
        {reward.cooldown > 0 && (
          <span style={{
            fontFamily: 'var(--font-header)', fontSize: '10px',
            color: 'rgba(212,175,55,0.5)',
          }}>
            ⏱ {reward.cooldown < 60 ? `${reward.cooldown}m` : `${Math.round(reward.cooldown / 60)}h`} cooldown
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={onEdit}
          style={{
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
            color: 'var(--gold-dark)', borderRadius: '3px', cursor: 'pointer',
            padding: '4px 8px', fontSize: '11px', fontFamily: 'var(--font-header)',
          }}
        >
          ✎ Edit
        </button>
        <button
          onClick={() => confirm('Delete this reward?') && onDelete()}
          style={{
            background: 'rgba(139,37,0,0.2)', border: '1px solid rgba(139,37,0,0.4)',
            color: '#cc5533', borderRadius: '3px', cursor: 'pointer',
            padding: '4px 8px', fontSize: '11px',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function RewardForm({ initial, onClose, onSave }) {
  const [name, setName]           = useState(initial?.name || '');
  const [description, setDesc]    = useState(initial?.description || '');
  const [tier, setTier]           = useState(initial?.tier || 'common');
  const [cooldown, setCooldown]   = useState(initial?.cooldown ?? 0);
  const [error, setError]         = useState('');

  function handleSave() {
    if (!name.trim()) { setError('Reward needs a name.'); return; }
    onSave({ name: name.trim(), description: description.trim(), tier, cooldown: Number(cooldown) });
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="parchment-bg on-parchment animate-fade-in-up" style={{
        maxWidth: 420, width: '100%', borderRadius: '6px',
        border: '2px solid var(--brown-mid)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        overflow: 'hidden',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #2d1b0e, #1a0e08)',
          padding: '14px 20px', borderBottom: '2px solid var(--gold-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--parchment-light)' }}>
            {initial ? 'Edit Reward' : 'New Reward'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(244,228,188,0.5)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Name *</label>
            <input className="input-base" value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder="Reward name..." />
            {error && <p style={{ color: 'var(--ink-red)', fontSize: '12px', marginTop: '3px' }}>{error}</p>}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Description</label>
            <input className="input-base" value={description} onChange={e => setDesc(e.target.value)} placeholder="Optional description..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={lbl}>Tier</label>
              <select className="input-base" value={tier} onChange={e => setTier(e.target.value)}>
                {Object.entries(REWARD_TIERS).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Cooldown (minutes)</label>
              <input className="input-base" type="number" min={0} value={cooldown} onChange={e => setCooldown(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button className="btn btn-parchment" onClick={onClose}>Cancel</button>
            <button className="btn btn-dark" onClick={handleSave}>Save Reward</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const lbl = {
  display: 'block', fontFamily: 'var(--font-header)',
  fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase',
  color: 'var(--brown-mid)', marginBottom: '5px',
};
