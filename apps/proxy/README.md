# @cmm/proxy — Blockfrost Edge Proxy

> Tiny Vercel Edge Function that hides the Blockfrost `project_id` server-side.
> The companion dApp calls this URL; this function forwards to Blockfrost
> with the secret header attached. **The browser never sees the key.**

---

## Why?

In M0–M1 the dApp ships the Blockfrost `project_id` as a `VITE_*` env var, which
means it's baked into the public bundle. That's fine for local dev and for
publicly-disclosed demo keys, but for any production-ish deployment we want the
key on the server only.

This proxy is **~150 lines, zero dependencies**, runs on Vercel's free tier, and
can be replaced with Cloudflare Workers / any Edge runtime in 10 minutes if
needed.

---

## Endpoints

| Method | Path | Forwards to |
|---|---|---|
| `GET` | `/api/blockfrost/preprod/<rest>` | `https://cardano-preprod.blockfrost.io/api/v0/<rest>` |
| `GET` | `/api/blockfrost/preview/<rest>` | `https://cardano-preview.blockfrost.io/api/v0/<rest>` |
| `GET` | `/api/blockfrost/mainnet/<rest>` | `https://cardano-mainnet.blockfrost.io/api/v0/<rest>` |
| `OPTIONS` | any | CORS preflight |

Allowed Blockfrost path prefixes (anything else returns `403`):

- `addresses/` — wallet balance & UTxO queries
- `blocks/` — chain tip
- `health` — liveness
- `network` — protocol params
- `epochs/`, `pools/`, `assets/`, `txs/` — read-only chain data

Write endpoints (tx submit, etc.) are **not** proxied — only `GET`.

---

## Deploying

### One-time setup

```bash
pnpm -F @cmm/proxy install
npx vercel link        # link this folder to a Vercel project
```

### Set env vars in Vercel

In the Vercel dashboard for the project, add:

| Variable | Value | Required |
|---|---|---|
| `BLOCKFROST_PROJECT_ID_PREPROD` | `preprod...` from blockfrost.io | yes (for preprod traffic) |
| `BLOCKFROST_PROJECT_ID_PREVIEW` | `preview...` | optional |
| `BLOCKFROST_PROJECT_ID_MAINNET` | `mainnet...` | optional |
| `ALLOWED_ORIGINS` | `https://cmm-companion.vercel.app,http://localhost:3000` | yes — comma-separated dApp origins |

> Use `ALLOWED_ORIGINS=*` only for early demos. For real deployments, list the
> exact origins.

### Deploy

```bash
pnpm -F @cmm/proxy deploy
# → https://cmm-proxy.vercel.app
```

### Wire the dApp

In `packages/companion-dapp/.env.local` (or Vercel env for the dApp):

```env
VITE_BLOCKFROST_PROXY_URL_CARDANO_PREPROD=https://cmm-proxy.vercel.app/api/blockfrost/preprod
```

When this var is set, the dApp ignores `VITE_BLOCKFROST_PROJECT_ID_CARDANO_PREPROD`
and routes through the proxy. The browser never sees the key.

---

## Local testing

```bash
pnpm -F @cmm/proxy dev
# → http://localhost:3001
```

Test it:

```bash
curl 'http://localhost:3001/api/blockfrost/preprod/blocks/latest'
```

You'll need `BLOCKFROST_PROJECT_ID_PREPROD` in `apps/proxy/.env.local` for local
runs.

---

## Security model

- **No POST/PUT/DELETE** — proxy is read-only
- **Path allow-list** — proxy refuses to forward arbitrary Blockfrost paths
- **CORS allow-list** — only configured origins can call the proxy from a browser
- **No request-body forwarding** — query strings only
- **Rate limiting** — Vercel's defaults apply; layer Cloudflare in front if you
  expect significant traffic
- **Cache** — `cache-control: max-age=2` so a refresh storm can't burn your
  Blockfrost quota

---

## Future work

- Add a small `/api/midnight/*` proxy if/when Midnight indexer credentials become
  a thing (they're public today)
- Per-IP rate limiting via `@vercel/kv`
- Move to Cloudflare Workers if Vercel cold-start latency hurts UX

---

## License

Apache-2.0 (matches the rest of CMM).
