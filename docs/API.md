# API Reference

All endpoints are Cloudflare Pages Functions under `/api`. JSON in, JSON out, `Cache-Control: no-store`. Every request carries the anonymous `byh_uid` cookie (set automatically by the middleware on first visit); send credentials same-origin so it rides along.

Conventions: dates are `YYYY-MM-DD` in **IST**. A **verdict** is `"up"` (rang true), `"down"` (rang hollow), or `null` (unmarked). Notes are capped at 1200 chars.

---

## `GET /api/horoscope?sign=<id>`
Today's reading for a sign — fetched from the astrology API once per day and cached, so it's identical for everyone.

**Query** · `sign` — one of `aries taurus gemini cancer leo virgo libra scorpio sagittarius capricorn aquarius pisces`

**200**
```json
{
  "date": "2026-06-25",
  "sign": "virgo",
  "source": "freehoroscopeapi",
  "statements": [
    { "id": "s0", "text": "For Virgo, today is a good day to tackle tasks you've been putting off…" },
    { "id": "s1", "text": "You'll feel more focused and motivated…" }
  ],
  "fetchedAt": "2026-06-25T06:36:30.866Z",
  "meta": { "id": "virgo", "name": "Virgo", "symbol": "♍", "dates": "Aug 23 – Sep 22", "element": "earth" },
  "prettyDate": "25th Jun 2026"
}
```
`source` may be `freehoroscopeapi`, `ohmanda`, `…+bank`, or `bank` (deterministic fallback). **400** if `sign` is unknown.

---

## `POST /api/bash`
Record (or amend) the visitor's verdicts + notes for today's sign. Re-submitting overwrites cleanly — the previous contribution is subtracted from the community tallies first.

**Body**
```json
{
  "sign": "virgo",
  "items": [
    { "i": 0, "verdict": "up",   "note": "cleaned my whole desk, freakishly accurate" },
    { "i": 1, "verdict": "down", "note": "zero motivation today" },
    { "i": 2, "verdict": "up" }
  ],
  "otherNote": "felt weirdly accurate this morning"
}
```
`i` is the statement index from `/api/horoscope`. Unknown/duplicate indices are ignored. At least one verdict **or** a non-empty `otherNote` is required.

**200**
```json
{
  "ok": true,
  "record": { "uid":"…","sign":"virgo","date":"2026-06-25","ts":1782369401341,
              "items":[{ "i":0,"verdict":"up","note":"…","text":"For Virgo, today…" }],
              "otherNote":"…" },
  "today": { "bashers": 1, "statements": [ {"up":1,"down":0}, {"up":0,"down":1} ], "lastTs": 1782369401341 },
  "count": 5
}
```
**400** bad json / unknown sign / nothing to record · **409** if no prediction has been generated for today yet (load `/api/horoscope` first).

---

## `GET /api/me`
Everything kept against this visitor's anonymous id: derived notes + personal stats + recent records.

**200**
```json
{
  "stats": {
    "totalVerdicts": 3, "up": 2, "down": 1, "accuracy": 67,
    "daysBashed": 1, "streak": 1, "predictionsBashed": 3,
    "accuracyNotes": 2, "otherNotes": 1,
    "favSign": "virgo", "favSignMeta": { "…": "…" },
    "bySign": { "virgo": { "up": 2, "down": 1 } }
  },
  "bashes": [ { "sign":"virgo","date":"2026-06-25","items":[…],"otherNote":"…" } ],
  "accuracyNotes": [ { "date":"2026-06-25","sign":"virgo","verdict":"up","text":"…","note":"…","ts":… } ],
  "otherNotes":    [ { "date":"2026-06-25","sign":"virgo","note":"…","ts":… } ],
  "today": "2026-06-25"
}
```
`accuracy` is `null` until the first verdict. `streak` counts consecutive IST days (ending today or yesterday) with at least one bash.

## `DELETE /api/me`
The "burn the almanac" action. Deletes all of this visitor's `bash:` records **and** subtracts their contribution from every community tally they touched.

**200** → `{ "ok": true, "removed": 4 }`  (number of day-records cleared)

---

## `GET /api/stats[?sign=<id>]`
The community scoreboard. "Candour" = share of verdicts that rang true.

**200**
```json
{
  "date": "2026-06-25",
  "leaderboard": [
    { "sign":"gemini","name":"Gemini","symbol":"♊","up":71,"down":29,"total":100,"accuracy":71,"bashers":43 }
  ],
  "mostAccurate": { "sign":"gemini","accuracy":71, "…":"…" },
  "mostBs":       { "sign":"scorpio","accuracy":44, "…":"…" },
  "global": { "verdicts": 1846, "accuracy": 59, "bashers": 312 },
  "signToday": { "sign":"virgo","bashers":41,"statements":[ {"up":21,"down":17} ] }   // only when ?sign= is given
}
```
Signs with no verdicts have `accuracy: null` and sort last.

---

## Notes for integrators
- **No auth header.** Identity is the cookie; there is no API key. Treat every endpoint as belonging to "whoever holds this cookie."
- **Idempotent bash.** Safe to re-POST the full day's state on every change; the server reconciles via delta.
- **Eventual consistency.** Community tallies are KV read-modify-write; expect them to settle, not to be transactionally exact under heavy concurrent load (see [ARCHITECTURE.md](ARCHITECTURE.md)).
