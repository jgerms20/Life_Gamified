import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// ── Constants ────────────────────────────────────────────────
export const CATEGORIES = {
  health:        { label: 'Health',        icon: '❤️',  color: '#8b1a1a', glow: '#ff4444', stat: 'vitality' },
  intelligence:  { label: 'Intelligence',  icon: '📚',  color: '#1a3a8b', glow: '#4488ff', stat: 'wisdom' },
  money:         { label: 'Money',         icon: '💰',  color: '#1a5c1a', glow: '#44ff44', stat: 'fortune' },
  relationships: { label: 'Relationships', icon: '💞',  color: '#5c1a5c', glow: '#ff44ff', stat: 'charisma' },
};

export const DIFFICULTIES = {
  trivial:   { label: 'Trivial',   stars: 0.5, xp: 10,  color: '#888',    symbol: '½★' },
  easy:      { label: 'Easy',      stars: 1,   xp: 25,  color: '#a0c050', symbol: '★' },
  medium:    { label: 'Medium',    stars: 2,   xp: 50,  color: '#d4af37', symbol: '★★' },
  hard:      { label: 'Hard',      stars: 3,   xp: 100, color: '#d07030', symbol: '★★★' },
  epic:      { label: 'Epic',      stars: 4,   xp: 200, color: '#9030d0', symbol: '★★★★' },
  legendary: { label: 'Legendary', stars: 5,   xp: 500, color: '#ff5500', symbol: '★★★★★' },
};

export const CLASSES = {
  warrior:    { label: 'Warrior',    icon: '⚔️',  bonus: { health: 0.2 }, description: '+20% Health XP' },
  scholar:    { label: 'Scholar',    icon: '📖',  bonus: { intelligence: 0.2 }, description: '+20% Intelligence XP' },
  merchant:   { label: 'Merchant',   icon: '🪙',  bonus: { money: 0.2 }, description: '+20% Money XP' },
  diplomat:   { label: 'Diplomat',   icon: '🤝',  bonus: { relationships: 0.2 }, description: '+20% Relationships XP' },
  adventurer: { label: 'Adventurer', icon: '🗺️',  bonus: { all: 0.05 }, description: '+5% All XP' },
};

export const REWARD_TIERS = {
  common:    { label: 'Common',    color: '#a0a0a0', glow: '#c0c0c0', chance: 0.50, icon: '🪙' },
  uncommon:  { label: 'Uncommon',  color: '#44aa44', glow: '#66cc66', chance: 0.30, icon: '💚' },
  rare:      { label: 'Rare',      color: '#4488ff', glow: '#66aaff', chance: 0.15, icon: '💎' },
  epic:      { label: 'Epic',      color: '#aa44ff', glow: '#cc66ff', chance: 0.04, icon: '💜' },
  legendary: { label: 'Legendary', color: '#ff9900', glow: '#ffcc00', chance: 0.01, icon: '👑' },
};

export const TALENT_PATHS = {
  discipline: { label: 'Path of Discipline', icon: '📿', description: '+5% recurring quest XP', effect: 'recurring_xp', value: 0.05 },
  ambition:   { label: 'Path of Ambition',   icon: '🗡️', description: '+10% Hard+ quest XP',    effect: 'hard_xp',     value: 0.10 },
  fortune:    { label: 'Path of Fortune',    icon: '🎲', description: '+15% gold, better rewards', effect: 'gold',      value: 0.15 },
  wisdom:     { label: 'Path of Wisdom',     icon: '🔮', description: '-10% MP costs',            effect: 'mp_cost',   value: -0.10 },
  resilience: { label: 'Path of Resilience', icon: '🛡️', description: '+20 max HP, -failure penalty', effect: 'hp', value: 20 },
};

