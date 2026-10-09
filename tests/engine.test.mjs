import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAction, createInitialState, migrate, derive, levelInfo, xpToNext,
  summarize, computeStreak, addDays, dayKey, EngineError,
} from '../supabase/functions/_shared/engine.js';

const T0 = Date.parse('2026-10-09T15:00:00Z');
const DAY = 86400e3;
const tz = 'America/Los_Angeles';

function run(state, type, payload, opts = {}) {
  return applyAction(state, { type, payload }, { now: opts.now ?? T0, rng: opts.rng ?? (() => 0.99), actor: opts.actor ?? 'human' });
}
function hero(opts = {}) {
  let s = createInitialState({ now: T0, timeZone: tz });
  s = run(s, 'CREATE_CHARACTER', { name: 'Josh', class: opts.class || 'adventurer' }).state;
  return s;
}

test('level curve follows n² × 50 + n × 50', () => {
  assert.equal(xpToNext(1), 100);
  assert.equal(xpToNext(2), 300);
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(99).level, 1);
  assert.equal(levelInfo(100).level, 2);
  assert.equal(levelInfo(399).level, 2);
  assert.equal(levelInfo(400).level, 3);
});

test('character creation derives HP/MP from stats', () => {
  const s = hero();
  const d = derive(s);
  assert.equal(d.level, 1);
  assert.equal(d.stats.vitality, 10);
  assert.equal(d.maxHp, 150);
  assert.equal(d.maxMp, 80);
  assert.equal(d.hp, 150);
});

test('completing a medium quest: base + first-of-day + gold, no reward on high roll', () => {
  let s = hero();
  const { state: s1, result } = run(s, 'ADD_QUEST', { title: 'Run 5k', category: 'fitness', difficulty: 'medium' });
  assert.equal(result.quest.category, 'health');
  const { state: s2, events } = run(s1, 'COMPLETE_QUEST', { id: result.quest.id });
  const h = s2.history[0];
  // 50 base, +5% adventurer (round 53), +25 first of day
  assert.equal(h.xp, 50 + 3 + 25);
  assert.equal(s2.character.xp, h.xp);
  assert.ok(h.gold > 0);
  assert.equal(s2.quests.length, 0);
  assert.equal(s2.stats.streak, 1);
  const chest = events.find(e => e.type === 'chest');
  assert.equal(chest.loot.outcome, 'nothing');
  assert.ok(s2.achievements.first_steps);
});

test('low roll wins a reward that lands in loot and ceremonies', () => {
  let s = hero();
  s = run(s, 'ADD_QUEST', { title: 'Read', category: 'intelligence', difficulty: 'hard' }).state;
  const { state, events } = run(s, 'COMPLETE_QUEST', { id: s.quests[0].id }, { rng: () => 0.01 });
  const chest = events.find(e => e.type === 'chest');
  assert.equal(chest.loot.outcome, 'reward');
  assert.equal(chest.loot.tier, 'common');
  assert.equal(state.loot.length, 1);
  assert.ok(state.ceremonies.some(c => c.type === 'chest'));
});

test('legendary quest always rewards and unlocks Dragon Slayer, levels up', () => {
  let s = hero();
  s = run(s, 'ADD_QUEST', { title: 'Marathon', category: 'health', difficulty: 'legendary' }).state;
  const { state, events } = run(s, 'COMPLETE_QUEST', { id: s.quests[0].id }, { rng: () => 0.999 });
  assert.equal(events.find(e => e.type === 'chest').loot.outcome !== 'nothing', true);
  assert.ok(state.achievements.dragon_slayer);
  assert.ok(events.some(e => e.type === 'level_up'));
  assert.equal(derive(state).stats.vitality, 10 + derive(state).level - 1);
});

test('streak builds across days and adds +10%/day', () => {
  let s = hero();
  for (let i = 0; i < 3; i++) {
    const now = T0 + i * DAY;
    s = run(s, 'ADD_QUEST', { title: `Day ${i}`, difficulty: 'easy' }, { now }).state;
    s = run(s, 'COMPLETE_QUEST', { id: s.quests[0].id }, { now }).state;
  }
  assert.equal(s.stats.streak, 3);
  // 25 base, +5% class, +20% streak → round(25*1.25)=31 + 25 first-of-day
  assert.equal(s.history[0].xp, 31 + 25);
  // skip a day → streak resets on next action
  s = run(s, 'TICK', {}, { now: T0 + 5 * DAY }).state;
  assert.equal(s.stats.streak, 0);
  assert.equal(s.stats.longestStreak, 3);
});

