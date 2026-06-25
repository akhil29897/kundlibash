import { json, istDate, kvGet, kvPut, signMeta, tallyFromItems, applyDelta } from '../_lib/util.js';

// GET /api/me  -> this visitor's bashes, derived accuracy/other notes, and personal stats.
export async function onRequestGet({ env, data }) {
  const uid = data.uid;
  const prefix = `bash:${uid}:`;

  // gather this user's bash records (KV list -> get)
  const records = [];
  let cursor;
  do {
    const page = await env.BASH_KV.list({ prefix, cursor, limit: 1000 });
    for (const k of page.keys) {
      const r = await kvGet(env.BASH_KV, k.name);
      if (r) records.push(r);
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);

  records.sort((a, b) => (b.ts || 0) - (a.ts || 0));

  // ---- derive notes ----
  const accuracyNotes = []; // per-statement notes tied to a verdict
  const otherNotes = [];
  let up = 0, down = 0;
  const bySign = {};
  const days = new Set();

  for (const r of records) {
    days.add(r.date);
    bySign[r.sign] = bySign[r.sign] || { up: 0, down: 0 };
    for (const it of r.items || []) {
      if (it.verdict === 'up') { up++; bySign[r.sign].up++; }
      else if (it.verdict === 'down') { down++; bySign[r.sign].down++; }
      if (it.note) {
        accuracyNotes.push({ date: r.date, sign: r.sign, verdict: it.verdict, text: it.text, note: it.note, ts: r.ts });
      }
    }
    if (r.otherNote) otherNotes.push({ date: r.date, sign: r.sign, note: r.otherNote, ts: r.ts });
  }

  const totalVerdicts = up + down;
  const accuracy = totalVerdicts ? Math.round((up / totalVerdicts) * 100) : null;

  // streak: consecutive days (ending today or yesterday) with at least one bash
  const streak = computeStreak(days);

  // favourite sign = the one they bash most
  let favSign = null, favN = -1;
  for (const [s, t] of Object.entries(bySign)) {
    const n = t.up + t.down;
    if (n > favN) { favN = n; favSign = s; }
  }

  return json({
    stats: {
      totalVerdicts, up, down, accuracy,
      daysBashed: days.size,
      streak,
      predictionsBashed: records.reduce((a, r) => a + (r.items || []).filter(i => i.verdict).length, 0),
      accuracyNotes: accuracyNotes.length,
      otherNotes: otherNotes.length,
      favSign, favSignMeta: favSign ? signMeta(favSign) : null,
      bySign,
    },
    bashes: records.slice(0, 120),
    accuracyNotes,
    otherNotes,
    today: istDate(),
  });
}

// DELETE /api/me  -> the "danger zone": forget this visitor entirely.
// Removes their bash records AND subtracts their contribution from the community tallies.
export async function onRequestDelete({ env, data }) {
  const uid = data.uid;
  const prefix = `bash:${uid}:`;
  let removed = 0, cursor;
  do {
    const page = await env.BASH_KV.list({ prefix, cursor, limit: 1000 });
    for (const k of page.keys) {
      const r = await kvGet(env.BASH_KV, k.name);
      if (r && Array.isArray(r.items)) {
        const count = r.items.length || (r.items.reduce((m, it) => Math.max(m, it.i + 1), 0));
        const oldT = tallyFromItems(r.items, count);
        for (const aggKey of [`agg:${r.date}:${r.sign}`, `agg:all:${r.sign}`]) {
          const agg = await kvGet(env.BASH_KV, aggKey);
          if (agg) {
            applyDelta(agg, oldT, [], count);
            agg.bashers = Math.max(0, (agg.bashers || 0) - 1);
            await kvPut(env.BASH_KV, aggKey, agg);
          }
        }
      }
      await env.BASH_KV.delete(k.name);
      removed++;
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return json({ ok: true, removed });
}

function computeStreak(daySet) {
  if (!daySet.size) return 0;
  const has = (ymd) => daySet.has(ymd);
  const shift = (ymd, n) => {
    const d = new Date(ymd + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const today = istDate();
  let cur = has(today) ? today : (has(shift(today, -1)) ? shift(today, -1) : null);
  if (!cur) return 0;
  let n = 0;
  while (has(cur)) { n++; cur = shift(cur, -1); }
  return n;
}
