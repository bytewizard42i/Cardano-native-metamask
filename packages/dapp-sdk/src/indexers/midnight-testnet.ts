import type { Balance, BlockInfo, MidnightNetwork, NetworkInfo, Utxo } from '@cmm/shared';
import { MIDNIGHT_NATIVE_SYMBOL, MIDNIGHT_DECIMALS } from '@cmm/shared';
import { IndexerError, type IndexerAdapter } from './interface';

/**
 * Default public endpoint for the Midnight testnet-02 indexer.
 * Overridable at construction time for staging / self-hosted runs.
 */
const DEFAULT_MIDNIGHT_INDEXER_URL =
  'https://indexer.testnet-02.midnight.network/api/v1/graphql';

/**
 * Midnight testnet indexer — **stub for M1**.
 *
 * IMPORTANT: Midnight balances are genuinely different from Cardano:
 * on-chain amounts are encrypted in zero-knowledge commitments. A real
 * balance read requires the user's viewing key, which only the Snap will
 * have access to (M2+). Therefore in M1 this indexer intentionally
 * returns a "ciphertext-opaque" placeholder for the native amount.
 *
 * M2 roadmap: rewrite this to:
 *   1. Accept a viewing key obtained from the Snap via `midnight_getViewingKey`
 *   2. Query `indexer.testnet-02.midnight.network/api/v1/graphql` for the
 *      user's UTXOs
 *   3. Locally decrypt commitments using the viewing key
 *   4. Sum unspent outputs → real balance
 *
 * Until then this class's only legitimate use is letting the companion-dApp
 * render "balance: encrypted (requires Snap)" without breaking the UX.
 */
export interface MidnightTestnetOptions {
  /**
   * Which Midnight network. Defaults to `testnet-02` (the current public testnet).
   */
  network?: MidnightNetwork;

  /**
   * Optional indexer base URL override.
   */
  indexerUrl?: string;

  fetchImpl?: typeof fetch;
}

export class MidnightTestnetIndexer implements IndexerAdapter {
  public readonly name: string;
  public readonly chain = 'midnight' as const;

  private readonly network: MidnightNetwork;
  private readonly indexerUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: MidnightTestnetOptions = {}) {
    this.network = opts.network ?? 'testnet-02';
    this.indexerUrl = opts.indexerUrl ?? DEFAULT_MIDNIGHT_INDEXER_URL;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.name = `midnight-indexer-${this.network}`;
  }

  async getBalance(address: string): Promise<Balance> {
    // M1 stub: the real balance is behind a viewing key we don't have yet.
    // We return a sentinel `"encrypted"` string so the UI can special-case
    // rendering. Downstream components MUST check `amount === 'encrypted'`
    // and display "Install CMM Snap to decrypt" rather than `NaN NIGHT`.
    return {
      chain: 'midnight',
      network: this.network,
      address,
      native: {
        assetId: 'night',
        symbol: MIDNIGHT_NATIVE_SYMBOL,
        amount: 'encrypted',
        decimals: MIDNIGHT_DECIMALS,
        shielded: true,
      },
      assets: [],
    };
  }

  async getUtxos(_address: string): Promise<Utxo[]> {
    // Shielded UTXOs are encrypted commitments. Reading them requires the
    // user's viewing key, which only the Snap will have (M2+).
    throw new IndexerError(
      'Midnight UTXOs require a viewing key from the CMM Snap. Available in M2+.',
      undefined,
      this.name,
      'NotAvailableYet',
    );
  }

  async getLatestBlock(): Promise<BlockInfo> {
    // Block heights on Midnight are public state — no viewing key needed.
    // Use a small GraphQL introspection-free query. If the Midnight indexer
    // schema shifts between M1 and M2 we can adjust without widening scope.
    const query = '{ block { height hash timestamp } }';
    const res = await this.fetchImpl(this.indexerUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      throw new IndexerError(
        `Midnight indexer returned ${res.status} ${res.statusText} for latest block.`,
        undefined,
        this.name,
        'HttpError',
      );
    }
    type GraphQLResp = {
      data?: { block?: { height: number; hash: string; timestamp: number | string } };
      errors?: Array<{ message: string }>;
    };
    const payload = (await res.json()) as GraphQLResp;
    if (payload.errors?.length) {
      throw new IndexerError(
        `Midnight indexer GraphQL errors: ${payload.errors.map((e) => e.message).join('; ')}`,
        undefined,
        this.name,
        'ParseError',
      );
    }
    const b = payload.data?.block;
    if (!b || typeof b.height !== 'number' || typeof b.hash !== 'string') {
      throw new IndexerError(
        'Midnight indexer returned an unexpected shape for latest block.',
        undefined,
        this.name,
        'ParseError',
      );
    }
    // Timestamp may arrive as ISO string or unix-seconds depending on indexer version.
    const time =
      typeof b.timestamp === 'number'
        ? b.timestamp
        : Math.floor(Date.parse(b.timestamp) / 1000);
    return {
      chain: 'midnight',
      hash: b.hash,
      height: b.height,
      time: Number.isFinite(time) ? time : 0,
    };
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    // Try to fetch the latest block. If the indexer is down or the schema has
    // drifted, we still return a useful network descriptor marked unhealthy
    // rather than throwing — the MidnightVitals panel needs to render something.
    try {
      const latest = await this.getLatestBlock();
      const nowSec = Math.floor(Date.now() / 1000);
      const msSinceLastBlock = Math.max(0, (nowSec - latest.time) * 1000);
      return {
        chain: 'midnight',
        network: this.network,
        latestBlock: latest,
        msSinceLastBlock,
        healthy: msSinceLastBlock < MIDNIGHT_STALL_THRESHOLD_MS,
      };
    } catch {
      const ok = await this.healthcheck();
      return { chain: 'midnight', network: this.network, healthy: ok };
    }
  }

  async healthcheck(): Promise<boolean> {
    // Minimal POST with an empty query; a running GraphQL server returns 400
    // or 200 with a schema error — both mean the process is up. Network-level
    // failures throw and we report false.
    try {
      const res = await this.fetchImpl(this.indexerUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{__typename}' }),
      });
      // 2xx, 4xx (schema errors) all mean server is reachable.
      return res.status < 500;
    } catch {
      return false;
    }
  }
}

/**
 * Midnight targets ~6s block times on testnet. Allow 2 minutes of slack
 * before we start calling a chain "stalled" in diagnostic UIs.
 */
const MIDNIGHT_STALL_THRESHOLD_MS = 2 * 60 * 1000;
