import type { CardanoNetwork, ChainId, MidnightNetwork } from '@cmm/shared';
import { BlockfrostCardanoIndexer } from './blockfrost-cardano';
import type { IndexerAdapter } from './interface';
import { MidnightTestnetIndexer } from './midnight-testnet';
import { MockIndexer } from './mock';

export type IndexerMode = 'mock' | 'live' | 'auto';

export interface IndexerConfig {
  /**
   * - `mock`: always return fixtures (default for SSR, demoland, tests)
   * - `live`: always use the real indexers (requires env/config)
   * - `auto`: use live when credentials are present, fall back to mock otherwise
   */
  mode?: IndexerMode;

  cardano?: {
    network?: CardanoNetwork;
    blockfrostProjectId?: string;
    /**
     * Optional proxy URL that hides the Blockfrost project_id server-side.
     * When set, the dApp does NOT need a projectId — the proxy injects the
     * `project_id` header on its end. See `apps/proxy/` for a Vercel deployment.
     */
    blockfrostProxyUrl?: string;
  };

  midnight?: {
    network?: MidnightNetwork;
    indexerUrl?: string;
  };
}

/**
 * Pick the right indexer for a given chain based on mode + available creds.
 *
 * This is the only entry point the dApp should use. Individual indexer
 * classes stay internal to this package.
 */
export function createIndexer(chain: ChainId, cfg: IndexerConfig = {}): IndexerAdapter {
  const mode: IndexerMode = cfg.mode ?? 'auto';

  if (mode === 'mock') return new MockIndexer(chain);

  if (chain === 'cardano') {
    const pid = cfg.cardano?.blockfrostProjectId;
    const proxyUrl = cfg.cardano?.blockfrostProxyUrl;
    const hasCreds = Boolean(pid) || Boolean(proxyUrl);
    if (mode === 'live' && !hasCreds) {
      throw new Error(
        'createIndexer: mode=live requires either cardano.blockfrostProjectId ' +
          'or cardano.blockfrostProxyUrl. Set ' +
          'VITE_BLOCKFROST_PROJECT_ID_CARDANO_PREPROD in .env.local for dev, ' +
          'or VITE_BLOCKFROST_PROXY_URL_CARDANO_PREPROD for production.',
      );
    }
    if (!hasCreds) return new MockIndexer(chain); // auto-fallback
    return new BlockfrostCardanoIndexer({
      projectId: pid, // may be undefined when proxyUrl is set
      baseUrl: proxyUrl, // proxy mode: empty pid + baseUrl set
      network: cfg.cardano?.network ?? 'preprod',
    });
  }

  // midnight
  if (mode === 'live') {
    return new MidnightTestnetIndexer({
      network: cfg.midnight?.network ?? 'testnet-02',
      indexerUrl: cfg.midnight?.indexerUrl,
    });
  }
  // auto: Midnight real balance needs a Snap-provided viewing key (M2), so
  // we fall back to mock for now even when an indexer URL is present.
  return new MockIndexer(chain);
}
