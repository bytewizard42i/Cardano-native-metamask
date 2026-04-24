# `@cmm/companion-dapp`

The companion web dApp for CMM. Doubles as **demoland** (mock-adapter only)
during M0–M3 per `docs/BUILD_STRATEGY.md`.

**Stack**: Vite 6 + React 18 + Tailwind 3. Pure SPA — no SSR (wallet state is
inherently client-only). Vite chosen for consistency with the rest of
DIDzMonolith (BlindOracle, DIDz-io, DiscoveryManagement all on Vite).

## Run locally

```bash
# from repo root
pnpm install
pnpm -F @cmm/companion-dapp dev

# then open http://localhost:3000
```

The top-of-page **Mode** toggle switches the adapter:

- **Mock** — deterministic fixtures (default, works offline)
- **Live data** — real Cardano preprod via Blockfrost; enabled when
  `.env.local` has a project_id + demo address
- **Snap (M1+)** — disabled until the CMM Snap ships

See `../../docs/BLOCKFROST_INTEGRATION.md` for the 5-minute Blockfrost setup.

## Structure

```
index.html              # Vite entry
vite.config.ts
postcss.config.js
tailwind.config.ts
src/
├── main.tsx            # React root
├── App.tsx             # landing + balance cards
├── index.css           # tailwind + gradient bg
├── components/
│   ├── hero.tsx
│   ├── chain-card.tsx  # balance-fetching card (mock-driven)
│   └── footer-note.tsx
```

## Deployment

Target: Vercel (project `cmm-companion`), deployed as a pure static Vite build.
Two environments:

- `cmm-mock.vercel.app` — mock adapter only, safe to share publicly
- `cmm.wallet` (or final chosen domain) — real adapter, production
