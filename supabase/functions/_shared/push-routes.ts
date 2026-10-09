// Push notification routes (mounted under /lg-agent/push):
//   GET  /push         → { publicKey } — the VAPID key browsers subscribe with
//   POST /push/test    → test notification to the signed-in user (Supabase JWT)
//   POST /push/cron    → hourly sweep: morning digest + streak guard
//                        (called by pg_cron with an x-cron-secret header)
import { computeStreak, dayKey, hourIn, migrate, summarize } from './engine.js';
import { admin, config, json, pushToUser, userFromJwt, vapid } from './server.ts';

async function alreadySent(userId: string, kind: string, day: string) {
  const { error } = await admin.from('lg_notifications_sent').insert({ user_id: userId, kind, day });
  return !!error; // primary-key clash → this one already went out
}

async function sweep(now = Date.now()) {
  const { data: subs } = await admin.from('lg_push_subscriptions').select('user_id');
  const users = [...new Set((subs || []).map(s => s.user_id))];
  const report: any[] = [];
  for (const userId of users) {
    const { data } = await admin.from('lg_journals').select('state').eq('user_id', userId).maybeSingle();
    if (!data) continue;
    const state = migrate(data.state, { now });
    if (!state.character) continue;
    const tz = state.settings.timeZone;
    const prefs = state.settings.notifications || {};
    const hour = hourIn(now, tz);
    const today = dayKey(now, tz);
    const sum: any = summarize(state, { now });

    if (prefs.digest !== false && hour === Number(prefs.digestHour ?? 8)) {
      const due = sum.quests.active.filter((q: any) => q.dueDate === today);
      const overdue = sum.quests.active.filter((q: any) => q.dueDate && q.dueDate < today);
      if (sum.quests.active.length && !(await alreadySent(userId, 'digest', today))) {
        const titles = [...overdue, ...due].slice(0, 3).map((q: any) => q.title);
        const parts = [];
        if (due.length) parts.push(`${due.length} due today`);
        if (overdue.length) parts.push(`${overdue.length} overdue`);
        if (!parts.length) parts.push(`${sum.quests.active.length} quests on the board`);
        const streak = computeStreak(state.stats.dailyLog, today);
        await pushToUser(userId, {
          title: `☀️ Good morning, ${state.character.name}`,
          body: `${parts.join(' · ')}${streak ? ` · 🔥 ${streak}-day streak` : ''}${titles.length ? `\n${titles.map(t => `• ${t}`).join('\n')}` : ''}`,
          tag: 'digest',
        });
        report.push({ userId, sent: 'digest' });
      }
    }

    if (prefs.streakGuard !== false && hour === Number(prefs.streakHour ?? 20)) {
      const streak = sum.streak.current;
      if (streak > 0 && !sum.streak.doneToday && !(await alreadySent(userId, 'streak', today))) {
        await pushToUser(userId, {
          title: `🔥 Your ${streak}-day streak fades at midnight`,
          body: 'One small deed keeps the flame alive. Even a trivial quest counts.',
          tag: 'streak',
        });
        report.push({ userId, sent: 'streak' });
      }
    }
  }
  return report;
}

export async function handlePush(req: Request, action: string) {
  if (req.method === 'GET' && !action) {
    const { publicKey } = await vapid();
    return json({ publicKey });
  }
  if (req.method === 'POST' && action === 'test') {
    const userId = await userFromJwt(req);
    if (!userId) return json({ error: 'Sign in first' }, 401);
    const sent = await pushToUser(userId, {
      title: '🕯️ The candle is lit',
      body: 'Notifications are working. Your scribe can now reach you.',
      tag: 'test',
    });
    return json({ sent });
  }
  if (req.method === 'POST' && action === 'cron') {
    const secret = await config('cron_secret');
    if (!secret || req.headers.get('x-cron-secret') !== secret) return json({ error: 'forbidden' }, 403);
    return json({ ok: true, report: await sweep() });
  }
  return json({ error: 'not found' }, 404);
}
