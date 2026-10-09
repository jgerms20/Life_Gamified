/**
 * Life Gamified — game engine.
 *
 * Pure, dependency-free ES module shared by the web app (browser) and the
 * Supabase Edge Functions (Deno). Every change to a journal goes through
 * `applyAction(state, action, ctx)`, which returns a new state plus the
 * events it produced. Nothing here touches the network, storage or DOM.
 *
 * Derived values (level, stats, max HP/MP, talent points, streak) are always
 * computed from stored facts, so undoing a deed or syncing from two devices
 * can never leave them inconsistent.
 */

export const SCHEMA_VERSION = 2;

// ── Catalogue ─────────────────────────────────────────────────────────────

export const CATEGORIES = {
  health:        { label: 'Health',        stat: 'vitality', icon: '❤️', color: '#a3271f', aliases: ['fitness', 'body', 'exercise', 'workout', 'sleep', 'nutrition', 'wellness', 'vitality', 'medical'] },
  intelligence:  { label: 'Intelligence',  stat: 'wisdom',   icon: '📜', color: '#2f5b9e', aliases: ['learning', 'study', 'mind', 'reading', 'work', 'career', 'skill', 'wisdom', 'education', 'creative'] },
  money:         { label: 'Money',         stat: 'fortune',  icon: '🪙', color: '#2f6b33', aliases: ['finance', 'finances', 'wealth', 'fortune', 'budget', 'business', 'income', 'admin'] },
  relationships: { label: 'Relationships', stat: 'charisma', icon: '💞', color: '#8a3a84', aliases: ['social', 'family', 'friends', 'love', 'partner', 'charisma', 'community', 'network'] },
};

export const DIFFICULTIES = {
  trivial:   { label: 'Trivial',   xp: 10,  stars: 0.5, rewardMod: -0.20, hpLoss: 4 },
  easy:      { label: 'Easy',      xp: 25,  stars: 1,   rewardMod: -0.10, hpLoss: 6 },
  medium:    { label: 'Medium',    xp: 50,  stars: 2,   rewardMod: 0,     hpLoss: 10 },
  hard:      { label: 'Hard',      xp: 100, stars: 3,   rewardMod: 0.10,  hpLoss: 15 },
  epic:      { label: 'Epic',      xp: 200, stars: 4,   rewardMod: 0.20,  hpLoss: 22 },
  legendary: { label: 'Legendary', xp: 500, stars: 5,   rewardMod: 1,     hpLoss: 30 },
};
export const DIFFICULTY_ORDER = ['trivial', 'easy', 'medium', 'hard', 'epic', 'legendary'];

export const CLASSES = {
  warrior:    { label: 'Warrior',    icon: '⚔️', bonus: { health: 0.2 },        blurb: '+20% XP on Health quests' },
  scholar:    { label: 'Scholar',    icon: '📖', bonus: { intelligence: 0.2 },  blurb: '+20% XP on Intelligence quests' },
  merchant:   { label: 'Merchant',   icon: '⚖️', bonus: { money: 0.2 },         blurb: '+20% XP on Money quests' },
  diplomat:   { label: 'Diplomat',   icon: '🕊️', bonus: { relationships: 0.2 }, blurb: '+20% XP on Relationships quests' },
  adventurer: { label: 'Adventurer', icon: '🧭', bonus: { all: 0.05 },          blurb: '+5% XP on every quest' },
};

export const REWARD_TIERS = {
  common:    { label: 'Common',    weight: 50, color: '#9c9486', gold: 15 },
  uncommon:  { label: 'Uncommon',  weight: 30, color: '#3f8f4a', gold: 35 },
  rare:      { label: 'Rare',      weight: 15, color: '#2f6fd1', gold: 80 },
  epic:      { label: 'Epic',      weight: 4,  color: '#8a3fd1', gold: 180 },
  legendary: { label: 'Legendary', weight: 1,  color: '#e08a12', gold: 400 },
};
export const TIER_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export const TALENTS = {
  discipline: { label: 'Path of Discipline', icon: '📿', maxRank: 3, perRank: '+5% XP on recurring quests' },
  ambition:   { label: 'Path of Ambition',   icon: '🗡️', maxRank: 3, perRank: '+10% XP on Hard, Epic and Legendary quests' },
  fortune:    { label: 'Path of Fortune',    icon: '🎲', maxRank: 3, perRank: '+15% gold, +3% reward chance' },
  wisdom:     { label: 'Path of Wisdom',     icon: '🔮', maxRank: 3, perRank: '−10% MP cost on abilities' },
  resilience: { label: 'Path of Resilience', icon: '🛡️', maxRank: 3, perRank: '+20 max HP, −25% failure damage' },
};

export const ABILITIES = {
  second_wind: { label: 'Second Wind', icon: '🌬️', mp: 20, blurb: 'Restore 35% of your max HP.' },
  divination:  { label: 'Divination',  icon: '🔮', mp: 30, blurb: 'Your next completed quest is guaranteed a reward, rolled one tier higher.' },
  time_warp:   { label: 'Time Warp',   icon: '⏳', mp: 25, blurb: 'Push a quest’s due date back by one day.' },
};

export const STARTER_REWARDS = [
  { name: 'A proper coffee break',      tier: 'common',    category: 'breaks',        description: 'Fifteen unhurried minutes, no screens.', cooldownMinutes: 0 },
  { name: 'Favourite snack',            tier: 'common',    category: 'treats',        description: 'Something small and delicious.', cooldownMinutes: 120 },
  { name: 'One guilt-free episode',     tier: 'uncommon',  category: 'entertainment', description: 'Pick the show. Enjoy it fully.', cooldownMinutes: 180 },
  { name: 'Long bath or hot shower',    tier: 'uncommon',  category: 'self-care',     description: 'Candles optional, recommended.', cooldownMinutes: 720 },
  { name: 'Gaming session',             tier: 'uncommon',  category: 'entertainment', description: 'An hour in another world.', cooldownMinutes: 240 },
  { name: 'Dinner somewhere good',      tier: 'rare',      category: 'social',        description: 'Book the table you have been eyeing.', cooldownMinutes: 4320 },
  { name: 'Movie night',                tier: 'rare',      category: 'entertainment', description: 'Snacks, blanket, a film of your choosing.', cooldownMinutes: 2880 },
  { name: 'Massage or spa hour',        tier: 'epic',      category: 'self-care',     description: 'Professional hands, zero obligations.', cooldownMinutes: 20160 },
  { name: 'Buy the thing',              tier: 'epic',      category: 'splurges',      description: 'That book, game or gadget on your list.', cooldownMinutes: 10080 },
  { name: 'Weekend adventure',          tier: 'legendary', category: 'splurges',      description: 'Plan a real trip or experience.', cooldownMinutes: 43200 },
];

const FLAVOUR_LEVEL = [
  'The realm takes note of your name.',
  'Your legend grows by candlelight.',
  'Ancient doors swing open before you.',
  'Even the bards are running out of rhymes.',
  'The stars rearrange themselves in your honour.',
  'You are becoming the hero of your own chronicle.',
  'Steel sharpens steel; you sharpened yourself.',
  'Another page turned. The story only deepens.',
];
const FLAVOUR_NOTHING = [
  'The fates were not generous… but your XP is eternal.',
  'The chest held only dust and a few copper coins. The deed still counts.',
  'Fortune looked away this time. Glory did not.',
];

