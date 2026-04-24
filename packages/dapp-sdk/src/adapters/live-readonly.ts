import type { Balance, ChainId, SignedTx, TxPayload } from '@cmm/shared';
import type { SnapAdapter } from '../adapter';
import { createIndexer, type IndexerConfig } from '../indexers/factory';
import type { IndexerAdapter } from '../indexers/interface';

/**
 * `live-readonly` — real indexer reads, mock addresses, mock signing.
 *
 * Why: in M1 we have no Snap yet, so we can't derive real user addresses
 * and we can't sign real transactions. But we CAN hit real Blockfrost
 * endpoints for Cardano preprod balances against a user-supplied demo
 * address. This gives the companion-dapp a "live data, no Snap" mode —
 * a stronger demo than pure fixtures and a real exercise of the indexer
 * code path well before the Snap is ready.
 *
 * Contract:
 *   - `getBalance()` → real Blockfrost / Midnight indexer call
 *   - `getAddress()` → returns the configured demo addresses (or a stub
 *     if none configured)
 *   - `signTransaction()` / `submitTransaction()` → throw `NotImplemented`
 *
 * Graduates to `real` at M2.
 */
export interface LiveReadonlyOptions {
  indexerConfig?: IndexerConfig;
  /** Demo addresses to query; if omitted, returns placeholder strings. */
  demoAddresses?: Partial<Record<ChainId, string>>;
}

export function createLiveReadonlyAdapter(opts: LiveReadonlyOptions = {}): SnapAdapter {
  const { indexerConfig, demoAddresses = {} } = opts;

  const indexers: Record<ChainId, IndexerAdapter> = {
    cardano: createIndexer('cardano', indexerConfig),
    midnight: createIndexer('midnight', indexerConfig),
  };

  const fallbackAddresses: Record<ChainId, string> = {
    cardano: demoAddresses.cardano ?? '(no VITE_DEMO_CARDANO_ADDRESS configured)',
    midnight: demoAddresses.midnight ?? '(no VITE_DEMO_MIDNIGHT_ADDRESS configured)',
  };

  return {
    async isInstalled(): Promise<boolean> {
      return false; // intentionally false — we're read-only, no signing
    },

    async connect(): Promise<void> {
      throw new LiveReadonlyError(
        'live-readonly adapter cannot connect to a Snap. Switch to auto or real mode.',
      );
    },

    async getAddress(chain: ChainId): Promise<string> {
      return demoAddresses[chain] ?? fallbackAddresses[chain];
    },

    async getBalance(chain: ChainId): Promise<Balance> {
      const address = demoAddresses[chain];
      if (!address) {
        // Return a shape-correct but empty placeholder so UI still renders.
        return emptyBalance(chain, fallbackAddresses[chain]);
      }
      return indexers[chain].getBalance(address);
    },

    async signTransaction(_tx: TxPayload): Promise<SignedTx> {
      throw new LiveReadonlyError(
        'live-readonly adapter does not sign. Install CMM Snap (M1+) for signing.',
      );
    },

    async submitTransaction(_signed: SignedTx): Promise<{ txHash: string }> {
      throw new LiveReadonlyError(
        'live-readonly adapter does not submit. Install CMM Snap (M1+) first.',
      );
    },
  };
}

export class LiveReadonlyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LiveReadonlyError';
  }
}

function emptyBalance(chain: ChainId, address: string): Balance {
  if (chain === 'cardano') {
    return {
      chain,
      network: 'preprod',
      address,
      native: { assetId: 'lovelace', symbol: 'ADA', amount: '0', decimals: 6 },
      assets: [],
    };
  }
  return {
    chain,
    network: 'testnet-02',
    address,
    native: {
      assetId: 'night',
      symbol: 'NIGHT',
      amount: '0',
      decimals: 6,
      shielded: true,
    },
    assets: [],
  };
}
