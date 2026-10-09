// Life Gamified — API for AI agents (REST + MCP).
// Deployed with verify_jwt = false; every request is authorised with an
// agent key (lg_…) that the person creates in the app.
import { AGENT_GUIDE } from '../_shared/agent-docs.js';
import { summarize, EngineError } from '../_shared/engine.js';
import { CORS, json, loadJournal, mutate, userFromAgentKey, pushToUser, messageForEvents } from '../_shared/server.ts';
import { handlePush } from '../_shared/push-routes.ts';

// ── Input normalisation ───────────────────────────────────────────────────

const camel = (k: string) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
function camelize(o: any): any {
  if (Array.isArray(o)) return o;
  if (!o || typeof o !== 'object') return o;
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [camel(k), v]));
}

function trimQuest(q: any) {
  return {
    id: q.id, title: q.title, description: q.description || undefined, category: q.category,
    difficulty: q.difficulty, status: q.status, due_date: q.dueDate, recurrence: q.recurrence,
    bonus_objectives: q.bonusObjectives?.map((b: any) => ({ text: b.text, done: b.done })),
    prerequisites: q.prerequisites?.length ? q.prerequisites : undefined,
    tags: q.tags?.length ? q.tags : undefined, external_id: q.externalId || undefined,
    source: q.source, created_at: new Date(q.createdAt).toISOString(),
  };
}

function trimHistory(h: any) {
  return {
    id: h.id, title: h.title, outcome: h.outcome, category: h.category, difficulty: h.difficulty,
    at: new Date(h.at).toISOString(), day: h.day, xp: h.xp, gold: h.gold, breakdown: h.breakdown,
    note: h.note || undefined, actor: h.actor, external_id: h.externalId || undefined,
  };
}

function trimEvents(events: any[]) {
  return events.map(e => {
    if (e.type === 'chest') {
      const l = e.loot;
      return { type: 'chest', outcome: l.outcome, tier: l.tier, reward: l.name, label: l.label || undefined };
    }
    const { id: _id, at: _at, actor: _actor, ...rest } = e;
    return rest;
  });
}

// ── Operations shared by REST and MCP ─────────────────────────────────────

async function status(userId: string) {
  const { state } = await loadJournal(userId);
  return summarize(state);
}

async function write(userId: string, actions: any[]) {
  const r = await mutate(userId, actions, 'agent');
  const prefs = r.state.settings?.notifications || {};
  if (prefs.agentActivity !== false) {
    const msg = messageForEvents(r.events);
    if (msg) await pushToUser(userId, msg).catch(e => console.warn('push', e));
  }
  return {
    ok: true,
    results: r.results.map((x: any) => x?.quest ? { quest: trimQuest(x.quest), upserted: x.upserted }
      : x?.reward ? { reward: x.reward }
      : x?.outcome ? trimHistory(x)
      : x),
    events: trimEvents(r.events),
    status: summarize(r.state),
  };
}

const ops = {
  get_status: (u: string) => status(u),
  list_quests: async (u: string) => {
    const { state } = await loadJournal(u);
    return { quests: state.quests.map(trimQuest) };
  },
  add_quests: (u: string, a: any) => write(u, (a.quests || [a]).map((q: any) => ({ type: 'ADD_QUEST', payload: camelize(q) }))),
  update_quest: (u: string, a: any) => write(u, [{ type: 'UPDATE_QUEST', payload: camelize(a) }]),
  complete_quest: (u: string, a: any) => write(u, [{ type: 'COMPLETE_QUEST', payload: camelize(a) }]),
  log_deeds: (u: string, a: any) => write(u, (a.deeds || [a]).map((d: any) => ({ type: 'LOG_DEED', payload: camelize(d) }))),
  fail_quest: (u: string, a: any) => write(u, [{ type: 'FAIL_QUEST', payload: camelize(a) }]),
  abandon_quest: (u: string, a: any) => write(u, [{ type: 'ABANDON_QUEST', payload: camelize(a) }]),
  start_quest: (u: string, a: any) => write(u, [{ type: 'START_QUEST', payload: camelize(a) }]),
  delete_quest: (u: string, a: any) => write(u, [{ type: 'DELETE_QUEST', payload: camelize(a) }]),
  undo_entry: (u: string, a: any) => write(u, [{ type: 'UNDO_HISTORY', payload: { id: a.history_id ?? a.historyId ?? a.id } }]),
  list_history: async (u: string, a: any) => {
    const { state } = await loadJournal(u);
    const limit = Math.min(200, Number(a?.limit) || 20);
    const since = a?.since ? Date.parse(a.since) : 0;
    return { history: state.history.filter((h: any) => h.at >= since).slice(0, limit).map(trimHistory) };
  },
  list_rewards: async (u: string) => {
    const { state } = await loadJournal(u);
    return { rewards: state.rewards, unclaimed_loot: state.loot.filter((l: any) => !l.redeemedAt) };
  },
  add_reward: (u: string, a: any) => write(u, [{ type: 'ADD_REWARD', payload: camelize(a) }]),
  run_actions: (u: string, a: any) => write(u, (a.actions || []).map((x: any) => ({ type: String(x.type), payload: camelize(x.payload || {}) }))),
};