// ── Achievements ──────────────────────────────────────────────────────────

const lvl = s => levelInfo(s.character.xp).level;
const cat = (s, c) => s.stats.byCategory[c] || 0;

export const ACHIEVEMENTS = [
  { id: 'first_steps',    group: 'progression', icon: '👣', name: 'First Steps',     description: 'Complete your first quest.',           test: s => s.stats.completed >= 1 },
  { id: 'apprentice',     group: 'progression', icon: '🕯️', name: 'Apprentice',      description: 'Reach level 5.',                       test: s => lvl(s) >= 5 },
  { id: 'journeyman',     group: 'progression', icon: '🗺️', name: 'Journeyman',      description: 'Reach level 10.',                      test: s => lvl(s) >= 10 },
  { id: 'expert',         group: 'progression', icon: '⚔️', name: 'Expert',          description: 'Reach level 25.',                      test: s => lvl(s) >= 25 },
  { id: 'master',         group: 'progression', icon: '🏰', name: 'Master',          description: 'Reach level 50.',                      test: s => lvl(s) >= 50 },
  { id: 'grandmaster',    group: 'progression', icon: '👑', name: 'Grandmaster',     description: 'Reach level 100.',                     test: s => lvl(s) >= 100 },
  { id: 'health_master',  group: 'mastery',     icon: '❤️', name: 'Iron Constitution', description: 'Complete 50 Health quests.',        test: s => cat(s, 'health') >= 50 },
  { id: 'intel_master',   group: 'mastery',     icon: '📜', name: 'Arcane Scholar',  description: 'Complete 50 Intelligence quests.',     test: s => cat(s, 'intelligence') >= 50 },
  { id: 'money_master',   group: 'mastery',     icon: '🪙', name: 'Golden Ledger',   description: 'Complete 50 Money quests.',            test: s => cat(s, 'money') >= 50 },
  { id: 'rel_master',     group: 'mastery',     icon: '💞', name: 'Silver Tongue',   description: 'Complete 50 Relationships quests.',    test: s => cat(s, 'relationships') >= 50 },
  { id: 'renaissance',    group: 'mastery',     icon: '🌹', name: 'Renaissance Soul', description: '50 quests in every category.',        test: s => Object.keys(CATEGORIES).every(c => cat(s, c) >= 50) },
  { id: 'streak_7',       group: 'dedication',  icon: '🔥', name: 'Kindled',         description: 'Hold a 7-day streak.',                 test: s => s.stats.longestStreak >= 7 },
  { id: 'streak_30',      group: 'dedication',  icon: '🌋', name: 'Eternal Flame',   description: 'Hold a 30-day streak.',                test: s => s.stats.longestStreak >= 30 },
  { id: 'streak_100',     group: 'dedication',  icon: '☀️', name: 'Sunforged',       description: 'Hold a 100-day streak.',               test: s => s.stats.longestStreak >= 100 },
  { id: 'streak_365',     group: 'dedication',  icon: '🌌', name: 'Year of Legend',  description: 'Hold a 365-day streak.',               test: s => s.stats.longestStreak >= 365 },
  { id: 'dragon_slayer',  group: 'challenge',   icon: '🐉', name: 'Dragon Slayer',   description: 'Complete a Legendary quest.',          test: s => (s.stats.byDifficulty.legendary || 0) >= 1 },
  { id: 'speed_runner',   group: 'challenge',   icon: '⚡', name: 'Speed Runner',    description: 'Complete 10 quests in a single day.',  test: s => s.stats.bestDay >= 10 },
  { id: 'perfectionist',  group: 'challenge',   icon: '💎', name: 'Perfectionist',   description: 'Finish every bonus objective on a quest (at least two).', test: s => s.stats.perfectQuests >= 1 },
  { id: 'perfect_day',    group: 'challenge',   icon: '🌅', name: 'Flawless Day',    description: 'Clear every quest due today.',         test: s => s.stats.perfectDays >= 1 },
  { id: 'hoarder',        group: 'challenge',   icon: '💰', name: 'Dragon’s Hoard',  description: 'Hold 1,000 gold at once.',             test: s => s.character.gold >= 1000 },
];
export const ACHIEVEMENT_GROUPS = {
  progression: 'Hall of Ascension',
  mastery:     'Gallery of Mastery',
  dedication:  'Fires of Dedication',
  challenge:   'Trials & Feats',
};

// ── Errors ────────────────────────────────────────────────────────────────

export class EngineError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// ── Small utilities ───────────────────────────────────────────────────────

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const round = n => Math.round(n);

export function uid(prefix = '') {
  const bytes = new Uint8Array(8);
  globalThis.crypto.getRandomValues(bytes);
  return prefix + Array.from(bytes, b => (b % 36).toString(36)).join('');
}

/** Calendar day (YYYY-MM-DD) of a timestamp in the given IANA time zone. */
export function dayKey(ts, timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toISOString().slice(0, 10);
  }
}

/** Hour of day (0–23) of a timestamp in the given time zone. */
export function hourIn(ts, timeZone) {
  try {
    const h = new Intl.DateTimeFormat('en-GB', { timeZone: timeZone || 'UTC', hour: '2-digit', hour12: false }).format(new Date(ts));
    return Number(h) % 24;
  } catch {
    return new Date(ts).getUTCHours();
  }
}

