/* Bash Your Horoscope — shared helpers for Cloudflare Pages Functions.
   Storage: one KV namespace (BASH_KV). Identity: anonymous byh_uid cookie set by _middleware.
   No secrets, no third-party libs. */

export const SIGNS = [
  { id: 'aries',       name: 'Aries',       symbol: '♈', dates: 'Mar 21 – Apr 19', element: 'fire'  },
  { id: 'taurus',      name: 'Taurus',      symbol: '♉', dates: 'Apr 20 – May 20', element: 'earth' },
  { id: 'gemini',      name: 'Gemini',      symbol: '♊', dates: 'May 21 – Jun 20', element: 'air'   },
  { id: 'cancer',      name: 'Cancer',      symbol: '♋', dates: 'Jun 21 – Jul 22', element: 'water' },
  { id: 'leo',         name: 'Leo',         symbol: '♌', dates: 'Jul 23 – Aug 22', element: 'fire'  },
  { id: 'virgo',       name: 'Virgo',       symbol: '♍', dates: 'Aug 23 – Sep 22', element: 'earth' },
  { id: 'libra',       name: 'Libra',       symbol: '♎', dates: 'Sep 23 – Oct 22', element: 'air'   },
  { id: 'scorpio',     name: 'Scorpio',     symbol: '♏', dates: 'Oct 23 – Nov 21', element: 'water' },
  { id: 'sagittarius', name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 – Dec 21', element: 'fire'  },
  { id: 'capricorn',   name: 'Capricorn',   symbol: '♑', dates: 'Dec 22 – Jan 19', element: 'earth' },
  { id: 'aquarius',    name: 'Aquarius',    symbol: '♒', dates: 'Jan 20 – Feb 18', element: 'air'   },
  { id: 'pisces',      name: 'Pisces',      symbol: '♓', dates: 'Feb 19 – Mar 20', element: 'water' },
];

export const SIGN_IDS = SIGNS.map(s => s.id);
export function signMeta(id) { return SIGNS.find(s => s.id === id) || null; }
export function isSign(id) { return SIGN_IDS.includes(String(id || '').toLowerCase()); }
export function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

/* ---- responses ---- */
export function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });
}
export function bad(msg, status = 400) { return json({ error: msg }, status); }

/* ---- cookies ---- */
export function getCookie(req, name) {
  const h = req.headers.get('Cookie') || '';
  const m = h.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}
export function uidCookie(value) {
  // ~13 months; HttpOnly so the raw id never leaves the server. All personal data is fetched via /api/me.
  return `byh_uid=${encodeURIComponent(value)}; Path=/; Max-Age=${60 * 60 * 24 * 400}; SameSite=Lax; Secure; HttpOnly`;
}

/* ---- dates (canonical day = Asia/Kolkata, so "today's Virgo" is one shared prediction) ---- */
export function istDate(d = new Date()) {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10); // YYYY-MM-DD
}
export function prettyDate(ymd) {
  try {
    const [y, m, day] = ymd.split('-').map(Number);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const ord = day + (([11,12,13].includes(day)) ? 'th' : ({1:'st',2:'nd',3:'rd'}[day % 10] || 'th'));
    return `${ord} ${months[m - 1]} ${y}`;
  } catch { return ymd; }
}

/* ---- KV json helpers ---- */
export async function kvGet(kv, key) {
  const v = await kv.get(key);
  if (!v) return null;
  try { return JSON.parse(v); } catch { return null; }
}
export async function kvPut(kv, key, obj, opts) { await kv.put(key, JSON.stringify(obj), opts); }

/* ---- deterministic seeded helpers (for fallback predictions) ---- */
export function seedHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function seededPick(arr, seed, n) {
  // deterministic, no-repeat pick of n items
  const pool = arr.slice();
  const out = [];
  let s = seed >>> 0;
  while (out.length < n && pool.length) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    out.push(pool.splice(s % pool.length, 1)[0]);
  }
  return out;
}

/* ---- sentence splitter: turn a horoscope paragraph into bashable statements ---- */
export function splitStatements(text, max = 5) {
  if (!text) return [];
  const t = String(text).replace(/\s+/g, ' ').replace(/’/g, "'").trim();
  let parts = t.match(/[^.!?]+[.!?]+(\s|$)/g) || [t];
  parts = parts.map(s => s.trim()).filter(Boolean);
  // merge sentences shorter than ~6 words into the previous one so each statement is substantial
  const merged = [];
  for (const p of parts) {
    const words = p.split(' ').length;
    if (merged.length && words < 6) merged[merged.length - 1] += ' ' + p;
    else merged.push(p);
  }
  return merged.filter(s => s.length > 14).slice(0, max);
}