// ── MCP (streamable HTTP, JSON responses) ─────────────────────────────────

const QUEST_PROPS = {
  title: { type: 'string', description: 'Short title in the person’s voice, e.g. "Run 5k"' },
  description: { type: 'string' },
  category: { type: 'string', enum: ['health', 'intelligence', 'money', 'relationships'] },
  difficulty: { type: 'string', enum: ['trivial', 'easy', 'medium', 'hard', 'epic', 'legendary'] },
  due_date: { type: 'string', description: 'YYYY-MM-DD in the person’s time zone' },
  recurrence: { type: 'string', enum: ['none', 'daily', 'weekly', 'monthly'] },
  bonus_objectives: { type: 'array', items: { type: 'string' } },
  prerequisites: { type: 'array', items: { type: 'string' }, description: 'Quest ids that must be completed first' },
  tags: { type: 'array', items: { type: 'string' } },
  external_id: { type: 'string', description: 'Your stable id for this item (dedupes)' },
};
const ID = { id: { type: 'string', description: 'Quest id or external_id' } };
const NOTE = { note: { type: 'string', description: 'Why / where this came from' } };

const TOOLS = [
  { name: 'get_status', description: 'Hero level, HP, streak, quests due today and overdue, unclaimed rewards. Call this first.', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } },
  { name: 'list_quests', description: 'All active quests on the board.', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } },
  { name: 'add_quests', description: 'Add one or more quests (to-dos). An existing external_id updates instead of duplicating.', inputSchema: { type: 'object', properties: { quests: { type: 'array', items: { type: 'object', properties: QUEST_PROPS, required: ['title'] } } }, required: ['quests'] } },
  { name: 'update_quest', description: 'Edit an active quest.', inputSchema: { type: 'object', properties: { ...ID, ...QUEST_PROPS }, required: ['id'] } },
  { name: 'complete_quest', description: 'Mark a quest done. Awards XP, gold and a reward roll.', inputSchema: { type: 'object', properties: { ...ID, bonus_done: { description: '"all" or indexes of finished bonus objectives', anyOf: [{ type: 'string', enum: ['all'] }, { type: 'array', items: { type: 'integer' } }] }, at: { type: 'string', description: 'ISO time it happened (≤7 days ago)' }, ...NOTE }, required: ['id'] } },
  { name: 'log_deeds', description: 'Record things already done that were not on the board (creates + completes).', inputSchema: { type: 'object', properties: { deeds: { type: 'array', items: { type: 'object', properties: { ...QUEST_PROPS, at: { type: 'string', description: 'ISO time it happened (≤7 days ago)' }, ...NOTE }, required: ['title'] } } }, required: ['deeds'] } },
  { name: 'fail_quest', description: 'Mark a quest failed (costs HP). Only when the person confirms.', inputSchema: { type: 'object', properties: { ...ID, ...NOTE }, required: ['id'] } },
  { name: 'abandon_quest', description: 'Give up on a quest (half HP cost).', inputSchema: { type: 'object', properties: { ...ID, ...NOTE }, required: ['id'] } },
  { name: 'delete_quest', description: 'Remove a quest with no penalty (e.g. added by mistake).', inputSchema: { type: 'object', properties: ID, required: ['id'] } },
  { name: 'list_history', description: 'Chronicle of completed/failed/abandoned entries, newest first.', inputSchema: { type: 'object', properties: { limit: { type: 'integer' }, since: { type: 'string', description: 'ISO time' } } }, annotations: { readOnlyHint: true } },
  { name: 'undo_entry', description: 'Strike a chronicle entry out; restores XP, gold and the quest.', inputSchema: { type: 'object', properties: { history_id: { type: 'string' } }, required: ['history_id'] } },
  { name: 'list_rewards', description: 'The person’s reward table and unclaimed loot.', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } },
  { name: 'add_reward', description: 'Add a real-world reward the person can win.', inputSchema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, tier: { type: 'string', enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'] }, cooldown_minutes: { type: 'integer' } }, required: ['name', 'tier'] } },
];

async function handleMcp(req: Request, userId: string) {
  if (req.method !== 'POST') return json({ error: 'Use POST for MCP' }, 405, { Allow: 'POST' });
  const body = await req.json();
  const batch = Array.isArray(body) ? body : [body];
  const out: any[] = [];
  for (const msg of batch) {
    if (msg.id === undefined) continue; // notifications need no reply
    const reply = (result: unknown) => out.push({ jsonrpc: '2.0', id: msg.id, result });
    const fail = (code: number, message: string) => out.push({ jsonrpc: '2.0', id: msg.id, error: { code, message } });
    switch (msg.method) {
      case 'initialize':
        reply({
          protocolVersion: msg.params?.protocolVersion || '2025-06-18',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'life-gamified', title: 'Life Gamified quest journal', version: '2.0.0' },
          instructions: AGENT_GUIDE,
        });
        break;
      case 'ping':
        reply({});
        break;
      case 'tools/list':
        reply({ tools: TOOLS });
        break;
      case 'tools/call': {
        const name = msg.params?.name as keyof typeof ops;
        const fn = ops[name];
        if (!fn) { fail(-32602, `Unknown tool ${name}`); break; }
        try {
          const data = await fn(userId, msg.params?.arguments || {});
          reply({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data });
        } catch (e: any) {
          reply({ content: [{ type: 'text', text: `${e.code || 'error'}: ${e.message}` }], isError: true });
        }
        break;
      }
      default:
        fail(-32601, `Method not found: ${msg.method}`);
    }
  }
  if (!out.length) return new Response(null, { status: 202, headers: CORS });
  return json(Array.isArray(body) ? out : out[0]);
}

