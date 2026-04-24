import type { Balance, ChainId, SignedTx, TxPayload } from '@cmm/shared';
import type { SnapAdapter } from '../adapter';
import { CMM_SNAP_ID } from '../factory';

/**
 * Real adapter — invokes the installed CMM Snap via MetaMask's RPC.
 *
 * Scope per milestone (see docs/BUILD_STRATEGY.md):
 * - M1 (CURRENT): `getAddress` returns real HD-derived bech32 addresses
 *                 for both Cardano (addr_test1...) and Midnight (placeholder
 *                 encoding). `getBalance` still deferred to M2.
 * - M2: `getBalance` returns real balances (Midnight via viewing key,
 *       Cardano via Blockfrost inside the Snap).
 * - M3: `signTransaction` + `submitTransaction` return real values.
 */

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown }) => Promise<unknown>;
    };
  }
}

/**
 * The error shape the Snap throws for well-known failures. Matches
 * CmmSnapError in `packages/snap/src/common/errors.ts` so the dApp can
 * branch on stable codes instead of parsing strings.
 */
export interface CmmSnapErrorShape {
  code: string;
  chain?: ChainId;
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

/** Response shape of `cardano_getAddress` on the Snap (M1+). */
interface CardanoAddressResponse {
  address: string;
  network: 'mainnet' | 'preprod' | 'preview';
  paymentPath: string;
  stakePath: string;
}

/** Response shape of `midnight_getAddress` on the Snap (M1+). */
interface MidnightAddressResponse {
  address: string;
  network: 'mainnet' | 'testnet-02';
  path: string;
  placeholder?: boolean;
  note?: string;
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

  /**
   * Resolves to just the bech32 address string. If callers need the full
   * response (network, derivation paths), use the lower-level
   * `invokeCardanoGetAddress` / `invokeMidnightGetAddress` exports below.
   */
  async getAddress(chain: ChainId): Promise<string> {
    if (chain === 'cardano') {
      const res = await invokeSnap<CardanoAddressResponse>('cardano_getAddress');
      return res.address;
    }
    const res = await invokeSnap<MidnightAddressResponse>('midnight_getAddress');
    return res.address;
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

// ───── Advanced exports for callers that need the full response ─────

/** Returns the full `cardano_getAddress` payload (address + paths + network). */
export async function invokeCardanoGetAddress(
  params?: { network?: 'mainnet' | 'preprod' | 'preview' },
): Promise<CardanoAddressResponse> {
  return invokeSnap<CardanoAddressResponse>('cardano_getAddress', params);
}

/** Returns the full `midnight_getAddress` payload (address + path + placeholder flag). */
export async function invokeMidnightGetAddress(
  params?: { network?: 'mainnet' | 'testnet-02' },
): Promise<MidnightAddressResponse> {
  return invokeSnap<MidnightAddressResponse>('midnight_getAddress', params);
}

/** Capability probe — dApps can branch on which methods are live in the installed Snap. */
export async function invokeGetCapabilities(): Promise<{
  milestone: string;
  capabilities: Record<ChainId, Record<string, boolean | string>>;
}> {
  return invokeSnap('common_getCapabilities');
}
