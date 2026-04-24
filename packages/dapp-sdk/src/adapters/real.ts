import type { Balance, ChainId, SignedTx, TxPayload } from '@cmm/shared';
import type { SnapAdapter } from '../adapter.js';
import { CMM_SNAP_ID } from '../factory.js';

/**
 * Real adapter — invokes the installed CMM Snap via MetaMask's RPC.
 *
 * Scope per milestone (see docs/BUILD_STRATEGY.md):
 * - M0: all methods throw "not yet wired" (we default to mock in auto mode)
 * - M2: `getAddress` + `getBalance` (Midnight) return real values
 * - M3: `signTransaction` + `submitTransaction` return real values
 * - M7+: Cardano methods go real
 */

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown }) => Promise<unknown>;
    };
  }
}

function requireEthereum(): NonNullable<Window['ethereum']> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('CMM: MetaMask (window.ethereum) not detected');
  }
  return window.ethereum;
}

async function invokeSnap<T>(method: string, params?: Record<string, unknown>): Promise<T> {
  const eth = requireEthereum();
  const result = (await eth.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: CMM_SNAP_ID,
      request: { method, params },
    },
  })) as T;
  return result;
}

export const realAdapter: SnapAdapter = {
  async isInstalled(): Promise<boolean> {
    try {
      const eth = requireEthereum();
      const snaps = (await eth.request({ method: 'wallet_getSnaps' })) as Record<string, unknown>;
      return CMM_SNAP_ID in snaps;
    } catch {
      return false;
    }
  },

  async connect(): Promise<void> {
    const eth = requireEthereum();
    await eth.request({
      method: 'wallet_requestSnaps',
      params: { [CMM_SNAP_ID]: {} },
    });
  },

  async getAddress(chain: ChainId): Promise<string> {
    return invokeSnap<string>(`${chain}_getAddress`);
  },

  async getBalance(chain: ChainId): Promise<Balance> {
    return invokeSnap<Balance>(`${chain}_getBalance`);
  },

  async signTransaction(tx: TxPayload): Promise<SignedTx> {
    return invokeSnap<SignedTx>(`${tx.chain}_signTx`, { tx });
  },

  async submitTransaction(signed: SignedTx): Promise<{ txHash: string }> {
    return invokeSnap<{ txHash: string }>(`${signed.chain}_submitTx`, { signed });
  },
};
