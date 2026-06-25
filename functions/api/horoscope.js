import { json, bad, isSign, istDate, prettyDate, signMeta, kvGet, kvPut, buildPredictions } from '../_lib/util.js';

// GET /api/horoscope?sign=virgo
// Returns today's prediction statements for a sign. Fetched from the astrology API ONCE per
// day and cached in KV, so every visitor bashes the exact same "today's Virgo" (this is what
// makes the community accuracy stats meaningful).
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sign = String(url.searchParams.get('sign') || '').toLowerCase();
  if (!isSign(sign)) return bad('unknown sign');

  const date = istDate();
  const key = `pred:${date}:${sign}`;

  let pred = await kvGet(env.BASH_KV, key);
  if (!pred || !Array.isArray(pred.statements) || pred.statements.length < 3) {
    pred = await buildPredictions(sign, date);
    // keep a few days so stale predictions self-clear
    await kvPut(env.BASH_KV, key, pred, { expirationTtl: 60 * 60 * 24 * 5 });
  }

  return json({
    ...pred,
    meta: signMeta(sign),
    prettyDate: prettyDate(date),
  });
}
