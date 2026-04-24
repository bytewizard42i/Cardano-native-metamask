import type { Balance, CardanoNetwork } from '@cmm/shared';
import { CARDANO_NATIVE_SYMBOL, CARDANO_DECIMALS } from '@cmm/shared';
import { IndexerError, type IndexerAdapter } from './interface.js';

/**
 * Blockfrost REST base URLs, keyed by Cardano network.
 *
 * @see https://blockfrost.io/dashboard — get a free project_id per network
 */
const BLOCKFROST_BASE_URLS: Record<CardanoNetwork, string> = {
  mainnet: 'https://cardano-mainnet.blockfrost.io/api/v0',
  preprod: 'https://cardano-preprod.blockfrost.io/api/v0',
  preview: 'https://cardano-preview.blockfrost.io/api/v0',
};

export interface BlockfrostCardanoOptions {
  /**
   * Blockfrost project_id for the target network. Get one free at
   * https://blockfrost.io/dashboard (50k req/day is ample for M0–M5).
   *
   * NOTE: one project_id corresponds to a single network. Don't mix.
   */
  projectId: string;

  /**
   * Which Cardano network to query. Defaults to `preprod` for M0–M5.
   */
  network?: CardanoNetwork;

  /**
   * Optional custom base URL override (self-hosted Blockfrost, proxy, etc).
   */
  baseUrl?: string;

  /**
   * Custom `fetch` implementation. Defaults to global fetch.
   * Useful for tests or Node polyfills.
   */
  fetchImpl?: typeof fetch;
}

/**
 * Cardano indexer backed by Blockfrost.
 *
 * Reference: https://docs.blockfrost.io/
 *
 * M1 scope: `getBalance(address)` against `/addresses/{address}`.
 * We intentionally do NOT derive a stake address here — that belongs to
 * the Snap's key-derivation layer in M2.
 */
export class BlockfrostCardanoIndexer implements IndexerAdapter {
  public readonly name: string;
  public readonly chain = 'cardano' as const;

  private readonly projectId: string;
  private readonly baseUrl: string;
  private readonly network: CardanoNetwork;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: BlockfrostCardanoOptions) {
    if (!opts.projectId) {
      throw new IndexerError(
        'BlockfrostCardanoIndexer requires a projectId. ' +
          'Get one free at https://blockfrost.io/dashboard and set ' +
          'VITE_BLOCKFROST_PROJECT_ID_CARDANO_PREPROD in .env.local',
        undefined,
        'blockfrost-cardano',
      );
    }
    this.projectId = opts.projectId;
    this.network = opts.network ?? 'preprod';
    this.baseUrl = opts.baseUrl ?? BLOCKFROST_BASE_URLS[this.network];
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.name = `blockfrost-cardano-${this.network}`;
  }

  async getBalance(address: string): Promise<Balance> {
    const url = `${this.baseUrl}/addresses/${encodeURIComponent(address)}`;
    const res = await this.fetchImpl(url, {
      headers: { project_id: this.projectId },
    });

    if (res.status === 404) {
      // Address exists in the wallet but has seen no on-chain activity yet.
      return emptyBalance(address, this.network);
    }
    if (!res.ok) {
      const body = await safeText(res);
      throw new IndexerError(
        `Blockfrost ${this.network} returned ${res.status} ${res.statusText} for ${address}. ${body}`,
        undefined,
        this.name,
      );
    }

    const data = (await res.json()) as BlockfrostAddressResponse;
    return parseBlockfrostAddress(data, address, this.network);
  }

  async healthcheck(): Promise<boolean> {
    try {
      const res = await this.fetchImpl(`${this.baseUrl}/health`, {
        headers: { project_id: this.projectId },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Blockfrost response shapes (only the fields we consume)             */
/* ------------------------------------------------------------------ */

interface BlockfrostAmount {
  /**
   * `lovelace` for ADA, otherwise a hex-encoded `<policy_id><asset_name_hex>`.
   */
  unit: string;
  quantity: string; // stringified integer
}

interface BlockfrostAddressResponse {
  address: string;
  amount: BlockfrostAmount[];
  stake_address: string | null;
  type: string;
  script: boolean;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function parseBlockfrostAddress(
  data: BlockfrostAddressResponse,
  address: string,
  network: CardanoNetwork,
): Balance {
  const lovelace = data.amount.find((a) => a.unit === 'lovelace');
  const nativeAmount = lovelace?.quantity ?? '0';

  const assets = data.amount
    .filter((a) => a.unit !== 'lovelace')
    .map((a) => {
      // Blockfrost combines policy_id (56 hex chars) + asset_name_hex.
      const policyId = a.unit.slice(0, 56);
      const assetNameHex = a.unit.slice(56);
      const assetName = hexToAscii(assetNameHex) || assetNameHex;
      return {
        assetId: a.unit,
        policyId,
        assetName,
        symbol: assetName,
        amount: a.quantity,
        decimals: 0, // Cardano native assets: fungibility is metadata-defined
      };
    });

  return {
    chain: 'cardano',
    network,
    address,
    native: {
      assetId: 'lovelace',
      symbol: CARDANO_NATIVE_SYMBOL,
      amount: nativeAmount,
      decimals: CARDANO_DECIMALS,
    },
    assets,
  };
}

function emptyBalance(address: string, network: CardanoNetwork): Balance {
  return {
    chain: 'cardano',
    network,
    address,
    native: {
      assetId: 'lovelace',
      symbol: CARDANO_NATIVE_SYMBOL,
      amount: '0',
      decimals: CARDANO_DECIMALS,
    },
    assets: [],
  };
}

function hexToAscii(hex: string): string {
  if (!hex || hex.length % 2 !== 0) return '';
  try {
    let out = '';
    for (let i = 0; i < hex.length; i += 2) {
      const c = parseInt(hex.slice(i, i + 2), 16);
      if (Number.isNaN(c)) return '';
      // Only emit printable ASCII; otherwise fall back to hex display.
      if (c < 0x20 || c > 0x7e) return '';
      out += String.fromCharCode(c);
    }
    return out;
  } catch {
    return '';
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '<no body>';
  }
}
