# `@cmm/companion-dapp`

The companion web dApp for CMM. Doubles as **demoland** (mock-adapter only)
during M0–M3 per `docs/BUILD_STRATEGY.md`.

## Run locally

```bash
# from repo root
pnpm install
pnpm -F @cmm/companion-dapp dev

# then open http://localhost:3000
```

The default `ChainCard` forces `createSnapAdapter('mock')` so you see a
fully-rendered UX with deterministic fixtures before any Snap exists.
Swap `'mock'` → `'auto'` once the Snap reaches M2+.

## Structure

```
src/
├── app/
│   ├── layout.tsx         # root layout
│   ├── page.tsx           # landing + balance cards
│   └── globals.css        # tailwind + gradient bg
├── components/
│   ├── hero.tsx
│   ├── chain-card.tsx     # balance-fetching card
│   └── footer-note.tsx
```

## Deployment

Target: Vercel (project `cmm-companion`).
Two environments:

- `cmm-mock.vercel.app` — mock adapter only, safe to share publicly
- `cmm.wallet` (or final chosen domain) — real adapter, production