test('category combo and difficulty run bonuses', () => {
  let s = hero();
  const add = (title, difficulty) => { s = run(s, 'ADD_QUEST', { title, category: 'money', difficulty }).state; return s.quests[0].id; };
  for (const d of ['easy', 'medium', 'hard']) {
    const id = add(d, d);
    s = run(s, 'COMPLETE_QUEST', { id }).state;
  }
  const h = s.history[0];
  assert.ok(h.breakdown.some(b => b.label.includes('Difficulty run')));
  assert.ok(h.breakdown.some(b => b.label.includes('combo')));
});

test('recurring quest respawns with next due date; undo restores everything', () => {
  let s = hero();
  s = run(s, 'ADD_QUEST', { title: 'Meditate', recurrence: 'daily', dueDate: '2026-10-09', difficulty: 'easy', bonusObjectives: ['20 min'] }).state;
  const id = s.quests[0].id;
  const before = structuredClone(s);
  const { state: done } = run(s, 'COMPLETE_QUEST', { id, bonusDone: 'all' }, { rng: () => 0.01 });
  assert.equal(done.quests.length, 1);
  assert.equal(done.quests[0].dueDate, '2026-10-10');
  assert.equal(done.quests[0].bonusObjectives[0].done, false);
  const { state: undone } = run(done, 'UNDO_HISTORY', { id: done.history[0].id });
  assert.equal(undone.character.xp, before.character.xp);
  assert.equal(undone.character.gold, before.character.gold);
  assert.equal(undone.quests.length, 1);
  assert.equal(undone.quests[0].id, id);
  assert.equal(undone.loot.length, 0);
  assert.equal(undone.stats.completed, 0);
  assert.equal(undone.history.length, 0);
});

test('perfect day awards a guaranteed rare+ chest', () => {
  let s = hero();
  s = run(s, 'ADD_QUEST', { title: 'Due today', dueDate: '2026-10-09' }).state;
  const { state, events } = run(s, 'COMPLETE_QUEST', { id: s.quests[0].id }, { rng: () => 0.999 });
  const chests = events.filter(e => e.type === 'chest');
  assert.equal(chests.length, 2);
  assert.equal(chests[1].loot.label, 'Perfect Day');
  assert.ok(['rare', 'epic', 'legendary'].includes(chests[1].loot.tier));
  assert.ok(state.achievements.perfect_day);
});

test('prerequisites lock a quest', () => {
  let s = hero();
  s = run(s, 'ADD_QUEST', { title: 'Step 1' }).state;
  const a = s.quests[0].id;
  s = run(s, 'ADD_QUEST', { title: 'Step 2', prerequisites: [a] }).state;
  const b = s.quests[0].id;
  assert.throws(() => run(s, 'COMPLETE_QUEST', { id: b }), e => e instanceof EngineError && e.code === 'quest_locked');
  s = run(s, 'COMPLETE_QUEST', { id: a }).state;
  assert.doesNotThrow(() => run(s, 'COMPLETE_QUEST', { id: b }));
});

test('externalId makes ADD_QUEST idempotent and LOG_DEED dedupes', () => {
  let s = hero();
  s = run(s, 'ADD_QUEST', { title: 'Call mum', externalId: 'cal:1', category: 'family' }, { actor: 'agent' }).state;
  const r = run(s, 'ADD_QUEST', { title: 'Call mum (Sunday)', externalId: 'cal:1' }, { actor: 'agent' });
  assert.equal(r.result.upserted, 'updated');
  assert.equal(r.state.quests.length, 1);
  assert.equal(r.state.quests[0].source, 'agent');
  s = run(r.state, 'COMPLETE_QUEST', { id: 'cal:1' }, { actor: 'agent' }).state;
  s = run(s, 'LOG_DEED', { title: 'Gym', externalId: 'whoop:9', difficulty: 'hard' }, { actor: 'agent' }).state;
  const dup = run(s, 'LOG_DEED', { title: 'Gym', externalId: 'whoop:9' }, { actor: 'agent' });
  assert.equal(dup.result.duplicate, true);
  assert.equal(dup.state.stats.completed, s.stats.completed);
  assert.equal(s.feed[0].actor, 'agent');
});

