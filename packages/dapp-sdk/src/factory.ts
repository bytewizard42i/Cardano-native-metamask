import type { SnapAdapter } from './adapter';
import { mockAdapter } from './adapters/mock';
import { realAdapter } from './adapters/real';
import {
  createLiveReadonlyAdapter,
  type LiveReadonlyOptions,
} from './adapters/live-readonly';

/**
 * Published Snap ID. During dev (M0–M5) points to the local dev server.
 * Flip to `npm:@cmm/snap` after allowlisting.
 */
export const CMM_SNAP_ID = 'local:http://localhost:8080';

export type AdapterMode = 'mock' | 'real' | 'auto' | 'live-readonly';

export interface CreateSnapAdapterOptions {
  /**
   * Forwarded to the `live-readonly` adapter so it can construct indexers
   * with Blockfrost credentials / demo addresses. Ignored for other modes.
   */
  liveReadonly?: LiveReadonlyOptions;
}

/**
 * Create a SnapAdapter.
 *
 * `mode`:
 * - `'mock'`: always use mock fixtures. Used in demoland, tests, storybook.
 * - `'real'`: always talk to the installed Snap via MetaMask.
 * - `'auto'` (default): use `real` if a MetaMask provider is detected,
 *   otherwise `mock` so the dApp still renders in server/headless contexts.
 * - `'live-readonly'`: real indexer reads (Blockfrost for Cardano) with
 *   mock signing. Great mid-M1 demo mode before the Snap is implemented.
 */
export function createSnapAdapter(
  mode: AdapterMode = 'auto',
  options: CreateSnapAdapterOptions = {},
): SnapAdapter {
  if (mode === 'mock') return mockAdapter;
  if (mode === 'real') return realAdapter;
  if (mode === 'live-readonly') return createLiveReadonlyAdapter(options.liveReadonly);

  // auto
  const hasEthereum = typeof globalThis !== 'undefined' && 'ethereum' in globalThis;
  return hasEthereum ? realAdapter : mockAdapter;
}
