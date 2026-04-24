import type { SnapAdapter } from './adapter.js';
import { mockAdapter } from './adapters/mock.js';
import { realAdapter } from './adapters/real.js';

/**
 * Published Snap ID. During dev (M0–M5) points to the local dev server.
 * Flip to `npm:@cmm/snap` after allowlisting.
 */
export const CMM_SNAP_ID = 'local:http://localhost:8080';

export type AdapterMode = 'mock' | 'real' | 'auto';

/**
 * Create a SnapAdapter.
 *
 * `mode`:
 * - `'mock'`: always use mock fixtures. Used in demoland, tests, storybook.
 * - `'real'`: always talk to the installed Snap via MetaMask.
 * - `'auto'` (default): use `real` if a MetaMask provider is detected,
 *   otherwise `mock` so the dApp still renders in server/headless contexts.
 */
export function createSnapAdapter(mode: AdapterMode = 'auto'): SnapAdapter {
  if (mode === 'mock') {
    return mockAdapter;
  }
  if (mode === 'real') {
    return realAdapter;
  }
  // auto
  const hasEthereum = typeof globalThis !== 'undefined' && 'ethereum' in globalThis;
  return hasEthereum ? realAdapter : mockAdapter;
}