test('failing costs HP, abandoning half; resilience softens it', () => {
  let s = hero();
  s = run(s, 'ADD_QUEST', { title: 'x', difficulty: 'hard' }).state;
  const r = run(s, 'FAIL_QUEST', { id: s.quests[0].id });
  assert.equal(derive(r.state).hp, 150 - 15);
  s = run(s, 'ABANDON_QUEST', { id: s.quests[0].id }).state;
  assert.equal(derive(s).hp, 150 - 8);
});

test('talents need points; abilities spend MP', () => {
  let s = hero();
  assert.throws(() => run(s, 'LEARN_TALENT', { path: 'fortune' }), /talent points/);
  s.character.xp = 10000; // well past level 5
  s = run(s, 'LEARN_TALENT', { path: 'fortune' }).state;
  assert.equal(s.character.talents.fortune, 1);
  s = run(s, 'USE_ABILITY', { ability: 'divination' }).state;
  assert.equal(s.buffs.divination, true);
  s = run(s, 'ADD_QUEST', { title: 'q', difficulty: 'trivial' }).state;
  const { events, state } = run(s, 'COMPLETE_QUEST', { id: s.quests[0].id }, { rng: () => 0.999 });
  assert.notEqual(events.find(e => e.type === 'chest').loot.outcome, 'nothing');
  assert.equal(state.buffs.divination, false);
});

test('migrates the v1 localStorage format', () => {
  const v1 = {
    screen: 'main',
    character: { name: 'Old', class: 'scholar', xp: 250, gold: 40, vitality: 12, talentPoints: ['wisdom'], categoryQuests: { health: 3 } },
    quests: [{ id: '1', title: 'Old quest', category: 'money', difficulty: 'hard', status: 'available', bonusObjectives: ['a'], createdAt: 1 }],
    completedQuests: [{ id: '2', title: 'Done', category: 'health', difficulty: 'easy', status: 'completed', completedAt: T0 }],
    rewards: [{ id: 'r1', name: 'Snack', tier: 'common', cooldown: 0 }],
    achievements: ['first_steps', 'week_streak'],
    stats: { questsCompleted: 4, dailyLog: { [new Date(T0).toDateString()]: 2 }, longestStreak: 7 },
  };
  const s = migrate(v1, { now: T0 });
  assert.equal(s.character.name, 'Old');
  assert.equal(s.character.talents.wisdom, 1);
  assert.equal(s.quests[0].bonusObjectives[0].text, 'a');
  assert.equal(s.history[0].outcome, 'completed');
  assert.equal(s.stats.dailyLog['2026-10-09'], 2);
  assert.ok(s.achievements.streak_7);
  assert.equal(s.rewards[0].name, 'Snack');
  // and it keeps working
  const r = applyAction(s, { type: 'TICK' }, { now: T0 });
  assert.ok(r.state.schemaVersion === 2);
});

test('summary for agents', () => {
  let s = hero();
  s = run(s, 'ADD_QUEST', { title: 'Overdue', dueDate: '2026-10-01' }).state;
  s = run(s, 'ADD_QUEST', { title: 'Today', dueDate: '2026-10-09' }).state;
  const sum = summarize(s, { now: T0 });
  assert.equal(sum.hero.level, 1);
  assert.equal(sum.quests.overdue.length, 1);
  assert.equal(sum.quests.dueToday.length, 1);
});

test('day keys respect time zone', () => {
  const late = Date.parse('2026-10-10T05:00:00Z'); // 10pm Oct 9 in LA
  assert.equal(dayKey(late, tz), '2026-10-09');
  assert.equal(dayKey(late, 'UTC'), '2026-10-10');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(computeStreak({ '2026-10-08': 1, '2026-10-07': 2 }, '2026-10-09'), 2);
});

test('bad input gives readable errors', () => {
  const s = hero();
  assert.throws(() => run(s, 'ADD_QUEST', { title: 'x', category: 'banana' }), e => e.code === 'invalid_category');
  assert.throws(() => run(s, 'ADD_QUEST', { title: '' }), e => e.code === 'missing_title');
  assert.throws(() => run(s, 'COMPLETE_QUEST', { id: 'nope' }), e => e.code === 'quest_not_found');
  assert.throws(() => run(s, 'WHAT', {}), e => e.code === 'unknown_action');
});
