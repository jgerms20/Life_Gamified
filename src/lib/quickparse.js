import { addDays, normalizeCategory, DIFFICULTY_ORDER } from './engine';

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Parse a one-line quest: "Run 5k #health !hard @tomorrow *daily".
 *   #category  !difficulty (or !1–!5)  @today/@tomorrow/@fri/@+3/@2026-10-20  *daily/*weekly/*monthly
 */
export function parseQuick(text, today) {
  const out = { title: '', tokens: [] };
  const words = [];
  for (const raw of text.split(/\s+/)) {
    if (!raw) continue;
    const w = raw.toLowerCase();
    if (w.length > 1 && w[0] === '#') {
      try { out.category = normalizeCategory(w.slice(1)); out.tokens.push(raw); continue; } catch { /* keep as text */ }
    }
    if (w.length > 1 && w[0] === '!') {
      const v = w.slice(1);
      const d = /^\d$/.test(v) ? DIFFICULTY_ORDER[Math.min(5, Number(v))] : DIFFICULTY_ORDER.find(x => x.startsWith(v));
      if (d) { out.difficulty = d; out.tokens.push(raw); continue; }
    }
    if (w.length > 1 && w[0] === '@') {
      const v = w.slice(1);
      let due = null;
      if (v === 'today' || v === 'tod') due = today;
      else if (v === 'tomorrow' || v === 'tmr' || v === 'tom') due = addDays(today, 1);
      else if (/^\+\d+$/.test(v)) due = addDays(today, Number(v.slice(1)));
      else if (/^\d{4}-\d{2}-\d{2}$/.test(v)) due = v;
      else {
        const i = DAYS.findIndex(d => v.startsWith(d));
        if (i >= 0) {
          const now = new Date(`${today}T12:00:00Z`).getUTCDay();
          due = addDays(today, ((i - now + 7) % 7) || 7);
        }
      }
      if (due) { out.dueDate = due; out.tokens.push(raw); continue; }
    }
    if (w[0] === '*' && ['daily', 'weekly', 'monthly'].includes(w.slice(1))) {
      out.recurrence = w.slice(1);
      out.tokens.push(raw);
      continue;
    }
    words.push(raw);
  }
  out.title = words.join(' ').trim();
  return out;
}
