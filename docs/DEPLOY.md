# Deploy & Operations Runbook

Target: **Cloudflare Pages** (static `public/` + Functions) with **one KV namespace** (`BASH_KV`). Account: `akhil29897@gmail.com`. No secrets, no D1, no R2.

## Prerequisites
- Node 18+ and the Cloudflare CLI: `npx wrangler --version`
- Logged in: `npx wrangler whoami` (else `npx wrangler login`)

## 1 · Create the KV namespace (once)
```bash
npm run kv:create          # = wrangler kv namespace create BASH_KV
```
Copy the returned id into `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "BASH_KV"
id = "PASTE_THE_ID_HERE"
```
(Optional, for a separate preview branch store: `wrangler kv namespace create BASH_KV --preview` and add `preview_id`.)

## 2 · First deploy (creates the Pages project)
```bash
npm run deploy             # = wrangler pages deploy public --project-name kundlibash --branch main
```
This uploads `public/` and compiles `functions/`. Live at `https://kundlibash.pages.dev`.

> **Bind KV to the project.** Pages reads the binding from `wrangler.toml` on deploy. If a function logs "BASH_KV is undefined," attach it in the dashboard: **Workers & Pages → kundlibash → Settings → Functions → KV namespace bindings** → variable `BASH_KV` → your namespace, for **Production** (and Preview). Redeploy.

## 3 · Verify production
```bash
curl -s "https://kundlibash.pages.dev/api/horoscope?sign=virgo" | head -c 300
```
Then open the site, pick a sign, bash a line, and check **Reckoning**. Production KV is empty at launch, so the community board starts pristine.

## Local development
```bash
npm run dev                # wrangler pages dev public  → http://127.0.0.1:8788
```
`wrangler pages dev` provisions a **local** KV for `BASH_KV` (state in `.wrangler/`), entirely separate from production — local test data never touches the live board.

## Custom domain (optional)
**Pages project → Custom domains → Set up a domain** (e.g. `bash.kundlibash.com` or a path on an existing domain). Cloudflare provisions TLS automatically. No app change needed.

## Caching & headers
`public/_headers` sets security headers and marks `/api/*` `no-store` and HTML `no-cache`. Static assets (the single HTML file) are tiny; no CDN cache tuning required. API responses already send `Cache-Control: no-store` from the functions.

## Rollback
Every deploy is a versioned Pages deployment. **Pages project → Deployments →** pick a previous one → **Rollback**. KV data is unaffected by rollbacks (it's external to the deployment).

## Operations notes
- **Data lives only in KV.** To wipe everything: delete and recreate the namespace, or clear keys by prefix with `wrangler kv key list --binding BASH_KV` + `wrangler kv key delete`.
- **No secrets to rotate.** Identity is an HMAC-free random cookie; there are no API keys.
- **External API health.** If readings ever look like the fallback bank (`source` ends in `bank`), the public astrology APIs are down — the site keeps working; no action needed.
- **Cost.** Pages + Functions + KV at this scale sit comfortably in Cloudflare's free tier; it scales to zero at rest.

## Pre-launch checklist
- [ ] `BASH_KV` id pasted into `wrangler.toml` and bound in the Pages project (Production)
- [ ] `npm run deploy` succeeds; `/api/horoscope?sign=virgo` returns lines in prod
- [ ] Bash → Reckoning → Almanac all work on the live URL
- [ ] `?demo=1` tour renders (optional, for sharing a populated preview)
- [ ] Custom domain attached (if using one)
