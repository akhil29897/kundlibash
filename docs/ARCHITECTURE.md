# Architecture

Kundlibash is a **Cloudflare Pages** site: a static front end plus **Pages Functions** (serverless) and **one KV namespace**. No framework, no build step, no database server, no login.

```
 Browser
   │  GET /                      ── static: public/index.html (single-file SPA)
   │  GET /api/horoscope?sign=   ─┐
   │  POST /api/bash             ─┤   Pages Functions (functions/)
   │  GET  /api/me  · DELETE      ─┤      ├─ _middleware.js   anonymous byh_uid cookie
   │  GET  /api/stats            ─┘      ├─ api/*.js          handlers
   │                                     └─ _lib/util.js      shared helpers
   ▼
 Cloudflare edge ── KV: BASH_KV ──  predictions cache · per-user bashes · community tallies
                          │
                          └─ (cold path) fetch() → public astrology API  (cached per sign+day)
```

## Pieces

### Front end — `public/index.html`
A single self-contained file: HTML + CSS + vanilla JS, no dependencies (fonts from Google Fonts). It's a small SPA with three views — **The Reading** (bash), **Almanac** (notes), **Reckoning** (stats) — switched client-side. All state lives in one `state` object; the server is the source of truth, reached through four endpoints. User-supplied and third-party text is HTML-escaped before rendering.

### Identity — `functions/_middleware.js`
Runs on every request. If the visitor has no `byh_uid` cookie, it mints one (`crypto.randomUUID()`) and sets it `HttpOnly; Secure; SameSite=Lax; Max-Age≈400d`. Downstream functions read `context.data.uid`. No login, no PII — the cookie *is* the account. Because it's `HttpOnly`, the raw id never reaches client JS; all personal data is fetched server-side via `/api/me`.

### Prediction pipeline — `_lib/util.js : buildPredictions()`
1. Canonical day = **Asia/Kolkata** date (`istDate()`), so "today's Virgo" is one shared thing worldwide.
2. `fetchHoroscopeText(sign)` calls the primary API, then a fallback, with a 6s timeout each:
   - primary: `freehoroscopeapi.com/api/v1/get-horoscope/daily` → `{data:{horoscope}}`
   - fallback: `ohmanda.com/api/horoscope/<sign>/` → `{horoscope}`
3. `splitStatements()` turns the paragraph into 3–5 discrete **lines** (sentence split, short fragments merged).
4. If both APIs fail or yield too few lines, a deterministic **fallback bank** (seeded by sign+date) fills in, so the page is never blank.
5. The result is cached in KV at `pred:<date>:<sign>` (TTL ~5 days). Every visitor that day gets the **identical** cached lines — the precondition for meaningful community stats.

### The bash — `api/bash.js`
On submit the handler:
1. Loads today's `pred:` to know the line count and snapshot the line text.
2. Sanitises incoming `items` against the real lines (clamps indices, dedups, caps note length at 1200 chars, normalises verdict to `up|down|null`).
3. Reads the user's previous record for the day (if any) to compute a **clean delta**.
4. Updates two community tallies — `agg:<date>:<sign>` and `agg:all:<sign>` — by subtracting the old contribution and adding the new (so re-submitting never double-counts). Increments `bashers` only on first submit for that day+sign.
5. Writes the user's record `bash:<uid>:<date>:<sign>`.

### Stats — `api/me.js` and `api/stats.js`
- **Personal** (`/api/me`): `KV.list({prefix:"bash:<uid>:"})` → fetch each → derive accuracy %, up/down, streak (consecutive IST days), days kept, per-sign split, and the two note ledgers.
- **Community** (`/api/stats`): read `agg:all:<sign>` for all 12 signs → leaderboard ranked by candour (% true); `mostAccurate` / `mostBs`; global totals. With `?sign=` it also returns that sign's per-line tally for today from `agg:<date>:<sign>`.

## Data model (KV: `BASH_KV`)

| Key | Value | Notes |
|---|---|---|
| `pred:<date>:<sign>` | `{date, sign, source, statements:[{id,text}], fetchedAt}` | day's cached lines · TTL ~5d |
| `bash:<uid>:<date>:<sign>` | `{uid, sign, date, ts, items:[{i,verdict,note,text}], otherNote}` | one user's verdicts + notes · TTL ~400d |
| `agg:<date>:<sign>` | `{bashers, statements:[{up,down}], lastTs}` | community tally for a day · TTL ~120d |
| `agg:all:<sign>` | `{bashers, statements:[{up,down}], lastTs}` | community all-time tally |

`date` is `YYYY-MM-DD` in IST. `verdict`: `up` = rang true, `down` = rang hollow.

## Design decisions & trade-offs
- **KV, not D1.** The access pattern is key-by-id reads/writes and small per-user lists — KV's sweet spot, and it matches the rest of Akhil's Cloudflare sites. The cost: aggregate counters use **read-modify-write**, which is eventually consistent and could lose a vote under heavy *simultaneous* writes to the same sign. Fine at this scale; if traffic ever demands exact concurrent counters, move `agg:*` to a **Durable Object** or D1 with atomic increments. The per-user records (the source of truth) are unaffected.
- **Shared daily prediction.** Caching one reading per sign per day is what makes the community scoreboard honest — otherwise two people would grade different Virgo readings.
- **External API dependency.** Free astrology APIs can be slow or flaky; the two-tier fallback + deterministic bank means the reading always renders. Sources are labelled in the UI (`drawn from …`).
- **Privacy by default.** Anonymous cookie, no accounts, `DELETE /api/me` truly forgets you (and reverses your community contribution).

## Repo layout
```
kundlibash/
├─ public/
│  ├─ index.html         # the whole front end
│  ├─ favicon.svg
│  └─ _headers           # security + cache headers
├─ functions/
│  ├─ _middleware.js     # anonymous identity cookie
│  ├─ _lib/util.js       # signs, KV, fetch+split, fallback bank, tally math
│  └─ api/
│     ├─ horoscope.js    # GET  today's lines (cached)
│     ├─ bash.js         # POST verdicts + notes
│     ├─ me.js           # GET personal data+stats · DELETE forget me
│     └─ stats.js        # GET community leaderboard / per-sign tally
├─ wrangler.toml         # name, output dir, BASH_KV binding
├─ package.json          # dev / deploy / kv:create scripts
└─ docs/
```