/* ---- fallback bank (only used if BOTH astrology APIs fail) ---- */
const FALLBACK = [
  "A small risk today pays off bigger than it has any right to.",
  "Someone you've been ignoring is about to become important.",
  "Money matters sort themselves out, but not the way you planned.",
  "Your gut is right. The spreadsheet is wrong. Trust the gut.",
  "A conversation you've been dreading turns out fine, even warm.",
  "Stop refreshing that one chat. It will not change your stars.",
  "Today rewards the bold and quietly punishes the over-prepared.",
  "An old song comes back to you and so does an old feeling.",
  "Say yes to the plan you'd normally talk yourself out of.",
  "You'll be tempted to fix something that isn't actually broken.",
  "The universe suggests water, sleep, and minding your own business.",
  "Good news arrives sideways, from a person you underestimated.",
  "Your patience is tested before noon. You pass, barely.",
  "Let someone else be in charge today. Yes, really.",
  "A tiny act of courage rearranges your whole afternoon.",
  "Don't send the long message. The short one lands better.",
];
export function fallbackStatements(sign, date, n = 4) {
  return seededPick(FALLBACK, seedHash(sign + '|' + date), n);
}

/* ---- fetch today's horoscope text from the astrology APIs (server-side, with timeout) ---- */
async function fetchWithTimeout(url, ms = 6000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'accept': 'application/json' } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
  finally { clearTimeout(t); }
}

export async function fetchHoroscopeText(sign) {
  // primary: freehoroscopeapi.com  ->  { data: { horoscope } }
  const a = await fetchWithTimeout(
    `https://freehoroscopeapi.com/api/v1/get-horoscope/daily?sign=${cap(sign)}&day=TODAY`);
  const aTxt = a && a.data && a.data.horoscope;
  if (aTxt && String(aTxt).length > 40) return { text: String(aTxt), source: 'freehoroscopeapi' };

  // fallback: ohmanda.com  ->  { horoscope }
  const b = await fetchWithTimeout(`https://ohmanda.com/api/horoscope/${encodeURIComponent(sign)}/`);
  const bTxt = b && b.horoscope;
  if (bTxt && String(bTxt).length > 40) return { text: String(bTxt), source: 'ohmanda' };

  return null;
}

/* Build (and the caller caches) the day's prediction object for a sign. */
export async function buildPredictions(sign, date) {
  const fetched = await fetchHoroscopeText(sign);
  let statements, source;
  if (fetched) {
    statements = splitStatements(fetched.text, 5);
    source = fetched.source;
  }
  if (!statements || statements.length < 3) {
    const need = 4 - (statements ? statements.length : 0);
    const fill = fallbackStatements(sign, date, Math.max(need, 4 - (statements?.length || 0)));
    statements = (statements || []).concat(fill).slice(0, Math.max(4, (statements?.length || 0)));
    source = fetched ? source + '+bank' : 'bank';
  }
  return {
    date, sign, source,
    statements: statements.map((text, i) => ({ id: 's' + i, text })),
    fetchedAt: new Date().toISOString(),
  };
}

/* ---- aggregate tally helpers ---- */
export function blankAgg(count) {
  return { bashers: 0, statements: Array.from({ length: count }, () => ({ up: 0, down: 0 })), lastTs: 0 };
}
export function tallyFromItems(items, count) {
  const t = Array.from({ length: count }, () => ({ up: 0, down: 0 }));
  for (const it of items || []) {
    if (it.i == null || it.i < 0 || it.i >= count) continue;
    if (it.verdict === 'up') t[it.i].up++;
    else if (it.verdict === 'down') t[it.i].down++;
  }
  return t;
}
export function applyDelta(agg, oldT, newT, count) {
  if (!agg) agg = blankAgg(count);
  while (agg.statements.length < count) agg.statements.push({ up: 0, down: 0 });
  for (let i = 0; i < count; i++) {
    const o = oldT[i] || { up: 0, down: 0 }, n = newT[i] || { up: 0, down: 0 };
    agg.statements[i].up = Math.max(0, agg.statements[i].up + (n.up - o.up));
    agg.statements[i].down = Math.max(0, agg.statements[i].down + (n.down - o.down));
  }
  return agg;
}