const STARTER_REWARDS = [
  { id: 'r1', name: 'Short Break', tier: 'common',   description: 'Take a 15-minute rest', cooldown: 0, available: true },
  { id: 'r2', name: 'Favourite Snack', tier: 'common', description: 'Enjoy a tasty treat', cooldown: 0, available: true },
  { id: 'r3', name: 'Episode of a Show', tier: 'uncommon', description: 'Watch one episode guilt-free', cooldown: 60, available: true },
  { id: 'r4', name: 'Gaming Session', tier: 'uncommon', description: '1 hour of gaming', cooldown: 120, available: true },
  { id: 'r5', name: 'Nice Meal Out', tier: 'rare', description: 'Dine somewhere special', cooldown: 1440, available: true },
  { id: 'r6', name: 'Movie Night', tier: 'rare', description: 'Watch a film of your choice', cooldown: 480, available: true },
  { id: 'r7', name: 'New Book/Game', tier: 'epic', description: 'Purchase something you\'ve been eyeing', cooldown: 4320, available: true },
  { id: 'r8', name: 'Weekend Adventure', tier: 'legendary', description: 'Plan a special getaway or experience', cooldown: 10080, available: true },
];

// ── XP / Level math ────────────────────────────────────────
export function xpForLevel(n) {
  return n * n * 50 + n * 50;
}
export function levelFromXp(xp) {
  let level = 0;
  while (xp >= xpForLevel(level + 1)) {
    xp -= xpForLevel(level + 1);
    level++;
  }
  return level;
}
export function xpIntoCurrentLevel(xp) {
  let l = 0;
  while (xp >= xpForLevel(l + 1)) { xp -= xpForLevel(l + 1); l++; }
  return xp;
}

// ── Derived stats ────────────────────────────────────────────
function deriveStats(character) {
  const { vitality = 10, wisdom = 10, fortune = 10, charisma = 10, xp = 0, talentPoints = [], hp } = character;
  const level = levelFromXp(xp);
  const maxHp = 100 + vitality * 5 + (talentPoints.includes('resilience') ? 20 : 0);
  const maxMp = 50 + wisdom * 3;
  return {
    level,
    maxHp,
    hp: hp !== undefined ? Math.min(hp, maxHp) : maxHp,
    maxMp,
    gold: character.gold || 0,
  };
}

// ── Initial State ────────────────────────────────────────────
function initialState() {
  const saved = localStorage.getItem('life_gamified_v1');
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  return {
    screen: 'creation', // 'creation' | 'main'
    tab: 'quests',
    character: {
      name: '',
      title: '',
      class: 'adventurer',
      xp: 0,
      hp: 150,
      mp: 80,
      gold: 0,
      vitality: 10,
      wisdom: 10,
      fortune: 10,
      charisma: 10,
      talentPoints: [],
      spentTalentPoints: 0,
      streak: 0,
      lastActiveDate: null,
      categoryQuests: { health: 0, intelligence: 0, money: 0, relationships: 0 },
    },
    quests: [],
    completedQuests: [],
    rewards: STARTER_REWARDS,
    achievements: [],
    stats: {
      totalXpEarned: 0,
      questsCompleted: 0,
      questsFailed: 0,
      longestStreak: 0,
      dailyLog: {},
    },
    pendingReward: null,
    levelUpEvent: null,
    notification: null,
    notion: {
      workerUrl: '',
      token: '',
      connected: false,
      botName: '',
    },
  };
}

