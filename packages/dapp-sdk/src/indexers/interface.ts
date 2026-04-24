import type { Balance, ChainId } from '@cmm/shared';

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
 * M1 scope: just `getBalance`. Extend with `getUtxos`, `getTxHistory`,
 * `submitTx` in later milestones.
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
   * Optional health-check. Implementations should return `true` if a basic
   * request succeeds, `false` otherwise. Used to decide fallback in auto-mode.
   */
  healthcheck?(): Promise<boolean>;
}

export class IndexerError extends Error {
  public override readonly cause?: unknown;
  public readonly indexer?: string;

  constructor(message: string, cause?: unknown, indexer?: string) {
    super(message);
    this.name = 'IndexerError';
    this.cause = cause;
    this.indexer = indexer;
  }
}
