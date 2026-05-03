import type { Balance, BlockInfo, CardanoNetwork, NetworkInfo, Utxo } from '@cmm/shared';
import { CARDANO_NATIVE_SYMBOL, CARDANO_DECIMALS } from '@cmm/shared';
import { IndexerError, type IndexerAdapter } from './interface';

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
   *
   * May be left empty IF `baseUrl` points to a proxy that injects the
   * project_id header server-side (see `apps/proxy/`).
   */
  projectId?: string;

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
 * M1 scope:
 *   - `getBalance(address)` against `/addresses/{address}`
 *   - `getUtxos(address)` against `/addresses/{address}/utxos`
 *   - `getLatestBlock()` against `/blocks/latest`
 *   - `getNetworkInfo()` composes `/network` + `/blocks/latest`
 *   - `healthcheck()` against `/health`
 *
 * We intentionally do NOT derive a stake address here — that belongs to
 * the Snap's key-derivation layer in M2.
 */
export class BlockfrostCardanoIndexer implements IndexerAdapter {
  public readonly name: string;
  public readonly chain = 'cardano' as const;

  private readonly projectId: string;
  private readonly proxyMode: boolean;
  private readonly baseUrl: string;
  private readonly network: CardanoNetwork;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: BlockfrostCardanoOptions) {
    // projectId is required UNLESS a proxy baseUrl is supplied.
    // In proxy mode the server injects the header so the browser never sees the key.
    const proxyMode = Boolean(opts.baseUrl) && !opts.projectId;
    if (!opts.projectId && !opts.baseUrl) {
      throw new IndexerError(
        'BlockfrostCardanoIndexer requires either a projectId or a proxy baseUrl. ' +
          'For dev: get a free key at https://blockfrost.io/dashboard and set ' +
          'VITE_BLOCKFROST_PROJECT_ID_CARDANO_PREPROD in .env.local. ' +
          'For prod: deploy apps/proxy/ and set VITE_BLOCKFROST_PROXY_URL_CARDANO_PREPROD.',
        undefined,
        'blockfrost-cardano',
      );
    }
    this.projectId = opts.projectId ?? '';
    this.proxyMode = proxyMode;
    this.network = opts.network ?? 'preprod';
    this.baseUrl = opts.baseUrl ?? BLOCKFROST_BASE_URLS[this.network];
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.name = proxyMode
      ? `blockfrost-cardano-${this.network}-proxied`
      : `blockfrost-cardano-${this.network}`;
  }

  /** Build request headers — omit project_id in proxy mode (proxy injects it). */
  private headers(): HeadersInit {
    return this.proxyMode ? {} : { project_id: this.projectId };
  }

  async getBalance(address: string): Promise<Balance> {
    const url = `${this.baseUrl}/addresses/${encodeURIComponent(address)}`;
    const res = await this.fetchImpl(url, {
      headers: this.headers(),
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

  async getUtxos(address: string): Promise<Utxo[]> {
    // Blockfrost paginates at 100 items/page max. For M1 we fetch up to 300
    // UTXOs (3 pages); dApps needing more can layer on cursor-based iteration
    // in a later milestone.
    const PAGE_SIZE = 100;
    const MAX_PAGES = 3;
    const collected: BlockfrostUtxoEntry[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const url = `${this.baseUrl}/addresses/${encodeURIComponent(
        address,
      )}/utxos?count=${PAGE_SIZE}&page=${page}`;
      const res = await this.fetchImpl(url, {
        headers: this.headers(),
      });

      if (res.status === 404) {
        // Address has no on-chain activity yet.
        return [];
      }
      if (!res.ok) {
        const body = await safeText(res);
        throw new IndexerError(
          `Blockfrost ${this.network} returned ${res.status} ${res.statusText} for ${address} utxos. ${body}`,
          undefined,
          this.name,
          'HttpError',
        );
      }

      const batch = (await res.json()) as BlockfrostUtxoEntry[];
      collected.push(...batch);
      if (batch.length < PAGE_SIZE) break; // last page
    }

    return collected.map((entry) => parseBlockfrostUtxo(entry, address));
  }

  async getLatestBlock(): Promise<BlockInfo> {
    const url = `${this.baseUrl}/blocks/latest`;
    const res = await this.fetchImpl(url, {
      headers: this.headers(),
    });
    if (!res.ok) {
      const body = await safeText(res);
      throw new IndexerError(
        `Blockfrost ${this.network} returned ${res.status} ${res.statusText} for /blocks/latest. ${body}`,
        undefined,
        this.name,
        'HttpError',
      );
    }
    const data = (await res.json()) as BlockfrostBlockResponse;
    return {
      chain: 'cardano',
      hash: data.hash,
      height: data.height,
      slot: data.slot,
      time: data.time,
      epoch: data.epoch,
    };
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    // Blockfrost doesn't have a single "network summary" endpoint; we derive one
    // from `/blocks/latest`. We avoid the heavier `/network` endpoint because it
    // returns supply/stake data we don't need for diagnostics.
    const latest = await this.getLatestBlock();
    const nowSec = Math.floor(Date.now() / 1000);
    const msSinceLastBlock = Math.max(0, (nowSec - latest.time) * 1000);

    return {
      chain: 'cardano',
      network: this.network,
      latestBlock: latest,
      msSinceLastBlock,
      healthy: msSinceLastBlock < CARDANO_STALL_THRESHOLD_MS,
    };
  }

  async healthcheck(): Promise<boolean> {
    try {
      const res = await this.fetchImpl(`${this.baseUrl}/health`, {
        headers: this.headers(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Cardano's expected block cadence is ~20 seconds. If the latest block is
 * more than ~2 minutes old we consider the chain (or indexer) stalled for UX
 * purposes. Tuneable per milestone as real-world telemetry comes in.
 */
const CARDANO_STALL_THRESHOLD_MS = 2 * 60 * 1000;

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

interface BlockfrostUtxoEntry {
  tx_hash: string;
  tx_index: number;
  output_index: number;
  amount: BlockfrostAmount[];
  block: string;
  data_hash: string | null;
  inline_datum: string | null;
  reference_script_hash: string | null;
}

interface BlockfrostBlockResponse {
  time: number;
  height: number;
  hash: string;
  slot: number;
  epoch: number;
  epoch_slot: number;
  size: number;
  tx_count: number;
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

function parseBlockfrostUtxo(entry: BlockfrostUtxoEntry, address: string): Utxo {
  const lovelace = entry.amount.find((a) => a.unit === 'lovelace');
  const nativeAmount = lovelace?.quantity ?? '0';

  const assets = entry.amount
    .filter((a) => a.unit !== 'lovelace')
    .map((a) => {
      const assetNameHex = a.unit.slice(56);
      const assetName = hexToAscii(assetNameHex) || assetNameHex;
      return {
        assetId: a.unit,
        symbol: assetName,
        amount: a.quantity,
        decimals: 0,
      };
    });

  return {
    chain: 'cardano',
    txHash: entry.tx_hash,
    outputIndex: entry.output_index,
    address,
    amount: nativeAmount,
    assets: assets.length > 0 ? assets : undefined,
    datum: entry.inline_datum ?? entry.data_hash ?? undefined,
    scriptRef: entry.reference_script_hash ?? undefined,
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