// ── Reducer ───────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    case 'SET_SCREEN': return { ...state, screen: action.payload };
    case 'SET_TAB':    return { ...state, tab: action.payload };

    case 'CREATE_CHARACTER': {
      const char = { ...state.character, ...action.payload };
      const derived = deriveStats(char);
      return {
        ...state,
        screen: 'main',
        character: { ...char, hp: derived.maxHp, mp: derived.maxMp },
      };
    }

    case 'ADD_QUEST': {
      const quest = {
        id: Date.now().toString(),
        status: 'available',
        createdAt: Date.now(),
        bonusCompleted: [],
        ...action.payload,
      };
      return { ...state, quests: [quest, ...state.quests] };
    }

    case 'UPDATE_QUEST': {
      return {
        ...state,
        quests: state.quests.map(q => q.id === action.payload.id ? { ...q, ...action.payload } : q),
      };
    }

    case 'DELETE_QUEST': {
      return { ...state, quests: state.quests.filter(q => q.id !== action.payload) };
    }

    case 'COMPLETE_QUEST': {
      const { questId, bonusCompleted = [] } = action.payload;
      const quest = state.quests.find(q => q.id === questId);
      if (!quest) return state;

      const diff = DIFFICULTIES[quest.difficulty] || DIFFICULTIES.medium;
      let xpGain = diff.xp;

      // Bonus objectives
      xpGain += bonusCompleted.length * diff.xp * 0.25;

      // Class bonus
      const cls = CLASSES[state.character.class];
      if (cls.bonus.all) xpGain *= (1 + cls.bonus.all);
      if (cls.bonus[quest.category]) xpGain *= (1 + cls.bonus[quest.category]);

      // Talent bonuses
      const talents = state.character.talentPoints || [];
      if (talents.includes('ambition') && ['hard','epic','legendary'].includes(quest.difficulty)) xpGain *= 1.1;
      if (talents.includes('discipline') && quest.recurrence !== 'none') xpGain *= 1.05;

      // Streak bonus
      const streakBonus = Math.min(state.character.streak * 0.10, 1.0);
      xpGain *= (1 + streakBonus);

      // First quest of day
      const today = new Date().toDateString();
      const dailyLog = { ...state.stats.dailyLog };
      const isFirstToday = !dailyLog[today];
      if (isFirstToday) xpGain += 25;

      xpGain = Math.round(xpGain);

      const goldGain = Math.round(xpGain * 0.4 * (1 + (state.character.fortune - 10) * 0.02));
      const oldXp = state.character.xp;
      const newXp = oldXp + xpGain;
      const oldLevel = levelFromXp(oldXp);
      const newLevel = levelFromXp(newXp);
      const leveledUp = newLevel > oldLevel;

      // Category mastery
      const catKey = quest.category;
      const catCount = (state.character.categoryQuests?.[catKey] || 0) + 1;
      let masteryXp = 0;
      if (catCount % 10 === 0) masteryXp = 50;

      // Category stat increase
      const statMap = { health: 'vitality', intelligence: 'wisdom', money: 'fortune', relationships: 'charisma' };
      const statKey = statMap[catKey];
      const newStatVal = Math.min(100, (state.character[statKey] || 10) + (catCount % 10 === 0 ? 1 : 0));

      // New character
      const newCharBase = {
        ...state.character,
        xp: newXp + masteryXp,
        gold: (state.character.gold || 0) + goldGain,
        [statKey]: newStatVal,
        categoryQuests: {
          ...state.character.categoryQuests,
          [catKey]: catCount,
        },
        spentTalentPoints: state.character.spentTalentPoints || 0,
      };

      // Level up: +1 all stats, +1 talent point every 5 levels
      let newChar = { ...newCharBase };
      if (leveledUp) {
        newChar.vitality  = Math.min(100, (newChar.vitality  || 10) + 1);
        newChar.wisdom    = Math.min(100, (newChar.wisdom    || 10) + 1);
        newChar.fortune   = Math.min(100, (newChar.fortune   || 10) + 1);
        newChar.charisma  = Math.min(100, (newChar.charisma  || 10) + 1);
        if (newLevel % 5 === 0) {
          newChar.talentPointsAvailable = (newChar.talentPointsAvailable || 0) + 1;
        }
      }

      const derived = deriveStats(newChar);
      newChar.hp = Math.min(derived.maxHp, (newChar.hp || derived.maxHp));
      newChar.mp = Math.min(derived.maxMp, (newChar.mp || derived.maxMp));

      // Update daily log
      dailyLog[today] = (dailyLog[today] || 0) + 1;

      // Reward roll
      const rewardRoll = rollReward(quest, state);

      // Handle recurrence
      const updatedQuest = { ...quest, status: 'completed', completedAt: Date.now(), bonusCompleted };
      let newQuests = state.quests.filter(q => q.id !== questId);
      if (quest.recurrence && quest.recurrence !== 'none') {
        newQuests = [...newQuests, {
          ...quest,
          id: Date.now().toString() + '_r',
          status: 'available',
          completedAt: undefined,
          createdAt: Date.now(),
          bonusCompleted: [],
        }];
      }

      return {
        ...state,
        quests: newQuests,
        completedQuests: [updatedQuest, ...state.completedQuests].slice(0, 200),
        character: newChar,
        stats: {
          ...state.stats,
          totalXpEarned: (state.stats.totalXpEarned || 0) + xpGain + masteryXp,
          questsCompleted: (state.stats.questsCompleted || 0) + 1,
          dailyLog,
        },
        pendingReward: rewardRoll,
        levelUpEvent: leveledUp ? { level: newLevel, xpGain } : state.levelUpEvent,
        notification: { type: 'xp', message: `+${xpGain} XP`, xp: xpGain, gold: goldGain },
      };
    }

    case 'FAIL_QUEST': {
      const quest = state.quests.find(q => q.id === action.payload);
      if (!quest) return state;
      const hpLoss = quest.difficulty === 'legendary' ? 30 : quest.difficulty === 'epic' ? 20 : quest.difficulty === 'hard' ? 15 : 10;
      const talents = state.character.talentPoints || [];
      const penalty = talents.includes('resilience') ? Math.round(hpLoss * 0.5) : hpLoss;
      const updatedChar = { ...state.character, hp: Math.max(0, (state.character.hp || 0) - penalty) };
      return {
        ...state,
        quests: state.quests.filter(q => q.id !== action.payload),
        completedQuests: [{ ...quest, status: 'failed', failedAt: Date.now() }, ...state.completedQuests].slice(0, 200),
        character: updatedChar,
        stats: { ...state.stats, questsFailed: (state.stats.questsFailed || 0) + 1 },
      };
    }

    case 'ABANDON_QUEST': {
      const quest = state.quests.find(q => q.id === action.payload);
      if (!quest) return state;
      return {
        ...state,
        quests: state.quests.filter(q => q.id !== action.payload),
        completedQuests: [{ ...quest, status: 'abandoned', abandonedAt: Date.now() }, ...state.completedQuests].slice(0, 200),
        stats: { ...state.stats, questsFailed: (state.stats.questsFailed || 0) + 1 },
      };
    }

    case 'START_QUEST': {
      return {
        ...state,
        quests: state.quests.map(q => q.id === action.payload ? { ...q, status: 'in_progress', startedAt: Date.now() } : q),
      };
    }

    case 'CLEAR_REWARD':     return { ...state, pendingReward: null };
    case 'CLEAR_LEVEL_UP':   return { ...state, levelUpEvent: null };
    case 'CLEAR_NOTIFICATION': return { ...state, notification: null };

    case 'ADD_REWARD': {
      const reward = { id: Date.now().toString(), ...action.payload };
      return { ...state, rewards: [...state.rewards, reward] };
    }
    case 'UPDATE_REWARD': {
      return { ...state, rewards: state.rewards.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r) };
    }
    case 'DELETE_REWARD': {
      return { ...state, rewards: state.rewards.filter(r => r.id !== action.payload) };
    }

    case 'SPEND_TALENT_POINT': {
      const path = action.payload;
      const current = state.character.talentPoints || [];
      if (current.includes(path)) return state;
      const available = state.character.talentPointsAvailable || 0;
      if (available <= 0) return state;
      return {
        ...state,
        character: {
          ...state.character,
          talentPoints: [...current, path],
          talentPointsAvailable: available - 1,
          spentTalentPoints: (state.character.spentTalentPoints || 0) + 1,
        },
      };
    }

    case 'UPDATE_STREAK': {
      const today = new Date().toDateString();
      const last = state.character.lastActiveDate;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      let streak = state.character.streak || 0;
      if (last === yesterday) streak = streak + 1;
      else if (last !== today) streak = 1;
      const longest = Math.max(state.stats.longestStreak || 0, streak);
      return {
        ...state,
        character: { ...state.character, streak, lastActiveDate: today },
        stats: { ...state.stats, longestStreak: longest },
      };
    }

    case 'UNLOCK_ACHIEVEMENT': {
      if (state.achievements.includes(action.payload)) return state;
      return { ...state, achievements: [...state.achievements, action.payload] };
    }

    case 'SET_NOTION_CONFIG': {
      return { ...state, notion: { ...state.notion, ...action.payload } };
    }

    case 'IMPORT_DATA': {
      return { ...state, ...action.payload };
    }

    default: return state;
  }
}

