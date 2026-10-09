import { motion } from 'framer-motion';
import { TALENTS, talentRank } from '../lib/engine';
import { useGame } from '../lib/game';
import { Flourish } from '../components/Ornaments';

export function TalentTree() {
  const { state, derived, dispatch } = useGame();
  const nextAt = Math.ceil((derived.level + 1) / 5) * 5;
  return (
    <>
      <div className="eyebrow">The five paths</div>
      <h2 className="page-title">Talent Tree</h2>
      <p className="page-sub">
        {derived.talentPoints > 0
          ? <><b style={{ color: 'var(--rubric)' }}>{derived.talentPoints} talent point{derived.talentPoints > 1 ? 's' : ''}</b> await your choosing.</>
          : <>Your next talent point arrives at level {nextAt}.</>}
      </p>
      <div style={{ marginTop: 18 }}>
        {Object.entries(TALENTS).map(([k, t], i) => {
          const rank = talentRank(state, k);
          const can = derived.talentPoints > 0 && rank < t.maxRank;
          return (
            <motion.div key={k} className={`talent ${rank ? 'ranked' : ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 }}>
              <div className="gem"><span>{t.icon}</span></div>
              <div>
                <b style={{ fontFamily: 'var(--f-head)', letterSpacing: '.08em', fontSize: 15 }}>{t.label}</b>
                <div className="pips">{Array.from({ length: t.maxRank }, (_, j) => <i key={j} className={j < rank ? 'on' : ''} />)}</div>
                <p style={{ color: 'var(--ink-soft)', fontStyle: 'italic', fontSize: 15.5 }}>Each rank: {t.perRank}</p>
                {can && (
                  <motion.button className="btn btn-gold btn-sm" style={{ marginTop: 8 }} whileTap={{ scale: .9 }}
                    onClick={() => dispatch({ type: 'LEARN_TALENT', payload: { path: k } })}>
                    ✦ {rank ? 'Deepen' : 'Learn'} (rank {rank + 1})
                  </motion.button>
                )}
                {rank === t.maxRank && <p className="hand" style={{ color: 'var(--gold-deep)', fontSize: 18 }}>Mastered</p>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

export function TalentLore() {
  const { state, derived } = useGame();
  const r = k => talentRank(state, k);
  const bonuses = [
    r('discipline') && `+${5 * r('discipline')}% XP on recurring quests`,
    r('ambition') && `+${10 * r('ambition')}% XP on Hard and harder quests`,
    r('fortune') && `+${15 * r('fortune')}% gold and +${3 * r('fortune')}% reward chance`,
    r('wisdom') && `−${10 * r('wisdom')}% MP cost on every ability`,
    r('resilience') && `+${20 * r('resilience')} max HP, −${25 * r('resilience')}% failure damage`,
  ].filter(Boolean);
  return (
    <>
      <div className="eyebrow">Marginalia</div>
      <h2 className="page-title">On the Paths</h2>
      <p className="lede drop-cap" style={{ marginTop: 10 }}>
        Talent points are granted by the Council of Elders at every fifth level — a recognition of steady effort rather than lucky days. Spend them where your life needs the most leverage: discipline for those who live by routine, ambition for those who hunt big game, fortune for treasure seekers.
      </p>
      <h4 className="section-title">Your blessings</h4>
      {bonuses.length ? bonuses.map(b => <div key={b} className="kv"><span>{b}</span><b>✦</b></div>) : <p className="muted" style={{ fontStyle: 'italic' }}>None yet — reach level 5 for your first point.</p>}
      <h4 className="section-title">Progress</h4>
      <div className="kv"><span>Current level</span><b>{derived.level}</b></div>
      <div className="kv"><span>Points earned</span><b>{Math.floor(derived.level / 5)}</b></div>
      <div className="kv"><span>Points unspent</span><b>{derived.talentPoints}</b></div>
      <Flourish />
    </>
  );
}
