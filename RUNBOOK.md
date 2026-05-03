# CMM Runbook — How to actually run this thing

> Plain-English, click-by-click guide. If you're new to Snaps, follow this from
> the top. **No Docker, no servers.**

---

## Table of contents

1. [What's running where](#whats-running-where)
2. [Tier 0 — Mock mode (zero setup, 2 min)](#tier-0--mock-mode-zero-setup-2-min)
3. [Tier 1 — Live data mode (real Cardano testnet, 5 min)](#tier-1--live-data-mode-real-cardano-testnet-5-min)
4. [Tier 2 — Snap mode (the real thing, 15 min)](#tier-2--snap-mode-the-real-thing-15-min)
5. [Production deployment (proxy + hosted dApp)](#production-deployment-proxy--hosted-dapp)
6. [Troubleshooting](#troubleshooting)

---

## What's running where

CMM is **four packages** plus an **optional proxy**, all orchestrated by Turborepo:

| Package | What it is | Port | Talks to |
|---|---|---|---|
| `@cmm/companion-dapp` | The website you visit | `3000` | The Snap + the chosen indexer |
| `@cmm/snap` | The MetaMask Snap | `8080` | MetaMask Flask only |
| `@cmm/dapp-sdk` | TypeScript library glue | n/a | imported by dApp |
| `@cmm/shared` | Types + constants | n/a | imported by everyone |
| `@cmm/proxy` *(optional)* | Vercel Edge Function | `3001` (dev) | Blockfrost |

When you run `./start.sh`, **the first four start automatically.** The proxy is
optional and only needed for production (see [last section](#production-deployment-proxy--hosted-dapp)).

---

## Tier 0 — Mock mode (zero setup, 2 min)

The fastest sanity check. No accounts, no keys, no wallet. Just confirms the
build works on your machine.

```bash
cd /home/js/DIDzMonolith/Cardano-native-metamask
./start.sh
```

The first run installs deps (~2 min). Subsequent runs start in seconds.

When you see `companion-dapp:dev: ➜ Local: http://localhost:3000/` open that URL.
Pick **Mock** in the mode switcher. You should see fake balance cards.

✅ **You're done.** Build works.

Stop with `Ctrl-C` — Turborepo cleanly shuts down all four processes.

---

## Tier 1 — Live data mode (real Cardano testnet, 5 min)

Pulls real balances off Cardano preprod testnet. Still no Snap, still no
MetaMask — this is just the website talking to Blockfrost via HTTPS.

### 1. Get a free Blockfrost project_id

1. Go to https://blockfrost.io/dashboard
2. Sign up (free tier — 50,000 requests/day, way more than you need)
3. Click **+ ADD PROJECT**
4. Name: `cmm-dev`, Network: **`Cardano preprod`**
5. Copy the `project_id` from the dashboard. It looks like `preprodAbc123…`

### 2. Get a preprod address to query

You can either:

- **Use any public address** — grab one from a block explorer like
  https://preprod.cexplorer.io/ — paste any random address, copy it.
- **Get your own** — fund a wallet from the
  [preprod faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/).

You need a string starting with `addr_test1…`.

### 3. Edit `.env.local`

`./start.sh` already created `packages/companion-dapp/.env.local` for you.
Open it and fill in:

```env
VITE_BLOCKFROST_PROJECT_ID_CARDANO_PREPROD=preprodAbc123...
VITE_DEMO_CARDANO_ADDRESS=addr_test1qp...
```

### 4. Restart and switch modes

`Ctrl-C` to stop, then `./start.sh` again. In the dApp, switch to
**Live data**. You should see the real balance for the address you chose.

✅ Real chain data, in your browser, no servers of your own.

---

## Tier 2 — Snap mode (the real thing, 15 min)

This is where the project actually justifies its name. The dApp asks the Snap
for a Cardano address, the Snap derives one from your MetaMask seed, and you
see it on screen. **This is M1's reason for existing.**

### 1. Install MetaMask Flask

Flask is the developer build of MetaMask. It can install local Snaps; regular
MetaMask cannot until they're allowlisted.

> **Important**: Use a **fresh browser profile** (Chrome/Brave/Firefox) so
> Flask doesn't conflict with your normal MetaMask. Right-click your browser
> icon → **New profile**, name it "CMM dev".

1. In the new profile, go to https://metamask.io/flask/
2. Click **Install MetaMask Flask** for your browser
3. Set up Flask with a **brand-new seed phrase** (NEVER use your real seed
   phrase in a dev wallet — Flask is for dev, treat it as disposable)
4. Note the orange "Flask" branding so you don't confuse it with the real wallet

### 2. Confirm `./start.sh` is running

If you stopped it earlier, run it again:

```bash
./start.sh
```

Wait until you see both:
- `companion-dapp:dev: ➜ Local: http://localhost:3000/`
- `snap:dev: Server listening on: http://localhost:8080/`

### 3. Open the dApp in the Flask profile

In your CMM-dev browser profile, go to http://localhost:3000.

Switch the mode toggle to **Snap**. The first time you do this, Flask will pop
up a confirmation dialog:

> **Connect** — http://localhost:3000 wants to connect to MetaMask Flask.

Approve it, then a second dialog:

> **Install local snap** — local:http://localhost:8080 is requesting permissions.

Approve. The Snap installs.

### 4. See real addresses

The dApp now calls `cardano_getAddress` on your Snap. The address you see is
**derived from your Flask seed phrase** via the standard Cardano CIP-1852 path.
That's a real bech32 address — you could send testnet ADA to it.

The Midnight card shows a placeholder address (`mn_test_02_stub_…`). Real
Midnight encoding lands in M2 once we wire `midnight-js`.

✅ End-to-end working: dApp ↔ Snap ↔ derived keys.

---

## Production deployment (proxy + hosted dApp)

Out of scope until M5/M6. Sketch:

1. **Deploy `apps/proxy/` to Vercel** — see `apps/proxy/README.md`. Set
   `BLOCKFROST_PROJECT_ID_PREPROD` and `ALLOWED_ORIGINS` env vars.
2. **Deploy `packages/companion-dapp/` to Vercel** with
   `VITE_BLOCKFROST_PROXY_URL_CARDANO_PREPROD=https://<your-proxy>.vercel.app/api/blockfrost/preprod`
   set in Vercel env vars (NOT in `.env.local`).
3. **Publish the Snap to npm** as `@cmm/snap` (after audit, before the
   allowlist application).
4. **Apply for the MetaMask Snaps Registry allowlist.** This is what removes
   the Flask requirement for end users — until allowlisted, users still need
   Flask.

---

## Troubleshooting

### `./start.sh` says "command not found: pnpm"

Run `corepack enable` first. Or install pnpm directly:
`npm install -g pnpm@9.12.3`.

### Mock mode works, Live data shows mock anyway

The dApp falls back to mock when Blockfrost env vars are missing or look
wrong. Double-check:

```bash
grep BLOCKFROST packages/companion-dapp/.env.local
```

The values must be on lines starting `VITE_BLOCKFROST_…=` with no quotes
around them. Restart `./start.sh` after editing.

### Snap mode says "Wallet not found" / "ethereum is undefined"

You opened the dApp in a browser profile that doesn't have Flask installed.
Switch to your CMM-dev profile.

### Snap mode says "method not found"

The Snap didn't rebuild after a code change. In a separate terminal:

```bash
pnpm -F @cmm/snap build
```

Then refresh the dApp tab. The Snap will reinstall on the next call.

### "Failed to fetch" against Blockfrost

Either the `project_id` is wrong (paste it again from the dashboard) or you
hit the rate limit. Free tier is 50k/day — generous. If it persists, check
https://status.blockfrost.io/.

### Tests fail after a pull

Reinstall:

```bash
pnpm install
pnpm typecheck
pnpm test
```

If `@cmm/dapp-sdk` build artifacts are stale: `pnpm -F @cmm/dapp-sdk clean && pnpm build`.

---

## Cheat sheet

| I want to… | Run |
|---|---|
| Start everything | `./start.sh` |
| Stop everything | `Ctrl-C` in the start.sh terminal |
| Re-install deps | `pnpm install` |
| Run all tests | `pnpm test` |
| Typecheck the monorepo | `pnpm typecheck` |
| Rebuild the Snap only | `pnpm -F @cmm/snap build` |
| Build the dApp for prod | `pnpm -F @cmm/companion-dapp build` |
| Deploy the proxy | `pnpm -F @cmm/proxy deploy` |
| Just check prerequisites | `./start.sh --check` |
