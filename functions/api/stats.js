import { json, istDate, kvGet, SIGNS, isSign } from '../_lib/util.js';

// GET /api/stats           -> community leaderboard (all 12 signs, all-time) + today snapshot
// GET /api/stats?sign=virgo -> the above plus that sign's per-statement tally for today
//
// "Accuracy" here = % of verdicts that were 👍 (the stars got it right about real life).
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sign = String(url.searchParams.get('sign') || '').toLowerCase();
  const date = istDate();

  const leaderboard = [];
  for (const s of SIGNS) {
    const all = await kvGet(env.BASH_KV, `agg:all:${s.id}`);
    const t = totals(all);
    leaderboard.push({
      sign: s.id, name: s.name, symbol: s.symbol,
      up: t.up, down: t.down, total: t.total,
      accuracy: t.total ? Math.round((t.up / t.total) * 100) : null,
      bashers: all ? all.bashers || 0 : 0,
    });
  }
  const ranked = leaderboard.filter(x => x.total > 0).sort((a, b) => b.accuracy - a.accuracy);
  const mostAccurate = ranked[0] || null;
  const mostBs = ranked.length ? ranked[ranked.length - 1] : null;
  const grand = leaderboard.reduce((a, x) => ({ up: a.up + x.up, down: a.down + x.down, bashers: a.bashers + x.bashers }), { up: 0, down: 0, bashers: 0 });
  const grandTotal = grand.up + grand.down;

  const out = {
    date,
    leaderboard,
    mostAccurate, mostBs,
    global: {
      verdicts: grandTotal,
      accuracy: grandTotal ? Math.round((grand.up / grandTotal) * 100) : null,
      bashers: grand.bashers,
    },
  };

  if (isSign(sign)) {
    const dayAgg = await kvGet(env.BASH_KV, `agg:${date}:${sign}`);
    out.signToday = {
      sign,
      bashers: dayAgg ? dayAgg.bashers || 0 : 0,
      statements: dayAgg ? dayAgg.statements : [],
    };
  }

  return json(out);
}

function totals(agg) {
  if (!agg || !Array.isArray(agg.statements)) return { up: 0, down: 0, total: 0 };
  let up = 0, down = 0;
  for (const s of agg.statements) { up += s.up || 0; down += s.down || 0; }
  return { up, down, total: up + down };
}