// ── Reward roll logic ────────────────────────────────────────
function rollReward(quest, state) {
  const diff = DIFFICULTIES[quest.difficulty] || DIFFICULTIES.medium;
  const baseChance = 0.70;
  const diffMod = { trivial: -0.2, easy: -0.1, medium: 0, hard: 0.1, epic: 0.2, legendary: 1 }[quest.difficulty] || 0;
  const streakMod = Math.min((state.character.streak || 0) * 0.01, 0.1);
  const fortuneMod = Math.max(0, ((state.character.fortune || 10) - 10) * 0.005);
  const finalChance = quest.difficulty === 'legendary' ? 1 : Math.min(1, baseChance + diffMod + streakMod + fortuneMod);

  if (Math.random() > finalChance) {
    return { triggered: false };
  }

  // Roll reward tier
  const roll = Math.random();
  let cumulative = 0;
  let tier = 'common';
  for (const [t, info] of Object.entries(REWARD_TIERS)) {
    cumulative += info.chance;
    if (roll <= cumulative) { tier = t; break; }
  }

  // Pick a reward of this tier from user's list
  const available = state.rewards.filter(r => r.tier === tier && r.available !== false);
  const reward = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;

  return { triggered: true, tier, reward };
}

// ── Context ───────────────────────────────────────────────────
const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, initialState);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('life_gamified_v1', JSON.stringify(state));
  }, [state]);

  // Update streak on load
  useEffect(() => {
    if (state.screen === 'main') dispatch({ type: 'UPDATE_STREAK' });
  }, [state.screen]);

  // Achievement checks
  useEffect(() => {
    if (state.screen !== 'main') return;
    const { questsCompleted = 0 } = state.stats;
    const level = levelFromXp(state.character.xp || 0);
    const streak = state.character.streak || 0;

    const checks = [
      ['first_steps',  questsCompleted >= 1],
      ['apprentice',   level >= 5],
      ['journeyman',   level >= 10],
      ['expert',       level >= 25],
      ['master',       level >= 50],
      ['grandmaster',  level >= 100],
      ['week_streak',  streak >= 7],
      ['month_streak', streak >= 30],
      ['century_streak', streak >= 100],
      ['year_streak',  streak >= 365],
      ['health_master', (state.character.categoryQuests?.health || 0) >= 50],
      ['intel_master',  (state.character.categoryQuests?.intelligence || 0) >= 50],
      ['money_master',  (state.character.categoryQuests?.money || 0) >= 50],
      ['rel_master',    (state.character.categoryQuests?.relationships || 0) >= 50],
    ];

    checks.forEach(([id, cond]) => {
      if (cond && !state.achievements.includes(id)) {
        dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: id });
      }
    });
  }, [state.stats.questsCompleted, state.character.xp, state.character.streak, state.character.categoryQuests, state.screen]);

  const value = { state, dispatch };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
