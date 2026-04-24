/**
 * @cmm/dapp-sdk — public surface.
 *
 * The dApp SDK exposes a single {@link SnapAdapter} interface with four
 * implementations: `mock` (fixtures), `real` (wallet_invokeSnap),
 * `live-readonly` (real indexer reads, mock signing), and `auto` (picks
 * real/mock based on provider detection).
 *
 * It also exposes the indexer layer (`createIndexer`) so dApps can query
 * chain state independently of the Snap — useful for public explorers,
 * read-only embeds, and the companion-dApp's "live balance" mode.
 *
 * See docs/BUILD_STRATEGY.md for the demoland-as-mocked-dApp approach,
 * and docs/BLOCKFROST_INTEGRATION.md for indexer setup.
 */
export type { SnapAdapter } from './adapter';
export {
  createSnapAdapter,
  CMM_SNAP_ID,
  type AdapterMode,
  type CreateSnapAdapterOptions,
} from './factory';
export type { LiveReadonlyOptions } from './adapters/live-readonly';
export * from './indexers/index';
export * from '@cmm/shared';
