# Blockfrost Integration

**Status**: Cardano preprod live from M0 · Midnight deferred to M2+ (viewing key required)

## Why Blockfrost

CMM needs a chain indexer to surface balances, UTXOs, and transaction history
in the companion dApp. Blockfrost is the obvious choice:

- **Works for both chains** — Cardano mainnet/preprod/preview and Midnight
  testnet via one provider's API family
- **Generous free tier** — 50,000 requests/day on the free plan, enough for
  all of M0–M5 and light production
- **REST, no WebSockets** — fits the Snap sandbox model cleanly
- **Already dominant in the Cardano ecosystem** — minimal integration risk
- **Trusted by NuFi, Lace, Eternl, and the rest** — auditors won't blink

We keep the indexer behind an `IndexerAdapter` interface so we can swap in
Koios, Maestro, or self-hosted Blockfrost later without changing any UI code.

## Architecture Placement

Blockfrost lives in the **dApp layer**, not the Snap sandbox.

```
 Browser tab
 ├── Companion dApp (React)
 │   ├── createSnapAdapter('live-readonly')
 │   │     └── BlockfrostCardanoIndexer  ←── HTTPS ──→  blockfrost.io
 │   └── ChainCard components
 └── MetaMask Flask
     └── @cmm/snap (signing, keys — NO network calls here)
```

**Why not in the Snap?** Two reasons:

1. **Secrets management**: API keys belong with the dApp deployer, not
   embedded in a Snap bundle that anyone can inspect.
2. **Audit surface**: every outbound fetch in the Snap is a thing auditors
   must review. Keeping the Snap to signing-only keeps M6 scope minimal.

## Getting Started (5 minutes)

### 1. Get a free Blockfrost project_id

1. Go to https://blockfrost.io/dashboard
2. Sign up (free, GitHub/email OK)
3. Create a new project
4. **Network: select `preprod`**
5. Copy the `project_id` (looks like `preprodAbc123...`)

### 2. Configure `.env.local`

```bash
cd packages/companion-dapp
cp .env.example .env.local
```

Edit `.env.local`:

```bash
VITE_BLOCKFROST_PROJECT_ID_CARDANO_PREPROD=preprodAbc123yourIdHere
VITE_DEMO_CARDANO_ADDRESS=addr_test1qp...yourPreprodAddress...
```

Any preprod address works. If you don't have one, get one from:
- [Lace wallet](https://lace.io) in testnet mode
- [Eternl wallet](https://eternl.io) in preprod mode
- The [Cardano preprod faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/)

### 3. Run the dApp

```bash
pnpm -F @cmm/companion-dapp dev
# → http://localhost:3000
```

The **"Live data"** toggle at the top of the page will be enabled. Click it
to see your real preprod ADA balance. Midnight stays in "encrypted"
placeholder mode until M2.

## The Indexer Adapter Contract

```typescript
interface IndexerAdapter {
  readonly name: string;
  readonly chain: ChainId;
  getBalance(address: string): Promise<Balance>;
  healthcheck?(): Promise<boolean>;
}
```

Today's implementations live in `packages/dapp-sdk/src/indexers/`:

| Class                          | Chain     | Status                              |
|--------------------------------|-----------|-------------------------------------|
| `BlockfrostCardanoIndexer`     | Cardano   | ✅ Live (preprod, mainnet, preview) |
| `MidnightTestnetIndexer`       | Midnight  | 🟡 M1 stub — returns `"encrypted"`  |
| `MockIndexer`                  | Both      | ✅ Deterministic fixtures           |

Use `createIndexer(chain, config)` as the single entry point; never
instantiate the classes directly from UI code.

## Why Midnight Stays Mock in M1

Midnight balances are **shielded** — on-chain amounts are zero-knowledge
commitments, not plaintext. Computing a real balance requires the user's
**viewing key**, which only the CMM Snap will hold (M2+).

Until then, the `MidnightTestnetIndexer` returns `amount: "encrypted"` and
the `ChainCard` UI renders *"Encrypted — install CMM Snap to decrypt"*.

M2 roadmap for Midnight:
1. Snap exposes `midnight_getViewingKey(params)` behind user consent
2. dApp fetches shielded UTXOs via the GraphQL endpoint at
   `indexer.testnet-02.midnight.network/api/v1/graphql`
3. dApp decrypts commitments locally using the viewing key
4. Real shielded balance renders in the UI

## Rate Limits & Production

Blockfrost free tier:
- **50,000 requests/day** per project
- **500 req/sec burst**, **10 req/sec sustained**

This is plenty for M0–M5. For production (M6+), the $29/mo tier gives 500k
req/day and SLA support. We'll revisit at allowlist time.

**Caching**: for the companion dApp we should add a 15-second client-side
cache around `getBalance` to avoid duplicate calls during navigation. TBD
in M1 (currently just a `useEffect` with no cache).

## Failure Modes

The `BlockfrostCardanoIndexer`:

- **404 on an address** → returns an empty `Balance` (address has no activity
  yet). Not an error; common for fresh wallets.
- **401/403** → bad project_id, wrong network, or quota exceeded. Surfaced
  as `IndexerError` with the response body.
- **Network failure** → `IndexerError` with the cause chain. The `ChainCard`
  shows a red alert banner.

In `mode='auto'` the factory falls back to `MockIndexer` if no Blockfrost
credentials are configured, so the dApp never "breaks" — it just quietly
downgrades to fixtures.
