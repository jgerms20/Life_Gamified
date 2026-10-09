import { motion } from 'framer-motion';
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS } from '../lib/engine';
import { useGame } from '../lib/game';

function Hall({ groups, title, eyebrow }) {
  const { state } = useGame();
  const total = ACHIEVEMENTS.length;
  const won = Object.keys(state.achievements).length;
  return (
    <>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="page-title">{title}</h2>
      {groups.includes('progression') && <p className="page-sub">{won} of {total} trophies hang in the great hall.</p>}
      {groups.map(g => (
        <section key={g}>
          <h4 className="section-title">{ACHIEVEMENT_GROUPS[g]}</h4>
          <div className="trophy-grid">
            {ACHIEVEMENTS.filter(a => a.group === g).map((a, i) => {
              const at = state.achievements[a.id];
              return (
                <motion.div key={a.id} className={`trophy ${at ? 'won' : ''}`} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * .04 }} whileHover={at ? { y: -4 } : {}}>
                  <div className="shield">{at ? a.icon : '?'}</div>
                  <b>{a.name}</b>
                  <p>{a.description}</p>
                  {at && <div className="when">{new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                </motion.div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

export const TrophyHallLeft = () => <Hall groups={['progression', 'dedication']} title="The Great Hall" eyebrow="Trophy room" />;
export const TrophyHallRight = () => <Hall groups={['mastery', 'challenge']} title="Feats of Renown" eyebrow="East wing" />;
