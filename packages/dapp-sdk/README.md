# `@cmm/dapp-sdk`

dApp-side SDK for integrating with the CMM Snap.

## Use

```ts
import { createSnapAdapter } from '@cmm/dapp-sdk';

// auto: uses real if MetaMask detected, else mock
const snap = createSnapAdapter();

await snap.connect();
const address = await snap.getAddress('midnight');
const balance = await snap.getBalance('midnight');
```

## Modes

| Mode    | Behavior                                                          |
|---------|-------------------------------------------------------------------|
| `mock`  | Deterministic fixtures. For demoland, tests, storybook.           |
| `real`  | Calls `wallet_invokeSnap` on the installed CMM Snap via MetaMask. |
| `auto`  | `real` if `window.ethereum` exists, else `mock`.                  |

See `../../docs/BUILD_STRATEGY.md` for the philosophy.
