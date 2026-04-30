import type { Balance, BlockInfo, ChainId, NetworkInfo, Utxo } from '@cmm/shared';

/**
 * Minimal read-only chain indexer.
 *
 * Lives in the dApp layer, not the Snap. This keeps secrets (API keys) out
 * of the Snap sandbox and keeps the Snap's audit scope narrow.
 *
 * Each chain has its own preferred indexer:
 * - Cardano → Blockfrost (or Koios fallback later)
 * - Midnight → official testnet-02 indexer GraphQL
 *
 * M1 scope:
 *   - `getBalance` — live for Cardano, placeholder for Midnight
 *   - `getUtxos` — live for Cardano, throws `NotAvailableYet` for Midnight
 *   - `getLatestBlock` / `getNetworkInfo` — live for Cardano, stubbed for Midnight
 *   - `healthcheck` — live on both
 *
 * Later milestones will add `getTxHistory` and `submitTx`.
 */
export interface IndexerAdapter {
  /**
   * Human-readable name for diagnostics and error surfaces.
   */
  readonly name: string;

  /**
   * Which chain this indexer services.
   */
  readonly chain: ChainId;

  /**
   * Fetch the current balance for a given address.
   *
   * @throws {IndexerError} on network / API failures
   */
  getBalance(address: string): Promise<Balance>;

  /**
   * Fetch unspent outputs for a given address.
   *
   * For Cardano: returns live UTXOs via Blockfrost `/addresses/{addr}/utxos`.
   * For Midnight (M1): throws {@link IndexerError} with code `NotAvailableYet`
   * because reading shielded UTXOs requires a viewing key (M2+).
   *
   * @throws {IndexerError} on network / API failures, or when unsupported on the chain.
   */
  getUtxos(address: string): Promise<Utxo[]>;

  /**
   * Fetch the latest known block from the indexer.
   * Used both for freshness indication and for the MidnightVitals stall detector.
   *
   * @throws {IndexerError} on network / API failures
   */
  getLatestBlock(): Promise<BlockInfo>;

  /**
   * Fetch an overall network snapshot (era, latest block, health).
   * This is the single call the companion-dApp and MidnightVitals panel use
   * to render the "Network" card, so implementations should keep it cheap.
   *
   * @throws {IndexerError} on network / API failures
   */
  getNetworkInfo(): Promise<NetworkInfo>;

  /**
   * Optional health-check. Implementations should return `true` if a basic
   * request succeeds, `false` otherwise. Used to decide fallback in auto-mode
   * and to power the MidnightVitals "Network" vital.
   */
  healthcheck?(): Promise<boolean>;
}

/**
 * Stable error codes emitted by indexer adapters. UIs branch on these, never
 * on message strings.
 */
export type IndexerErrorCode =
  | 'NetworkError'
  | 'HttpError'
  | 'ConfigError'
  | 'ParseError'
  | 'NotAvailableYet';

export class IndexerError extends Error {
  public override readonly cause?: unknown;
  public readonly indexer?: string;
  public readonly code?: IndexerErrorCode;

  constructor(
    message: string,
    cause?: unknown,
    indexer?: string,
    code?: IndexerErrorCode,
  ) {
    super(message);
    this.name = 'IndexerError';
    this.cause = cause;
    this.indexer = indexer;
    this.code = code;
  }
}