export function addDays(key, n) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function addMonths(key, n) {
  const d = new Date(`${key}T12:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromKey, toKey) {
  return Math.round((Date.parse(`${toKey}T12:00:00Z`) - Date.parse(`${fromKey}T12:00:00Z`)) / 86400000);
}

function normDate(v) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const t = Date.parse(s);
  if (Number.isNaN(t)) throw new EngineError('invalid_date', `Could not read the date "${v}". Use YYYY-MM-DD.`);
  return new Date(t).toISOString().slice(0, 10);
}

export function normalizeCategory(v, fallback = 'health') {
  if (!v) return fallback;
  const s = String(v).toLowerCase().trim();
  if (CATEGORIES[s]) return s;
  for (const [k, c] of Object.entries(CATEGORIES)) {
    if (c.label.toLowerCase() === s || c.aliases.includes(s)) return k;
  }
  throw new EngineError('invalid_category', `Unknown category "${v}". Use one of: ${Object.keys(CATEGORIES).join(', ')}.`);
}

export function normalizeDifficulty(v, fallback = 'medium') {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'number') return DIFFICULTY_ORDER[clamp(Math.round(v), 0, 5)];
  const s = String(v).toLowerCase().trim();
  if (DIFFICULTIES[s]) return s;
  throw new EngineError('invalid_difficulty', `Unknown difficulty "${v}". Use one of: ${DIFFICULTY_ORDER.join(', ')}.`);
}

function normRecurrence(v) {
  if (!v) return 'none';
  const s = String(v).toLowerCase();
  if (['none', 'daily', 'weekly', 'monthly'].includes(s)) return s;
  throw new EngineError('invalid_recurrence', `Recurrence must be none, daily, weekly or monthly.`);
}

function normTier(v) {
  const s = String(v || 'common').toLowerCase();
  if (!REWARD_TIERS[s]) throw new EngineError('invalid_tier', `Reward tier must be one of: ${TIER_ORDER.join(', ')}.`);
  return s;
}

function cleanText(v, max = 500) {
  if (v === undefined) return undefined;
  if (v === null) return '';
  return String(v).trim().slice(0, max);
}

// ── Level & derived character ─────────────────────────────────────────────

/** XP needed to advance from level n to n + 1 (the spec's n² × 50 + n × 50). */
export function xpToNext(n) {
  return n * n * 50 + n * 50;
}

export function levelInfo(totalXp) {
  let level = 1;
  let rest = Math.max(0, Math.floor(totalXp || 0));
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  const need = xpToNext(level);
  return { level, into: rest, need, pct: need ? rest / need : 0 };
}

export function talentRank(state, path) {
  return state.character.talents?.[path] || 0;
}

export function derive(state) {
  const c = state.character;
  const { level, into, need, pct } = levelInfo(c.xp);
  const masteries = {};
  const stats = {};
  for (const [k, def] of Object.entries(CATEGORIES)) {
    masteries[k] = Math.floor(cat(state, k) / 10);
    stats[def.stat] = clamp(10 + (level - 1) + masteries[k], 10, 100);
  }
  const maxHp = 100 + stats.vitality * 5 + talentRank(state, 'resilience') * 20;
  const maxMp = 50 + stats.wisdom * 3;
  const spent = Object.values(c.talents || {}).reduce((a, b) => a + b, 0);
  const talentPoints = Math.max(0, Math.floor(level / 5) - spent);
  const hp = clamp(c.hp ?? maxHp, 0, maxHp);
  const mp = clamp(c.mp ?? maxMp, 0, maxMp);
  return {
    level, xpInto: into, xpNeed: need, xpPct: pct,
    stats, masteries, maxHp, maxMp, hp, mp,
    talentPoints, wounded: hp < maxHp * 0.25,
    streak: state.stats.streak || 0,
  };
}

// ── State shape ───────────────────────────────────────────────────────────

export function createInitialState({ now = Date.now(), timeZone } = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    character: null,
    quests: [],
    history: [],
    rewards: STARTER_REWARDS.map(r => ({ id: uid('r_'), enabled: true, months: [], lastAwardedAt: null, ...r })),
    loot: [],
    achievements: {},
    ceremonies: [],
    feed: [],
    stats: {
      completed: 0, failed: 0, abandoned: 0,
      totalXp: 0, totalGold: 0,
      byCategory: {}, byDifficulty: {},
      dailyLog: {}, streak: 0, longestStreak: 0, bestDay: 0,
      perfectDays: 0, perfectQuests: 0, rewardsWon: 0,
    },
    today: { day: null, completions: [], perfectAwarded: false },
    buffs: { divination: false },
    settings: {
      timeZone: timeZone || 'UTC',
      notifications: { digest: true, digestHour: 8, streakGuard: true, streakHour: 20, agentActivity: true, ceremonies: true },
      sound: true,
      reducedMotion: false,
    },
  };
}

/**
 * Bring any saved journal (including the original v1 localStorage format)
 * up to the current shape. Safe to call on already-current states.
 */
export function migrate(raw, { now = Date.now(), timeZone } = {}) {
  if (!raw || typeof raw !== 'object') return createInitialState({ now, timeZone });
  if (raw.schemaVersion === SCHEMA_VERSION) {
    const base = createInitialState({ now, timeZone });
    return {
      ...base, ...raw,
      stats: { ...base.stats, ...raw.stats },
      today: { ...base.today, ...raw.today },
      buffs: { ...base.buffs, ...raw.buffs },
      settings: { ...base.settings, ...raw.settings, notifications: { ...base.settings.notifications, ...raw.settings?.notifications } },
    };
  }

  // v1 → v2
  const s = createInitialState({ now, timeZone });
  const oc = raw.character || {};
  if (raw.screen === 'main' && oc.name) {
    s.character = {
      name: oc.name, title: oc.title || '', class: CLASSES[oc.class] ? oc.class : 'adventurer',
      xp: oc.xp || 0, gold: oc.gold || 0, hp: oc.hp, mp: oc.mp,
      talents: Object.fromEntries((oc.talentPoints || []).filter(p => TALENTS[p]).map(p => [p, 1])),
      createdAt: now,
    };
  }
  const mapQuest = q => ({
    id: String(q.id || uid('q_')),
    title: q.title || 'Untitled quest',
    description: q.description || '',
    category: CATEGORIES[q.category] ? q.category : 'health',
    difficulty: DIFFICULTIES[q.difficulty] ? q.difficulty : 'medium',
    status: q.status === 'in_progress' ? 'in_progress' : 'available',
    dueDate: q.dueDate || null,
    recurrence: q.recurrence || 'none',
    bonusObjectives: (q.bonusObjectives || []).map(t => ({ text: String(t), done: false })),
    prerequisites: [],
    tags: [], externalId: q.notionPageId ? `notion:${q.notionPageId}` : null,
    notion: q.notionPageId ? { pageId: q.notionPageId, statusProp: q.notionStatusProp, statusType: q.notionStatusType } : null,
    source: 'human', createdAt: q.createdAt || now, startedAt: q.startedAt || null,
  });
  s.quests = (raw.quests || []).map(mapQuest);
  s.history = (raw.completedQuests || []).map(q => {
    const at = q.completedAt || q.failedAt || q.abandonedAt || now;
    return {
      id: uid('h_'), questId: String(q.id), title: q.title, description: q.description || '',
      category: CATEGORIES[q.category] ? q.category : 'health',
      difficulty: DIFFICULTIES[q.difficulty] ? q.difficulty : 'medium',
      outcome: q.status === 'failed' ? 'failed' : q.status === 'abandoned' ? 'abandoned' : 'completed',
      at, day: dayKey(at, s.settings.timeZone),
      xp: q.status === 'completed' ? DIFFICULTIES[q.difficulty]?.xp || 0 : 0, gold: 0,
      breakdown: [], source: 'human', actor: 'human',
    };
  });
  if (Array.isArray(raw.rewards)) {
    s.rewards = raw.rewards.map(r => ({
      id: String(r.id || uid('r_')), name: r.name, description: r.description || '',
      tier: REWARD_TIERS[r.tier] ? r.tier : 'common', cooldownMinutes: r.cooldown || 0,
      enabled: r.available !== false, months: [], category: 'custom', lastAwardedAt: null,
    }));
  }
  const os = raw.stats || {};
  s.stats.completed = os.questsCompleted || 0;
  s.stats.failed = os.questsFailed || 0;
  s.stats.totalXp = os.totalXpEarned || oc.xp || 0;
  s.stats.longestStreak = os.longestStreak || 0;
  s.stats.byCategory = { ...(oc.categoryQuests || {}) };
  for (const h of s.history) {
    if (h.outcome === 'completed') s.stats.byDifficulty[h.difficulty] = (s.stats.byDifficulty[h.difficulty] || 0) + 1;
  }
  for (const [k, v] of Object.entries(os.dailyLog || {})) {
    const t = Date.parse(k);
    if (!Number.isNaN(t)) s.stats.dailyLog[new Date(t + 12 * 3600e3).toISOString().slice(0, 10)] = v;
  }
  s.stats.bestDay = Math.max(0, ...Object.values(s.stats.dailyLog));
  const ach = {};
  const legacyIds = { week_streak: 'streak_7', month_streak: 'streak_30', century_streak: 'streak_100', year_streak: 'streak_365' };
  for (const id of raw.achievements || []) ach[legacyIds[id] || id] = now;
  s.achievements = ach;
  return s;
}

// ── Housekeeping (runs before every action) ───────────────────────────────

export function computeStreak(dailyLog, today) {
  let day = (dailyLog[today] || 0) > 0 ? today : addDays(today, -1);
  let n = 0;
  while ((dailyLog[day] || 0) > 0) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

function housekeeping(s, ctx) {
  const today = dayKey(ctx.now, s.settings.timeZone);
  if (s.today.day !== today) {
    const isFirstEver = s.today.day === null;
    s.today = { day: today, completions: [], perfectAwarded: false };
    if (s.character && !isFirstEver) {
      // A night's rest: recover some HP and MP.
      const d = derive(s);
      s.character.hp = clamp(d.hp + round(d.maxHp * 0.2), 0, d.maxHp);
      s.character.mp = clamp(d.mp + round(d.maxMp * 0.3), 0, d.maxMp);
    }
  }
  s.stats.streak = computeStreak(s.stats.dailyLog, today);
  return today;
}

// ── Feed, ceremonies, achievements ────────────────────────────────────────

function pushFeed(s, ctx, kind, text, extra = {}) {
  s.feed.unshift({ id: uid('f_'), at: ctx.now, actor: ctx.actor, kind, text, ...extra });
  if (s.feed.length > 200) s.feed.length = 200;
}

function pushCeremony(s, ctx, events, ceremony) {
  const c = { id: uid('c_'), at: ctx.now, actor: ctx.actor, ...ceremony };
  if (s.settings.notifications?.ceremonies !== false || c.type === 'chest') {
    s.ceremonies.push(c);
    if (s.ceremonies.length > 40) s.ceremonies.splice(0, s.ceremonies.length - 40);
  }
  events.push(c);
}

function checkAchievements(s, ctx, events) {
  for (const a of ACHIEVEMENTS) {
    if (!s.achievements[a.id] && a.test(s)) {
      s.achievements[a.id] = ctx.now;
      pushCeremony(s, ctx, events, { type: 'achievement', achievementId: a.id, name: a.name, icon: a.icon, description: a.description });
      pushFeed(s, ctx, 'achievement', `Earned the trophy “${a.name}”`, { icon: a.icon });
    }
  }
}

function grantXp(s, ctx, events, amount) {
  const before = levelInfo(s.character.xp).level;
  s.character.xp += amount;
  s.stats.totalXp += amount;
  const after = levelInfo(s.character.xp).level;
  for (let L = before + 1; L <= after; L++) {
    const d = derive(s);
    s.character.hp = d.maxHp; // levelling fully restores you
    s.character.mp = d.maxMp;
    pushCeremony(s, ctx, events, {
      type: 'level_up', level: L,
      flavour: FLAVOUR_LEVEL[Math.floor(ctx.rng() * FLAVOUR_LEVEL.length)],
      talentPoint: L % 5 === 0,
    });
    pushFeed(s, ctx, 'level_up', `Reached level ${L}${L % 5 === 0 ? ' and earned a talent point' : ''}`, { icon: '✨' });
  }
}

// ── Rewards ───────────────────────────────────────────────────────────────

export function rewardChance(s, difficulty) {
  if (difficulty === 'legendary') return 1;
  const d = derive(s);
  const chance = 0.7
    + DIFFICULTIES[difficulty].rewardMod
    + Math.min(0.10, (s.stats.streak || 0) * 0.01)
    + Math.max(0, (d.stats.fortune - 10) * 0.005)
    + talentRank(s, 'fortune') * 0.03;
  return clamp(chance, 0, 1);
}

function rollTier(rng, minTier = 'common') {
  const pool = TIER_ORDER.slice(TIER_ORDER.indexOf(minTier));
  const total = pool.reduce((a, t) => a + REWARD_TIERS[t].weight, 0);
  let r = rng() * total;
  for (const t of pool) {
    r -= REWARD_TIERS[t].weight;
    if (r < 0) return t;
  }
  return pool[pool.length - 1];
}

function rewardAvailable(r, ctx, s) {
  if (r.enabled === false) return false;
  if (r.months?.length) {
    const m = Number(dayKey(ctx.now, s.settings.timeZone).slice(5, 7));
    if (!r.months.includes(m)) return false;
  }
  if (r.cooldownMinutes && r.lastAwardedAt && ctx.now - r.lastAwardedAt < r.cooldownMinutes * 60000) return false;
  return true;
}

function pickReward(s, ctx, tier) {
  const i = TIER_ORDER.indexOf(tier);
  const order = [i, ...TIER_ORDER.map((_, j) => j).filter(j => j < i).reverse(), ...TIER_ORDER.map((_, j) => j).filter(j => j > i)];
  for (const j of order) {
    const pool = s.rewards.filter(r => r.tier === TIER_ORDER[j] && rewardAvailable(r, ctx, s));
    if (pool.length) return pool[Math.floor(ctx.rng() * pool.length)];
  }
  return null;
}

/** Roll a chest; returns the loot entry (also queued as a ceremony). */
function openChest(s, ctx, events, { source, forceTier = null, guaranteed = false, label }) {
  let tier = null;
  let won = guaranteed;
  if (!won) won = ctx.rng() < rewardChance(s, source.difficulty);
  if (s.buffs.divination) {
    won = true;
  }
  if (won) {
    tier = forceTier ? rollTier(ctx.rng, forceTier) : rollTier(ctx.rng);
    if (s.buffs.divination) {
      tier = TIER_ORDER[Math.min(TIER_ORDER.length - 1, TIER_ORDER.indexOf(tier) + 1)];
      s.buffs.divination = false;
    }
  }

  const loot = { id: uid('l_'), at: ctx.now, actor: ctx.actor, questTitle: source.title, label: label || null };
  if (!won) {
    const copper = 2 + Math.floor(ctx.rng() * 7);
    s.character.gold += copper;
    Object.assign(loot, { outcome: 'nothing', copper, flavour: FLAVOUR_NOTHING[Math.floor(ctx.rng() * FLAVOUR_NOTHING.length)], redeemedAt: ctx.now });
  } else {
    const reward = pickReward(s, ctx, tier);
    s.stats.rewardsWon++;
    if (reward) {
      reward.lastAwardedAt = ctx.now;
      Object.assign(loot, { outcome: 'reward', tier, rewardId: reward.id, name: reward.name, description: reward.description || '', redeemedAt: null });
    } else {
      const gold = REWARD_TIERS[tier].gold;
      s.character.gold += gold;
      Object.assign(loot, { outcome: 'gold', tier, name: `${REWARD_TIERS[tier].label} coin pouch`, description: `${gold} gold pieces — add rewards of this tier to win real treats instead.`, gold, redeemedAt: ctx.now });
    }
    s.loot.unshift(loot);
    if (s.loot.length > 300) s.loot.length = 300;
    pushFeed(s, ctx, 'reward', `Won ${loot.tier} loot: ${loot.name}`, { icon: '🎁' });
  }
  pushCeremony(s, ctx, events, { type: 'chest', loot });
  return loot;
}

// ── Quests ────────────────────────────────────────────────────────────────

function findQuest(s, id) {
  const q = s.quests.find(x => x.id === id || (x.externalId && x.externalId === id));
  if (!q) throw new EngineError('quest_not_found', `No active quest with id "${id}".`);
  return q;
}

export function isLocked(s, q) {
  return (q.prerequisites || []).some(pid => s.quests.some(x => x.id === pid));
}

export function questDue(q, today) {
  if (!q.dueDate) return null;
  const days = daysBetween(today, q.dueDate);
  return { days, overdue: days < 0, today: days === 0 };
}

function buildQuest(p, ctx) {
  const title = cleanText(p.title, 160);
  if (!title) throw new EngineError('missing_title', 'A quest needs a title.');
  return {
    id: uid('q_'),
    title,
    description: cleanText(p.description, 2000) || '',
    category: normalizeCategory(p.category),
    difficulty: normalizeDifficulty(p.difficulty),
    status: 'available',
    dueDate: normDate(p.dueDate ?? p.due ?? null) ?? null,
    recurrence: normRecurrence(p.recurrence),
    bonusObjectives: (p.bonusObjectives || []).map(b => typeof b === 'string' ? { text: cleanText(b, 200), done: false } : { text: cleanText(b.text, 200), done: !!b.done }).filter(b => b.text),
    prerequisites: Array.isArray(p.prerequisites) ? p.prerequisites.map(String) : [],
    tags: Array.isArray(p.tags) ? p.tags.map(t => cleanText(t, 40)).filter(Boolean).slice(0, 10) : [],
    externalId: p.externalId ? String(p.externalId).slice(0, 200) : null,
    notion: p.notion || null,
    seriesId: p.seriesId || null,
    source: p.source || ctx.actor,
    createdAt: ctx.now,
    startedAt: null,
  };
}

function patchQuest(q, p) {
  if (p.title !== undefined) {
    const t = cleanText(p.title, 160);
    if (!t) throw new EngineError('missing_title', 'A quest needs a title.');
    q.title = t;
  }
  if (p.description !== undefined) q.description = cleanText(p.description, 2000);
  if (p.category !== undefined) q.category = normalizeCategory(p.category);
  if (p.difficulty !== undefined) q.difficulty = normalizeDifficulty(p.difficulty);
  if (p.dueDate !== undefined || p.due !== undefined) q.dueDate = normDate(p.dueDate ?? p.due);
  if (p.recurrence !== undefined) q.recurrence = normRecurrence(p.recurrence);
  if (p.bonusObjectives !== undefined) {
    q.bonusObjectives = p.bonusObjectives.map(b => typeof b === 'string' ? { text: cleanText(b, 200), done: false } : { text: cleanText(b.text, 200), done: !!b.done }).filter(b => b.text);
  }
  if (p.prerequisites !== undefined) q.prerequisites = (p.prerequisites || []).map(String).filter(id => id !== q.id);
  if (p.tags !== undefined) q.tags = (p.tags || []).map(t => cleanText(t, 40)).filter(Boolean).slice(0, 10);
  if (p.status === 'in_progress' || p.status === 'available') q.status = p.status;
}

function nextDue(q, today) {
  const base = q.dueDate && q.dueDate > today ? q.dueDate : today;
  if (q.recurrence === 'daily') return addDays(base, 1);
  if (q.recurrence === 'weekly') return addDays(base, 7);
  if (q.recurrence === 'monthly') return addMonths(base, 1);
  return null;
}

/**
 * The heart of the game: work out XP, gold, bonuses and rewards for a
 * completed quest, write history and fire ceremonies.
 */
function completeQuest(s, ctx, events, q, { bonusDone, at, note, fromLog = false }) {
  const when = at ?? ctx.now;
  const day = dayKey(when, s.settings.timeZone);
  const isToday = day === s.today.day;
  const diff = DIFFICULTIES[q.difficulty];
  const d0 = derive(s);
  const breakdown = [];

  // Bonus objectives
  if (bonusDone === 'all') q.bonusObjectives.forEach(b => { b.done = true; });
  else if (Array.isArray(bonusDone)) bonusDone.forEach(i => { if (q.bonusObjectives[i]) q.bonusObjectives[i].done = true; });
  const bonusCount = q.bonusObjectives.filter(b => b.done).length;
  const bonusTotal = q.bonusObjectives.length;

  let xp = diff.xp;
  breakdown.push({ label: `${diff.label} quest`, amount: diff.xp });
  if (bonusCount) {
    const b = round(diff.xp * 0.25 * bonusCount);
    xp += b;
    breakdown.push({ label: `${bonusCount} bonus objective${bonusCount > 1 ? 's' : ''}`, amount: b });
  }

  let mult = 1;
  const mults = [];
  const cls = CLASSES[s.character.class] || CLASSES.adventurer;
  const classBonus = (cls.bonus.all || 0) + (cls.bonus[q.category] || 0);
  if (classBonus) mults.push({ label: `${cls.label} class`, pct: classBonus });
  if (q.recurrence !== 'none' && talentRank(s, 'discipline')) mults.push({ label: 'Path of Discipline', pct: 0.05 * talentRank(s, 'discipline') });
  if (DIFFICULTY_ORDER.indexOf(q.difficulty) >= 3 && talentRank(s, 'ambition')) mults.push({ label: 'Path of Ambition', pct: 0.10 * talentRank(s, 'ambition') });

  // Streak after counting this deed.
  s.stats.dailyLog[day] = (s.stats.dailyLog[day] || 0) + 1;
  const streak = computeStreak(s.stats.dailyLog, s.today.day || day);
  s.stats.streak = streak;
  s.stats.longestStreak = Math.max(s.stats.longestStreak, streak);
  const firstOfDay = s.stats.dailyLog[day] === 1;
  if (streak > 1) mults.push({ label: `🔥 ${streak}-day streak`, pct: Math.min(1, (streak - 1) * 0.1) });

  const todays = isToday ? s.today.completions : [];
  const sameCatToday = todays.filter(c => c.category === q.category).length + 1;
  if (isToday && sameCatToday >= 3) mults.push({ label: `${CATEGORIES[q.category].label} combo ×${sameCatToday}`, pct: 0.25 });
  if (d0.wounded) mults.push({ label: 'Wounded (low HP)', pct: -0.25 });

  for (const m of mults) mult += m.pct;
  const multiplied = round(xp * Math.max(0.25, mult)) - xp;
  if (multiplied) breakdown.push({ label: mults.map(m => `${m.label} ${m.pct > 0 ? '+' : ''}${round(m.pct * 100)}%`).join(' · '), amount: multiplied });
  xp += multiplied;

  if (firstOfDay) { xp += 25; breakdown.push({ label: 'First deed of the day', amount: 25 }); }

  if (isToday) {
    const last2 = todays.slice(-2).map(c => c.difficulty);
    if (q.difficulty === 'hard' && last2[0] === 'easy' && last2[1] === 'medium') {
      xp += 50;
      breakdown.push({ label: 'Difficulty run: Easy → Medium → Hard', amount: 50 });
    }
  }

  s.stats.byCategory[q.category] = (s.stats.byCategory[q.category] || 0) + 1;
  s.stats.byDifficulty[q.difficulty] = (s.stats.byDifficulty[q.difficulty] || 0) + 1;
  const catCount = s.stats.byCategory[q.category];
  let mastery = false;
  if (catCount % 10 === 0) {
    xp += 50;
    mastery = true;
    breakdown.push({ label: `${CATEGORIES[q.category].label} mastery rank ${catCount / 10}`, amount: 50 });
  }

  const goldMult = (1 + (d0.stats.fortune - 10) * 0.02) * (1 + 0.15 * talentRank(s, 'fortune'));
  const gold = Math.max(1, round(xp * 0.4 * goldMult));

  s.stats.completed++;
  s.stats.bestDay = Math.max(s.stats.bestDay, s.stats.dailyLog[day]);
  if (bonusTotal >= 2 && bonusCount === bonusTotal) s.stats.perfectQuests++;
  if (isToday) s.today.completions.push({ category: q.category, difficulty: q.difficulty, questId: q.id });

  s.character.gold += gold;
  s.stats.totalGold += gold;
  const dRest = derive(s);
  s.character.hp = clamp(dRest.hp + round(dRest.maxHp * 0.03), 0, dRest.maxHp);
  s.character.mp = clamp(dRest.mp + (q.category === 'intelligence' ? 10 : 5), 0, dRest.maxMp);

  // Remove from board, respawn recurring.
  let spawnedId = null;
  if (!fromLog) {
    s.quests = s.quests.filter(x => x.id !== q.id);
    if (q.recurrence !== 'none') {
      const next = {
        ...q, id: uid('q_'), status: 'available', startedAt: null, createdAt: ctx.now,
        dueDate: nextDue(q, s.today.day || day), seriesId: q.seriesId || q.id,
        bonusObjectives: q.bonusObjectives.map(b => ({ ...b, done: false })),
      };
      // Keep externalId on the new instance so agents can keep finding it.
      s.quests.push(next);
      spawnedId = next.id;
    }
  }

  const entry = {
    id: uid('h_'), questId: fromLog ? null : q.id, seriesId: q.seriesId || null, spawnedId,
    title: q.title, description: q.description, category: q.category, difficulty: q.difficulty,
    outcome: 'completed', at: when, day, xp, gold, breakdown,
    bonuses: { done: bonusCount, total: bonusTotal },
    note: cleanText(note, 1000) || '', source: q.source, actor: ctx.actor,
    externalId: q.externalId || null, notion: q.notion || null, lootIds: [],
    // Snapshot so the deed can be undone faithfully.
    restore: fromLog ? null : { ...q, bonusObjectives: q.bonusObjectives.map(b => ({ ...b })) },
  };
  s.history.unshift(entry);
  if (s.history.length > 1000) s.history.length = 1000;

  grantXp(s, ctx, events, xp);
  if (mastery) {
    pushCeremony(s, ctx, events, { type: 'mastery', category: q.category, rank: catCount / 10 });
  }
  pushFeed(s, ctx, 'completed', `Completed “${q.title}”`, { icon: '✓', xp, gold, historyId: entry.id });
  events.push({ type: 'quest_completed', historyId: entry.id, questId: q.id, title: q.title, xp, gold, breakdown, spawnedId });

  // Rewards: the chest roll, then the Perfect Day bonus chest.
  const loot = openChest(s, ctx, events, { source: q });
  if (loot.outcome !== 'nothing') entry.lootIds.push(loot.id);

  if (isToday && !s.today.perfectAwarded) {
    const dueTodayLeft = s.quests.filter(x => x.dueDate && x.dueDate <= s.today.day && x.id !== spawnedId);
    const clearedToday = s.today.completions.some(c => {
      const h = s.history.find(hh => hh.questId === c.questId);
      return h?.restore?.dueDate && h.restore.dueDate <= s.today.day;
    });
    if (dueTodayLeft.length === 0 && clearedToday) {
      s.today.perfectAwarded = true;
      s.stats.perfectDays++;
      const bonus = openChest(s, ctx, events, { source: q, guaranteed: true, forceTier: 'rare', label: 'Perfect Day' });
      entry.lootIds.push(bonus.id);
      pushFeed(s, ctx, 'perfect_day', 'Perfect Day — every quest due today is done', { icon: '🌅' });
    }
  }

  checkAchievements(s, ctx, events);
  return entry;
}

function failQuest(s, ctx, events, q, outcome, note) {
  const diff = DIFFICULTIES[q.difficulty];
  const factor = outcome === 'abandoned' ? 0.5 : 1;
  const damage = round(diff.hpLoss * factor * (1 - 0.25 * talentRank(s, 'resilience')));
  const d = derive(s);
  s.character.hp = clamp(d.hp - damage, 0, d.maxHp);
  s.stats[outcome === 'failed' ? 'failed' : 'abandoned']++;
  s.quests = s.quests.filter(x => x.id !== q.id);
  let spawnedId = null;
  if (q.recurrence !== 'none' && outcome === 'failed') {
    const next = { ...q, id: uid('q_'), status: 'available', startedAt: null, createdAt: ctx.now, dueDate: nextDue(q, s.today.day), seriesId: q.seriesId || q.id, bonusObjectives: q.bonusObjectives.map(b => ({ ...b, done: false })) };
    s.quests.push(next);
    spawnedId = next.id;
  }
  const at = ctx.now;
  const entry = {
    id: uid('h_'), questId: q.id, seriesId: q.seriesId || null, spawnedId,
    title: q.title, description: q.description, category: q.category, difficulty: q.difficulty,
    outcome, at, day: dayKey(at, s.settings.timeZone), xp: 0, gold: 0, damage, breakdown: [],
    note: cleanText(note, 1000) || '', source: q.source, actor: ctx.actor, externalId: q.externalId || null,
    restore: { ...q }, lootIds: [],
  };
  s.history.unshift(entry);
  pushFeed(s, ctx, outcome, `${outcome === 'failed' ? 'Failed' : 'Abandoned'} “${q.title}” (−${damage} HP)`, { icon: outcome === 'failed' ? '✗' : '↩' });
  events.push({ type: `quest_${outcome}`, historyId: entry.id, title: q.title, damage });
  return entry;
}

function undoHistory(s, ctx, events, historyId) {
  const idx = s.history.findIndex(h => h.id === historyId);
  if (idx < 0) throw new EngineError('history_not_found', `No chronicle entry "${historyId}".`);
  const h = s.history[idx];
  if (h.outcome === 'completed') {
    s.character.xp = Math.max(0, s.character.xp - h.xp);
    s.stats.totalXp = Math.max(0, s.stats.totalXp - h.xp);
    s.character.gold = Math.max(0, s.character.gold - h.gold);
    s.stats.totalGold = Math.max(0, s.stats.totalGold - h.gold);
    s.stats.completed = Math.max(0, s.stats.completed - 1);
    s.stats.byCategory[h.category] = Math.max(0, (s.stats.byCategory[h.category] || 0) - 1);
    s.stats.byDifficulty[h.difficulty] = Math.max(0, (s.stats.byDifficulty[h.difficulty] || 0) - 1);
    if (s.stats.dailyLog[h.day]) {
      s.stats.dailyLog[h.day]--;
      if (!s.stats.dailyLog[h.day]) delete s.stats.dailyLog[h.day];
    }
    if (h.day === s.today.day) {
      const i = s.today.completions.findIndex(c => c.questId === h.questId);
      if (i >= 0) s.today.completions.splice(i, 1);
    }
    // Take back any loot the user has not redeemed yet.
    const lootIds = new Set(h.lootIds || []);
    s.loot = s.loot.filter(l => !(lootIds.has(l.id) && !l.redeemedAt));
    s.ceremonies = s.ceremonies.filter(c => !(c.type === 'chest' && lootIds.has(c.loot?.id)));
  } else {
    s.stats[h.outcome] = Math.max(0, (s.stats[h.outcome] || 0) - 1);
    if (h.damage) {
      const d = derive(s);
      s.character.hp = clamp(d.hp + h.damage, 0, d.maxHp);
    }
  }
  if (h.spawnedId) s.quests = s.quests.filter(q => q.id !== h.spawnedId);
  if (h.restore) {
    const q = { ...h.restore, bonusObjectives: (h.restore.bonusObjectives || []).map(b => ({ ...b })) };
    if (!s.quests.some(x => x.id === q.id)) s.quests.push(q);
  }
  s.history.splice(idx, 1);
  s.stats.streak = computeStreak(s.stats.dailyLog, s.today.day);
  pushFeed(s, ctx, 'undo', `Struck “${h.title}” from the chronicle`, { icon: '↶' });
  events.push({ type: 'undone', historyId, title: h.title });
}

// ── Public entry point ────────────────────────────────────────────────────

/**
 * Apply one action. Returns { state, events, result }.
 * ctx: { now?: number, rng?: () => number, actor?: 'human' | 'agent' | 'system' }
 */
export function applyAction(prev, action, ctx = {}) {
  const c = { now: ctx.now ?? Date.now(), rng: ctx.rng ?? Math.random, actor: ctx.actor ?? 'human' };
  const s = structuredClone(migrate(prev, { now: c.now }));
  const events = [];
  const p = action?.payload || {};
  housekeeping(s, c);

  const needHero = () => {
    if (!s.character) throw new EngineError('no_character', 'Create a character first.');
  };
  let result = null;

  switch (action?.type) {
    case 'NOOP':
    case 'TICK':
      break;

    case 'CREATE_CHARACTER': {
      const name = cleanText(p.name, 60);
      if (!name) throw new EngineError('missing_name', 'Your hero needs a name.');
      s.character = {
        name, title: cleanText(p.title, 80) || '',
        class: CLASSES[p.class] ? p.class : 'adventurer',
        xp: s.character?.xp || 0, gold: s.character?.gold || 0,
        hp: undefined, mp: undefined, talents: s.character?.talents || {}, createdAt: c.now,
      };
      const d = derive(s);
      s.character.hp = d.maxHp;
      s.character.mp = d.maxMp;
      if (p.timeZone) s.settings.timeZone = p.timeZone;
      pushFeed(s, c, 'character', `${name} signed the guild ledger`, { icon: '🪶' });
      break;
    }

    case 'UPDATE_CHARACTER': {
      needHero();
      if (p.name !== undefined) s.character.name = cleanText(p.name, 60) || s.character.name;
      if (p.title !== undefined) s.character.title = cleanText(p.title, 80);
      if (p.class !== undefined && CLASSES[p.class]) s.character.class = p.class;
      break;
    }

    case 'ADD_QUEST': {
      needHero();
      if (p.externalId) {
        const existing = s.quests.find(q => q.externalId === String(p.externalId));
        if (existing) {
          patchQuest(existing, p);
          result = { quest: existing, upserted: 'updated' };
          events.push({ type: 'quest_updated', questId: existing.id, title: existing.title });
          break;
        }
      }
      const q = buildQuest(p, c);
      s.quests.unshift(q);
      result = { quest: q, upserted: 'created' };
      pushFeed(s, c, 'quest_added', `Posted the quest “${q.title}”`, { icon: '📜', questId: q.id });
      events.push({ type: 'quest_added', questId: q.id, title: q.title });
      break;
    }

    case 'UPDATE_QUEST': {
      const q = findQuest(s, p.id);
      patchQuest(q, p);
      result = { quest: q };
      events.push({ type: 'quest_updated', questId: q.id, title: q.title });
      break;
    }

    case 'DELETE_QUEST': {
      const q = findQuest(s, p.id);
      s.quests = s.quests.filter(x => x.id !== q.id);
      s.quests.forEach(x => { x.prerequisites = (x.prerequisites || []).filter(id => id !== q.id); });
      events.push({ type: 'quest_deleted', questId: q.id, title: q.title });
      break;
    }

    case 'START_QUEST': {
      const q = findQuest(s, p.id);
      if (isLocked(s, q)) throw new EngineError('quest_locked', `“${q.title}” is locked until its prerequisite quests are done.`);
      q.status = 'in_progress';
      q.startedAt = c.now;
      break;
    }

    case 'TOGGLE_BONUS': {
      const q = findQuest(s, p.id);
      const b = q.bonusObjectives[p.index];
      if (!b) throw new EngineError('bonus_not_found', 'No such bonus objective.');
      b.done = p.done ?? !b.done;
      break;
    }

    case 'COMPLETE_QUEST': {
      needHero();
      const q = findQuest(s, p.id);
      if (isLocked(s, q)) throw new EngineError('quest_locked', `“${q.title}” is locked until its prerequisite quests are done.`);
      const at = p.at ? clamp(Date.parse(p.at) || Number(p.at), c.now - 7 * 86400e3, c.now) : undefined;
      result = completeQuest(s, c, events, q, { bonusDone: p.bonusDone, at, note: p.note });
      break;
    }

    case 'LOG_DEED': {
      needHero();
      if (p.externalId && s.history.some(h => h.externalId === String(p.externalId) && h.outcome === 'completed')) {
        result = { duplicate: true };
        events.push({ type: 'duplicate', externalId: p.externalId });
        break;
      }
      const q = buildQuest(p, c);
      const at = p.at ? clamp(Date.parse(p.at) || Number(p.at), c.now - 7 * 86400e3, c.now) : undefined;
      result = completeQuest(s, c, events, q, { bonusDone: 'all', at, note: p.note, fromLog: true });
      break;
    }

    case 'FAIL_QUEST':
    case 'ABANDON_QUEST': {
      needHero();
      const q = findQuest(s, p.id);
      result = failQuest(s, c, events, q, action.type === 'FAIL_QUEST' ? 'failed' : 'abandoned', p.note);
      break;
    }

    case 'UNDO_HISTORY': {
      needHero();
      undoHistory(s, c, events, p.id);
      break;
    }

    case 'ADD_REWARD': {
      const name = cleanText(p.name, 120);
      if (!name) throw new EngineError('missing_name', 'A reward needs a name.');
      const r = {
        id: uid('r_'), name, description: cleanText(p.description, 400) || '', tier: normTier(p.tier),
        category: cleanText(p.category, 40) || 'custom', cooldownMinutes: Math.max(0, Number(p.cooldownMinutes) || 0),
        months: Array.isArray(p.months) ? p.months.map(Number).filter(m => m >= 1 && m <= 12) : [],
        enabled: p.enabled !== false, lastAwardedAt: null,
      };
      s.rewards.push(r);
      result = { reward: r };
      break;
    }

    case 'UPDATE_REWARD': {
      const r = s.rewards.find(x => x.id === p.id);
      if (!r) throw new EngineError('reward_not_found', `No reward "${p.id}".`);
      if (p.name !== undefined) r.name = cleanText(p.name, 120) || r.name;
      if (p.description !== undefined) r.description = cleanText(p.description, 400);
      if (p.tier !== undefined) r.tier = normTier(p.tier);
      if (p.category !== undefined) r.category = cleanText(p.category, 40);
      if (p.cooldownMinutes !== undefined) r.cooldownMinutes = Math.max(0, Number(p.cooldownMinutes) || 0);
      if (p.months !== undefined) r.months = (p.months || []).map(Number).filter(m => m >= 1 && m <= 12);
      if (p.enabled !== undefined) r.enabled = !!p.enabled;
      result = { reward: r };
      break;
    }

    case 'DELETE_REWARD':
      s.rewards = s.rewards.filter(x => x.id !== p.id);
      break;

    case 'REDEEM_LOOT': {
      const l = s.loot.find(x => x.id === p.id);
      if (!l) throw new EngineError('loot_not_found', `No loot "${p.id}".`);
      l.redeemedAt = p.undo ? null : c.now;
      if (!p.undo) pushFeed(s, c, 'redeemed', `Enjoyed the reward “${l.name}”`, { icon: '🍷' });
      break;
    }

    case 'ACK_CEREMONY':
      s.ceremonies = p.all ? [] : s.ceremonies.filter(x => x.id !== p.id);
      break;

    case 'LEARN_TALENT': {
      needHero();
      const t = TALENTS[p.path];
      if (!t) throw new EngineError('invalid_talent', `Unknown talent path "${p.path}".`);
      if (derive(s).talentPoints < 1) throw new EngineError('no_talent_points', 'No talent points to spend — one is earned every 5 levels.');
      const rank = talentRank(s, p.path);
      if (rank >= t.maxRank) throw new EngineError('talent_maxed', `${t.label} is already mastered.`);
      s.character.talents = { ...s.character.talents, [p.path]: rank + 1 };
      pushFeed(s, c, 'talent', `Walked further down the ${t.label} (rank ${rank + 1})`, { icon: t.icon });
      break;
    }

    case 'USE_ABILITY': {
      needHero();
      const ab = ABILITIES[p.ability];
      if (!ab) throw new EngineError('invalid_ability', `Unknown ability "${p.ability}".`);
      const d = derive(s);
      const cost = round(ab.mp * (1 - 0.1 * talentRank(s, 'wisdom')));
      if (d.mp < cost) throw new EngineError('not_enough_mp', `${ab.label} needs ${cost} MP; you have ${d.mp}.`);
      if (p.ability === 'second_wind') {
        s.character.hp = clamp(d.hp + round(d.maxHp * 0.35), 0, d.maxHp);
      } else if (p.ability === 'divination') {
        if (s.buffs.divination) throw new EngineError('already_active', 'Divination is already guiding your next quest.');
        s.buffs.divination = true;
      } else if (p.ability === 'time_warp') {
        const q = findQuest(s, p.questId);
        if (!q.dueDate) throw new EngineError('no_due_date', 'That quest has no due date to push back.');
        q.dueDate = addDays(q.dueDate, 1);
      }
      s.character.mp = d.mp - cost;
      pushFeed(s, c, 'ability', `Cast ${ab.label} (−${cost} MP)`, { icon: ab.icon });
      events.push({ type: 'ability', ability: p.ability, cost });
      break;
    }

    case 'UPDATE_SETTINGS': {
      const { notifications, ...rest } = p;
      s.settings = { ...s.settings, ...rest, notifications: { ...s.settings.notifications, ...(notifications || {}) } };
      break;
    }

    case 'REPLACE_STATE': {
      // Used by backup import. Keeps the result well-formed.
      return { state: { ...migrate(p.state, { now: c.now }), updatedAt: c.now }, events: [{ type: 'replaced' }], result: null };
    }

    default:
      throw new EngineError('unknown_action', `Unknown action "${action?.type}".`);
  }

  s.updatedAt = c.now;
  return { state: s, events, result };
}

// ── Read helpers (UI, agent API, notifications) ───────────────────────────

export function summarize(state, { now = Date.now() } = {}) {
  const s = migrate(state, { now });
  const today = dayKey(now, s.settings.timeZone);
  const streak = computeStreak(s.stats.dailyLog, today);
  if (!s.character) return { hasCharacter: false, today };
  const d = derive({ ...s, stats: { ...s.stats, streak } });
  const active = s.quests.map(q => ({
    id: q.id, title: q.title, category: q.category, difficulty: q.difficulty, status: q.status,
    dueDate: q.dueDate, recurrence: q.recurrence, externalId: q.externalId, locked: isLocked(s, q),
    bonusObjectives: q.bonusObjectives, tags: q.tags,
  }));
  return {
    hasCharacter: true,
    today,
    hero: {
      name: s.character.name, title: s.character.title, class: s.character.class,
      level: d.level, xp: s.character.xp, xpIntoLevel: d.xpInto, xpForNextLevel: d.xpNeed,
      hp: d.hp, maxHp: d.maxHp, mp: d.mp, maxMp: d.maxMp, gold: s.character.gold,
      stats: d.stats, talentPoints: d.talentPoints, talents: s.character.talents, wounded: d.wounded,
    },
    streak: { current: streak, longest: s.stats.longestStreak, doneToday: (s.stats.dailyLog[today] || 0) > 0, deedsToday: s.stats.dailyLog[today] || 0 },
    quests: {
      active,
      dueToday: active.filter(q => q.dueDate === today).map(q => q.id),
      overdue: active.filter(q => q.dueDate && q.dueDate < today).map(q => q.id),
    },
    unredeemedRewards: s.loot.filter(l => !l.redeemedAt).map(l => ({ id: l.id, name: l.name, tier: l.tier, at: l.at })),
    recent: s.history.slice(0, 10).map(h => ({ id: h.id, title: h.title, outcome: h.outcome, at: h.at, xp: h.xp, actor: h.actor })),
    totals: { completed: s.stats.completed, failed: s.stats.failed, abandoned: s.stats.abandoned, totalXp: s.stats.totalXp },
    achievements: Object.keys(s.achievements),
  };
}