// ── REST router ───────────────────────────────────────────────────────────

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const at = parts.indexOf('lg-agent');
  const path = parts.slice(at + 1);

  if (path[0] === 'docs' || (req.method === 'GET' && path.length === 0 && !req.headers.get('authorization') && !req.headers.get('x-api-key'))) {
    return new Response(AGENT_GUIDE, { headers: { 'Content-Type': 'text/markdown; charset=utf-8', ...CORS } });
  }

  if (path[0] === 'push') {
    try {
      return await handlePush(req, path[1] || '');
    } catch (e: any) {
      console.error(e);
      return json({ error: String(e?.message || e) }, 500);
    }
  }

  const userId = await userFromAgentKey(req);
  if (!userId) return json({ error: { code: 'unauthorized', message: 'Send an agent key: Authorization: Bearer lg_… (create one in the app under Settings → Agent access).' } }, 401);

  try {
    if (path[0] === 'mcp') return await handleMcp(req, userId);

    const body = ['POST', 'PATCH'].includes(req.method) ? await req.json().catch(() => ({})) : {};
    const [res, id, verb] = path;
    const m = req.method;

    if (m === 'GET' && !res) return json(await ops.get_status(userId));
    if (res === 'status' && m === 'GET') return json(await ops.get_status(userId));
    if (res === 'quests') {
      if (m === 'GET' && !id) return json(await ops.list_quests(userId));
      if (m === 'POST' && !id) return json(await ops.add_quests(userId, body), 201);
      if (m === 'PATCH' && id) return json(await ops.update_quest(userId, { ...body, id }));
      if (m === 'DELETE' && id) return json(await ops.delete_quest(userId, { id }));
      if (m === 'POST' && id && verb) {
        const map: Record<string, keyof typeof ops> = { complete: 'complete_quest', fail: 'fail_quest', abandon: 'abandon_quest', start: 'start_quest' };
        if (map[verb]) return json(await (ops[map[verb]] as any)(userId, { ...body, id }));
      }
    }
    if (res === 'deeds' && m === 'POST') return json(await ops.log_deeds(userId, body), 201);
    if (res === 'history') {
      if (m === 'GET' && !id) return json(await ops.list_history(userId, Object.fromEntries(url.searchParams)));
      if (m === 'POST' && id && verb === 'undo') return json(await ops.undo_entry(userId, { id }));
    }
    if (res === 'rewards') {
      if (m === 'GET') return json(await ops.list_rewards(userId));
      if (m === 'POST') return json(await ops.add_reward(userId, body), 201);
      if (m === 'PATCH' && id) return json(await ops.run_actions(userId, { actions: [{ type: 'UPDATE_REWARD', payload: { ...body, id } }] }));
      if (m === 'DELETE' && id) return json(await ops.run_actions(userId, { actions: [{ type: 'DELETE_REWARD', payload: { id } }] }));
    }
    if (res === 'actions' && m === 'POST') return json(await ops.run_actions(userId, body));
    if (res === 'state' && m === 'GET') return json((await loadJournal(userId)).state);

    return json({ error: { code: 'not_found', message: `No route ${m} /${path.join('/')}. See GET /docs.` } }, 404);
  } catch (e: any) {
    if (e instanceof EngineError) {
      const status = e.code.endsWith('not_found') ? 404 : e.code === 'conflict' ? 409 : 400;
      return json({ error: { code: e.code, message: e.message } }, status);
    }
    console.error(e);
    return json({ error: { code: 'server_error', message: String(e?.message || e) } }, 500);
  }
});
