# Kundlibash — Product Overview

*Working title: **Kundlibash** (Hindi **kundli**, a birth chart, + **bash**).*

## The one-liner
A horoscope you're allowed to argue with. Read the day's reading, live the day, then **bash each line against what actually happened** — and watch the whole zodiac get graded on how true it rings.

## The problem
Everyone reads their horoscope. Almost no one checks it. The prediction is written in the morning and quietly forgotten by night, so it never has to be *right* — it just has to be vague enough to feel right. There's no scoreboard, no memory, no reckoning.

## The idea
Turn the horoscope into something falsifiable and fun:

1. **Predict** — pull the day's real horoscope for a sign and break it into discrete, testable lines.
2. **Bash** — at day's end the reader marks each line **rang true** or **rang hollow**, and notes what actually happened.
3. **Reckon** — those verdicts roll up into a personal accuracy record *and* a shared, public scoreboard: which signs ring true, which are mostly hot air.

The skeptic's instinct ("my horoscope is complete bs") becomes the whole mechanic. We don't ask you to believe — we ask you to keep score.

## Who it's for
- **The amused skeptic** who reads horoscopes ironically and would love the receipts.
- **The believer** who wants to track how their sign actually performs.
- **The sharer** — the daily verdict + community scoreboard is inherently screenshot-and-send.

No account, no email, no install. Open it, pick your sign, start bashing.

## What it collects (the three ledgers)
The product is, at heart, a quiet data-collection ritual disguised as a game. Everything funnels into three places:

| Ledger | What it is |
|---|---|
| **Accuracy notes** | Per-line: the verdict (true / hollow) + what actually happened. The honest diary of the stars vs. your life. |
| **Other notes** | Free-form notes for the day — the mood, the omen, what the reading missed. |
| **Stats (the reckoning)** | Personal: accuracy %, streak, lines bashed, days kept. Community: every sign ranked by candour, the truest and the most hollow, global hit-rate. |

## Design language — "celestial almanac"
Not a candy-coloured app; a **printed star atlas you can argue with**. Deep ink night, warm ivory, antique gold. A high-contrast serif (Fraunces) for the readings, fine constellation line-art, Roman-numeral verses, hairline rules. Restrained, editorial, timeless — it takes the stars seriously enough to doubt them properly.

## Why it works as a product
- **Daily habit loop.** A fresh reading every day → a reason to return and bash yesterday's.
- **Shared truth.** Because everyone sees the *same* daily reading per sign, the community stats are real and comparable — a genuine crowd-verification of astrology.
- **Light to run.** Static front end + a handful of serverless functions + one key-value store. No database to babysit, scales to zero, costs ~nothing at rest.

## Roadmap (candidate next moves)
- **Weekly & monthly reckonings** — accuracy trends over time, per sign.
- **Share cards** — a beautiful auto-generated image of today's verdict / your streak.
- **Sign rivalries** — "Virgo vs Scorpio: who's more full of it this week?"
- **Optional accounts** — claim your anonymous almanac across devices.
- **Editorial layer** — a short, written "reading of the readings" (Akhil's voice) framing the week's most/least honest signs.
- **AI readings** — optionally generate the daily lines with a model for more bashable specificity, still cached once-per-day-per-sign so the community stats hold.

See [ARCHITECTURE.md](ARCHITECTURE.md) for how it's built, [API.md](API.md) for the endpoints, and [DEPLOY.md](DEPLOY.md) to ship it.
