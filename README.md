# ⚔ Life Gamified — a quest journal for real life

**Live:** https://jgerms20.github.io/Life_Gamified/

An illuminated, leather-bound RPG journal for your actual life. Post quests, earn XP and gold, level up, keep streaks, and win treasure chests that hold *real* rewards you choose. Your progress is saved to the cloud (Supabase), and an AI assistant can keep the journal up to date for you while you just live your days.

## What's inside

- **Quest board.** Post quests in one line with shorthand: `Run 5k #health !hard @tomorrow *daily`. You can also open the full Quest Contract for descriptions, bonus objectives, quest chains and recurrence. Seal a quest with its wax seal, or swipe it on your phone.
- **Chronicle.** A day-by-day journal of every deed, with the XP breakdown, notes from your agent, and undo.
- **Character.** Five classes, four attributes, HP and MP, levels on the `n² × 50 + n × 50` curve, and three abilities (Second Wind, Divination, Time Warp).
- **Talents.** Five paths, each with three ranks. You earn a point every 5 levels.
- **Rewards.** Variable-ratio treasure chests with five tiers, cooldowns and seasonal rewards. A Perfect Day guarantees a Rare-or-better chest.
- **Bonuses.** Streaks (+10% per day), first deed of the day, category combos, the Easy → Medium → Hard run, and mastery ranks.
- **Trophies.** 20 achievements, shown in a great hall.
- **Statistics.** A 20-week heatmap, streak history, a category compass rose, a difficulty breakdown and personal records.
- **Notifications.** Push notifications for a morning digest, a streak-guard nudge, and whenever your agent logs something notable.
- **Install it.** It's a PWA, so you can add it to your phone's home screen. It works offline and syncs when you're back online.
- **Animation.** Page turns, a level-up ceremony, chest openings, candlelight and dust motes. Calm mode turns most of it down.

## For your AI assistant

Create a key in the app under **Settings → Agent access**. That screen gives you ready-to-paste instructions, an MCP config, and a curl example.

- Agent guide: [`docs/AGENT_API.md`](docs/AGENT_API.md). Agents can also read it live at `GET …/functions/v1/lg-agent/docs`.
- REST: `https://zsgacmfbqqmbcexomyoo.supabase.co/functions/v1/lg-agent`
- MCP (streamable HTTP): `…/lg-agent/mcp`

Your agent runs on the same game engine as the app, so XP, streaks and rewards come out identical whoever records the deed. Writes from the agent show up in the app live, and its chests and level-ups play their ceremonies the next time you open the journal.

## How it fits together

```
src/                      React 19 + Framer Motion app (GitHub Pages)
  lib/store.js            local-first store, cloud sync, conflict replay
supabase/
  functions/_shared/      engine.js — the game rules, shared by app and server
  functions/lg-agent/     Edge Function: agent REST + MCP, push, cron sweep
  migrations/             lg_* tables (RLS), pg_cron schedule
tests/                    engine tests (node --test)
```

- **Storage.** Each person has one `lg_journals` row holding the journal as JSON, with a `version` used for optimistic concurrency. If you and your agent write at the same moment, the app replays your taps on top of the agent's change, reusing the same dice rolls.
- **Security.** Row Level Security limits every table to its owner. Agent keys are stored only as SHA-256 hashes. VAPID keys and the cron secret live in a table that clients cannot read.

## Develop

```bash
npm install
npm run dev     # http://localhost:5173/Life_Gamified/
npm test        # engine tests
npm run lint
npm run docs    # regenerate docs/AGENT_API.md
```

Every push to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`. Deploy the Edge Function with `supabase functions deploy lg-agent --no-verify-jwt`. It does its own auth with agent keys.
