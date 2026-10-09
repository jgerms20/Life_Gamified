# AGENTS.md

## If you are an assistant *using* the journal

Read [`docs/AGENT_API.md`](docs/AGENT_API.md). You can also fetch it live from
`https://zsgacmfbqqmbcexomyoo.supabase.co/functions/v1/lg-agent/docs`.
The short version:

- Record what actually happened.
- Prefer completing an existing quest over logging a new deed for the same thing.
- Always set an `external_id` for items that come from another system.

## If you are a coding agent *changing* this repo

- The game rules live in `supabase/functions/_shared/engine.js`. Both the web app (`src/lib/engine.js` re-exports it) and the Edge Function import it.
- Keep the engine pure: no network, no storage, no DOM. Every rule change needs a test in `tests/engine.test.mjs`. Run `npm test`.
- Derived values (level, stats, max HP/MP, talent points, streak) are computed by `derive()` and `computeStreak()`. Never store them as facts.
- After you change the engine or `_shared/*`, redeploy the `lg-agent` Edge Function. Otherwise the app and the agent will disagree.
- After you change `_shared/agent-docs.js`, run `npm run docs`.
- All database objects are prefixed `lg_`, because the Supabase project is shared with another app. Do not touch other tables.
- Pushing to `main` deploys the site.
