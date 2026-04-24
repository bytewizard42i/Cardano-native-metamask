# @cmm/dapp-sdk

> **dApp-side SDK** for integrating with the CMM Snap. One uniform `SnapAdapter` interface, four swappable implementations.

## 🚀 Quick Use

```ts
import { createSnapAdapter } from '@cmm/dapp-sdk';

// Picks 'real' if MetaMask is detected, else falls back to 'mock'.
const snap = createSnapAdapter({ mode: 'auto' });

await snap.connect();                          // triggers MetaMask install-Snap prompt
const address = await snap.getAddress('cardano');  // → 'addr_test1qr...' (M1, real bech32)
const balance = await snap.getBalance('cardano');  // → M2 once Snap has live balances
```

## 🔌 Modes

| Mode | What it does | When to use |
|---|---|---|
| `mock` | Deterministic fixtures — no network, no Snap. | Storybook, unit tests, UX review. |
| `live-readonly` | **Real** chain data via Blockfrost (Cardano) / placeholder (Midnight). No Snap required. | Public landing pages, read-only embeds. |
| `real` | Invokes the installed CMM Snap via `wallet_invokeSnap`. | Production dApps. |
| `auto` | `real` if `window.ethereum` is present, else `mock`. | General-purpose default. |

## 📡 Advanced Exports (M1+)

For dApps that want the full typed Snap response — not just the address string — the SDK exposes low-level invokers:

```ts
import {
  invokeCardanoGetAddress,
  invokeMidnightGetAddress,
  invokeGetCapabilities,
} from '@cmm/dapp-sdk';

// Full Cardano payload with derivation paths
const card = await invokeCardanoGetAddress({ network: 'preprod' });
// → { address, network, paymentPath, stakePath }

// Full Midnight payload with placeholder flag
const mid = await invokeMidnightGetAddress();
// → { address, network, path, placeholder: true, note }

// Probe what the installed Snap supports
const caps = await invokeGetCapabilities();
// → { milestone: 'M1', capabilities: { cardano: {...}, midnight: {...} } }
```

## 🚨 Error Handling

Every Snap failure includes a stable code in `error.data`:

```ts
import type { CmmSnapErrorShape } from '@cmm/dapp-sdk';

try {
  await snap.signTransaction(tx);
} catch (err) {
  const data = (err as { data?: CmmSnapErrorShape }).data;
  if (data?.code === 'CMM_NOT_YET_IMPLEMENTED') {
    showUpgradePrompt();
    return;
  }
  if (data?.code === 'CMM_INVALID_PARAMS') {
    showUserError(err.message);
    return;
  }
  throw err;
}
```

Branch on `data.code`, never on `err.message` (messages may be localized or reworded).

## 🔭 Milestone status

- **M1 (current)** — `getAddress` real for Cardano (bech32) + Midnight (placeholder)
- **M2** — `getBalance` live, real Midnight encoding
- **M3** — `signTransaction`, `submitTransaction`

See [`../../README.md`](../../README.md) for the project roadmap, [`../../docs/BUILD_STRATEGY.md`](../../docs/BUILD_STRATEGY.md) for the demoland-as-mocked-dApp philosophy.
