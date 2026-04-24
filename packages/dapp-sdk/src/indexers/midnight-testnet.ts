import type { Balance, MidnightNetwork } from '@cmm/shared';
import { MIDNIGHT_NATIVE_SYMBOL, MIDNIGHT_DECIMALS } from '@cmm/shared';
import type { IndexerAdapter } from './interface';

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

  constructor(opts: MidnightTestnetOptions = {}) {
    this.network = opts.network ?? 'testnet-02';
    this.name = `midnight-indexer-${this.network}`;
    // NOTE: `indexerUrl` and `fetchImpl` intentionally unused in the M1 stub.
    // They'll be wired into the GraphQL client at M2 once the Snap exposes
    // a viewing key. Accepting them now keeps the public API stable.
    void opts.indexerUrl;
    void opts.fetchImpl;
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

  async healthcheck(): Promise<boolean> {
    // TODO(M2): ping the GraphQL `/health` endpoint once we wire it.
    return true;
  }
}
