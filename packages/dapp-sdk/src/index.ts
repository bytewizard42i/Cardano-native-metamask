/**
 * @cmm/dapp-sdk — public surface.
 *
 * The dApp SDK exposes a single {@link SnapAdapter} interface with two
 * implementations: `mock` (for dev/demoland) and `real` (talks to the
 * installed CMM Snap via MetaMask RPC).
 *
 * Downstream code — including our own companion-dapp — should import the
 * adapter factory from this package and never branch on mock-vs-real.
 *
 * See docs/BUILD_STRATEGY.md for the demoland-as-mocked-dApp approach.
 */
export type { SnapAdapter } from './adapter.js';
export { createSnapAdapter, CMM_SNAP_ID } from './factory.js';
export * from '@cmm/shared';
