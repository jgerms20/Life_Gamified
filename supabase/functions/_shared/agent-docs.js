// The guide an AI agent reads (GET /docs and the MCP server instructions).
// docs/AGENT_API.md is generated from this file: `npm run docs`.

export const AGENT_GUIDE = `# Life Gamified — agent guide

Life Gamified is a fantasy-RPG quest journal. A real person lives their life;
you (their assistant) keep the journal in step with it. Everything you write
appears live in their app, awards XP and gold, can level them up and can drop
treasure chests holding real-world rewards they chose themselves.

## The one rule

**Record what actually happened.** Do not invent completions. When unsure
whether something was done, add it as a quest (to-do) instead of completing it.

## Concepts

- **Quest** — something to do. Has a title, category, difficulty, optional
  due date (YYYY-MM-DD in the person's time zone), recurrence and bonus objectives.
- **Deed** — something already done that was never on the board. Logging a
  deed creates and completes it in one step.
- **Category** — health, intelligence, money, relationships. Synonyms work:
  fitness/sleep → health, learning/work/reading → intelligence,
  finance/budget → money, family/friends/social → relationships.
- **Difficulty** → base XP: trivial 10, easy 25, medium 50, hard 100, epic 200,
  legendary 500. Be honest: a 10-minute chore is trivial or easy; a hard
  workout or deep-work block is hard; epic and legendary are rare milestones.
- **Bonus objectives** — optional sub-goals, +25% XP each when done.
- **external_id** — your own stable id for a thing (e.g. \`calendar:abc123\`,
  \`notion:<page id>\`, \`strava:991\`). Adding a quest with an external_id that
  already exists updates it instead of duplicating; logging a deed whose
  external_id was already completed is ignored. Always set one when the
  source system has ids. You can use an external_id anywhere a quest id is asked.
- **Recurring quests** (daily/weekly/monthly) respawn automatically with the
  next due date when completed or failed.
- **Fail** costs HP; **abandon** costs half as much. Use them only when the
  person says so or a deadline clearly passed and they confirm.
- **Undo** — every chronicle entry can be struck out with its history id if
  you made a mistake. XP, gold, rewards and the quest are restored.

Streaks, combos, first-deed-of-the-day bonuses, levels, achievements and
reward rolls are all computed for you. Never try to calculate XP yourself.

## Good habits

1. Start a session with \`get_status\` (or \`GET /\`) to see what's on the board.
2. Prefer completing an existing quest over logging a new deed for the same thing.
3. Batch: send several quests or deeds in one call.
4. Pass \`at\` (ISO timestamp, up to 7 days back) when logging something late,
   so it lands on the right day and keeps the streak honest.
5. Put the human-readable why in \`note\` ("Logged from Apple Health: 42 min run").
6. Keep titles short and in the person's voice: "Run 5k", "Call Mum".

## REST API

Base URL: \`https://zsgacmfbqqmbcexomyoo.supabase.co/functions/v1/lg-agent\`
Auth: \`Authorization: Bearer lg_…\` (or \`x-api-key: lg_…\`). Keys are created in
the app under Settings → Agent access. Fields accept snake_case or camelCase.

| Method & path | What it does |
| --- | --- |
| \`GET /\` | Status summary: hero, streak, quests due today / overdue, unclaimed rewards |
| \`GET /quests\` | Active quests |
| \`POST /quests\` | Add one quest, or \`{ "quests": [...] }\` |
| \`PATCH /quests/:id\` | Edit a quest |
| \`DELETE /quests/:id\` | Remove a quest without penalty |
| \`POST /quests/:id/complete\` | \`{ bonus_done?: "all" \\| [0,1], at?, note? }\` |
| \`POST /quests/:id/start\` | Mark in progress |
| \`POST /quests/:id/fail\` / \`abandon\` | \`{ note? }\` |
| \`POST /deeds\` | Log done things: one deed or \`{ "deeds": [...] }\` |
| \`GET /history?limit=20\` | Chronicle entries (newest first) |
| \`POST /history/:id/undo\` | Strike an entry out |
| \`GET /rewards\` / \`POST /rewards\` | The person's reward table |
| \`POST /actions\` | Advanced: \`{ "actions": [{ "type", "payload" }] }\` applied atomically |
| \`GET /docs\` | This guide |

Quest fields: \`title\` (required), \`description\`, \`category\`, \`difficulty\`,
\`due_date\`, \`recurrence\` (none/daily/weekly/monthly), \`bonus_objectives\`
(strings), \`prerequisites\` (quest ids), \`tags\`, \`external_id\`.

Every write returns what happened (\`events\`: XP, level-ups, chests, trophies)
plus a fresh \`status\`. The person gets a push notification for notable moments.

Errors are JSON \`{ "error": { "code", "message" } }\` with a 4xx status, e.g.
\`quest_not_found\`, \`invalid_category\`, \`quest_locked\`.

## MCP

The same endpoint speaks MCP (streamable HTTP, JSON responses) at
\`…/functions/v1/lg-agent/mcp\` with the same bearer key. Tools: get_status,
list_quests, add_quests, update_quest, complete_quest, log_deeds, fail_quest,
abandon_quest, delete_quest, list_history, undo_entry, list_rewards, add_reward.
`;
