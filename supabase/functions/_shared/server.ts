// Server-side helpers shared by the Life Gamified Edge Functions.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { applyAction, createInitialState, migrate, EngineError } from './engine.js';

const secretKey = (() => {
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
    if (keys.default) return keys.default as string;
  } catch { /* fall through */ }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
})();

export const admin = createClient(Deno.env.get('SUPABASE_URL')!, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const APP_URL = 'https://jgerms20.github.io/Life_Gamified/';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, apikey, content-type, mcp-session-id, mcp-protocol-version, x-cron-secret',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...extra },
  });
}

export async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}

export async function config(key: string): Promise<string | null> {
  const { data } = await admin.from('lg_config').select('value').eq('key', key).maybeSingle();
  return data?.value ?? null;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export async function userFromAgentKey(req: Request): Promise<string | null> {
  const header = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const key = header.trim();
  if (!key.startsWith('lg_')) return null;
  const hash = await sha256Hex(key);
  const { data } = await admin.from('lg_agent_keys').select('id, user_id').eq('key_hash', hash).is('revoked_at', null).maybeSingle();
  if (!data) return null;
  admin.from('lg_agent_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id).then(() => {});
  return data.user_id as string;
}

export async function userFromJwt(req: Request): Promise<string | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data.user?.id ?? null;
}

// ── Journal load / save with optimistic concurrency ──────────────────────

export async function loadJournal(userId: string) {
  const { data, error } = await admin.from('lg_journals').select('state, version').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return { state: createInitialState({ now: Date.now() }), version: 0 };
  return { state: migrate(data.state, { now: Date.now() }), version: data.version as number };
}

type Action = { type: string; payload?: Record<string, unknown> };

/**
 * Apply actions atomically (all succeed or none are saved), retrying if
 * the journal changed underneath us (e.g. you tapped something in the app).
 */
export async function mutate(userId: string, actions: Action[], actor: 'agent' | 'human' | 'system' = 'agent') {
  for (let attempt = 0; attempt < 6; attempt++) {
    const { state: start, version } = await loadJournal(userId);
    let state = start;
    const events: any[] = [];
    const results: any[] = [];
    for (const action of actions) {
      const r = applyAction(state, action, { actor });
      state = r.state;
      events.push(...r.events);
      results.push(r.result);
    }
    let ok = false;
    if (version === 0) {
      const { error } = await admin.from('lg_journals').insert({ user_id: userId, state, version: 1, updated_by: actor });
      ok = !error;
    } else {
      const { data, error } = await admin.from('lg_journals')
        .update({ state, version: version + 1, updated_by: actor })
        .eq('user_id', userId).eq('version', version).select('version');
      ok = !error && (data?.length ?? 0) === 1;
    }
    if (ok) return { state, events, results, version: version === 0 ? 1 : version + 1 };
    await new Promise(r => setTimeout(r, 80 * (attempt + 1)));
  }
  throw new EngineError('conflict', 'The journal is busy; please retry.');
}

// ── Web push ──────────────────────────────────────────────────────────────

let vapidReady: Promise<{ publicKey: string }> | null = null;

export function vapid() {
  if (!vapidReady) {
    vapidReady = (async () => {
      let pub = await config('vapid_public');
      let priv = await config('vapid_private');
      if (!pub || !priv) {
        const keys = webpush.generateVAPIDKeys();
        await admin.from('lg_config').upsert([
          { key: 'vapid_public', value: keys.publicKey },
          { key: 'vapid_private', value: keys.privateKey },
        ], { onConflict: 'key', ignoreDuplicates: true });
        pub = await config('vapid_public');
        priv = await config('vapid_private');
      }
      webpush.setVapidDetails(APP_URL, pub!, priv!);
      return { publicKey: pub! };
    })();
  }
  return vapidReady;
}

export type PushMessage = { title: string; body: string; tag?: string; url?: string };

export async function pushToUser(userId: string, msg: PushMessage) {
  await vapid();
  const { data: subs } = await admin.from('lg_push_subscriptions').select('*').eq('user_id', userId);
  let sent = 0;
  for (const sub of subs || []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ ...msg, url: msg.url || APP_URL }),
        { TTL: 60 * 60 * 12, urgency: 'normal' },
      );
      sent++;
      await admin.from('lg_push_subscriptions').update({ last_success_at: new Date().toISOString(), failures: 0 }).eq('id', sub.id);
    } catch (e: any) {
      const gone = e?.statusCode === 404 || e?.statusCode === 410;
      if (gone || sub.failures >= 5) await admin.from('lg_push_subscriptions').delete().eq('id', sub.id);
      else await admin.from('lg_push_subscriptions').update({ failures: sub.failures + 1 }).eq('id', sub.id);
      console.warn('push failed', e?.statusCode, e?.body || e?.message);
    }
  }
  return sent;
}

/** Turn the events from an agent's write into one tidy notification. */
export function messageForEvents(events: any[]): PushMessage | null {
  const done = events.filter(e => e.type === 'quest_completed');
  const levels = events.filter(e => e.type === 'level_up');
  const loot = events.filter(e => e.type === 'chest' && e.loot?.outcome === 'reward');
  const trophies = events.filter(e => e.type === 'achievement');
  if (!done.length && !levels.length && !loot.length && !trophies.length) return null;

  const xp = done.reduce((a, e) => a + (e.xp || 0), 0);
  const lines: string[] = [];
  if (done.length === 1) lines.push(`✓ ${done[0].title} · +${xp} XP`);
  else if (done.length > 1) lines.push(`✓ ${done.length} deeds recorded · +${xp} XP`);
  for (const l of loot) lines.push(`🎁 ${cap(l.loot.tier)} loot: ${l.loot.name}`);
  for (const t of trophies) lines.push(`🏆 Trophy: ${t.name}`);

  let title = '🪶 Your scribe updated the journal';
  if (levels.length) title = `✨ Level ${levels[levels.length - 1].level}!`;
  else if (loot.length) title = '🎁 A chest awaits you';
  return { title, body: lines.join('\n') || 'Open your journal to see what changed.', tag: 'agent-activity' };
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
