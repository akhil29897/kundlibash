import {
  json, bad, isSign, istDate, kvGet, kvPut,
  tallyFromItems, applyDelta,
} from '../_lib/util.js';

const NOTE_MAX = 1200;
const clip = (s) => String(s == null ? '' : s).slice(0, NOTE_MAX).trim();

// POST /api/bash
// body: { sign, items:[{ i:Int, verdict:'up'|'down'|null, note:String }], otherNote:String }
// Records this user's verdicts + notes for today's sign, and folds them into the community tally.
// Re-submitting for the same day overwrites cleanly (the old contribution is subtracted first).
export async function onRequestPost({ request, env, data }) {
  const uid = data.uid;
  if (!uid) return bad('no identity', 401);

  let body;
  try { body = await request.json(); } catch { return bad('bad json'); }
  const sign = String(body.sign || '').toLowerCase();
  if (!isSign(sign)) return bad('unknown sign');

  const date = istDate();
  const pred = await kvGet(env.BASH_KV, `pred:${date}:${sign}`);
  if (!pred || !Array.isArray(pred.statements)) return bad('no predictions for today yet — load the horoscope first', 409);
  const count = pred.statements.length;

  // sanitize incoming items against the real statement list
  const seen = new Set();
  const items = [];
  for (const raw of Array.isArray(body.items) ? body.items : []) {
    const i = Number(raw.i);
    if (!Number.isInteger(i) || i < 0 || i >= count || seen.has(i)) continue;
    seen.add(i);
    const verdict = raw.verdict === 'up' ? 'up' : raw.verdict === 'down' ? 'down' : null;
    items.push({ i, verdict, note: clip(raw.note), text: pred.statements[i].text });
  }
  const otherNote = clip(body.otherNote);
  if (!items.some(it => it.verdict) && !otherNote) return bad('nothing to record');

  const recKey = `bash:${uid}:${date}:${sign}`;
  const prev = await kvGet(env.BASH_KV, recKey);

  // ---- update community aggregates (today + all-time) with a clean delta ----
  const oldT = tallyFromItems(prev ? prev.items : [], count);
  const newT = tallyFromItems(items, count);

  const dayKey = `agg:${date}:${sign}`;
  const allKey = `agg:all:${sign}`;
  let dayAgg = await kvGet(env.BASH_KV, dayKey);
  let allAgg = await kvGet(env.BASH_KV, allKey);
  const firstTime = !prev;
  dayAgg = applyDelta(dayAgg, oldT, newT, count);
  allAgg = applyDelta(allAgg, oldT, newT, count);
  if (firstTime) { dayAgg.bashers += 1; allAgg.bashers += 1; }
  const now = Date.now();
  dayAgg.lastTs = now; allAgg.lastTs = now;

  const rec = {
    uid, sign, date, ts: now,
    items: items.map(({ i, verdict, note, text }) => ({ i, verdict, note, text })),
    otherNote,
  };

  await Promise.all([
    kvPut(env.BASH_KV, recKey, rec, { expirationTtl: 60 * 60 * 24 * 400 }),
    kvPut(env.BASH_KV, dayKey, dayAgg, { expirationTtl: 60 * 60 * 24 * 120 }),
    kvPut(env.BASH_KV, allKey, allAgg),
  ]);

  return json({ ok: true, record: rec, today: dayAgg, count });
}
