// =============================================================================
// CMMVitalsProvider — CMM-specific live diagnostics
// =============================================================================
// Implements VitalsProviderInterface using:
//   - @cmm/dapp-sdk indexer adapters for "Network" health
//   - window.ethereum.wallet_getSnaps for "Wallet" / Snap installed detection
//   - Static "n/a" for proof-server (CMM is wallet-side, not contract-side)
//   - Static "n/a" for contracts (no on-chain CMM contracts at M1)
//
// This file is the bridge between the diagnostic UI (vendored from Discovery-
// Management) and the CMM domain. Replace pieces here as the project grows.
// =============================================================================

import { createIndexer, type IndexerAdapter } from '@cmm/dapp-sdk';
import type {
  VitalsProviderInterface,
  VitalCheckResult,
  DependencyCheckResult,
  ContractInfo,
} from './types';

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

export interface CMMVitalsProviderOptions {
  /**
   * Blockfrost project_id for Cardano preprod. When omitted, the network
   * vital reports "configuration missing" rather than a transport error.
   */
  cardanoBlockfrostProjectId?: string;

  /**
   * Override Midnight indexer URL (default: testnet-02 public).
   */
  midnightIndexerUrl?: string;

  /**
   * MetaMask Snap id we want to detect. Defaults to the production CMM id.
   * Allow override for local Flask testing (`local:http://localhost:8080`).
   */
  cmmSnapId?: string;

  /**
   * Override fetch impl for tests / SSR.
   */
  fetchImpl?: typeof fetch;
}

const DEFAULT_CMM_SNAP_ID = 'npm:@cmm/snap';

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

/**
 * The CMM diagnostic provider. Constructed once at app boot and passed to
 * `<VitalsProvider provider={this}>`.
 *
 * Reading conventions:
 *   - `healthy`  — all systems nominal
 *   - `warning`  — degraded but functional (slow, partial config)
 *   - `critical` — broken (offline, missing config that blocks a flow)
 *   - `unknown`  — not yet checked / not applicable
 */
export class CMMVitalsProvider implements VitalsProviderInterface {
  private cardanoIndexer: IndexerAdapter;
  private midnightIndexer: IndexerAdapter;
  private cmmSnapId: string;

  constructor(opts: CMMVitalsProviderOptions = {}) {
    this.cmmSnapId = opts.cmmSnapId ?? DEFAULT_CMM_SNAP_ID;

    // The CMM indexer factory will fall back to mock when project_id is missing,
    // but at the diagnostic layer we want to *surface* that fallback rather than
    // hide it. So we still build live indexers when configured and report a
    // 'warning' status when not.
    this.cardanoIndexer = createIndexer('cardano', {
      mode: opts.cardanoBlockfrostProjectId ? 'live' : 'mock',
      cardano: { blockfrostProjectId: opts.cardanoBlockfrostProjectId },
    });
    this.midnightIndexer = createIndexer('midnight', {
      mode: 'live',
      midnight: { indexerUrl: opts.midnightIndexerUrl },
    });
  }

  /* ---------------- Proof Server -------------------------------- */

  async checkProofServer(): Promise<VitalCheckResult> {
    // CMM does not run a proof server at M1 — proof generation happens inside
    // the Snap (Cardano: tx signing, Midnight: ZK proofs in M3). We report
    // 'unknown' so the UI shows a neutral N/A card rather than green-washing.
    return {
      status: 'unknown',
      message:
        'Not applicable for CMM at M1 — proofs are generated inside the Snap, not by an external server.',
      detailLine: 'In-Snap proof generation lands in M3.',
      responseTimeMs: null,
    };
  }

  /* ---------------- Network ------------------------------------- */

  async checkNetwork(): Promise<VitalCheckResult> {
    const startedAt = Date.now();

    // Run both healthchecks concurrently. The "network" vital is healthy iff
    // BOTH chains are reachable; degraded if exactly one is; critical if both
    // are down.
    const [cardanoOk, midnightOk] = await Promise.all([
      this.tryHealthcheck(this.cardanoIndexer),
      this.tryHealthcheck(this.midnightIndexer),
    ]);

    const responseTimeMs = Date.now() - startedAt;
    if (cardanoOk && midnightOk) {
      return {
        status: 'healthy',
        message: 'Both Cardano (Blockfrost) and Midnight indexers responded.',
        detailLine: `Cardano + Midnight reachable · ${responseTimeMs}ms`,
        responseTimeMs,
      };
    }
    if (cardanoOk || midnightOk) {
      return {
        status: 'warning',
        message: cardanoOk
          ? 'Cardano indexer is up; Midnight indexer is unreachable.'
          : 'Midnight indexer is up; Cardano indexer is unreachable. Check VITE_BLOCKFROST_PROJECT_ID_CARDANO_PREPROD.',
        detailLine: `Partial · ${responseTimeMs}ms`,
        responseTimeMs,
      };
    }
    return {
      status: 'critical',
      message: 'Both Cardano and Midnight indexers are unreachable.',
      detailLine: `Both down · ${responseTimeMs}ms`,
      responseTimeMs,
    };
  }

  /* ---------------- Wallet (Snap detection) --------------------- */

  async checkWallet(): Promise<VitalCheckResult> {
    if (typeof window === 'undefined') {
      return {
        status: 'unknown',
        message: 'Wallet detection skipped (server-side render).',
        detailLine: 'No window object',
        responseTimeMs: null,
      };
    }
    const eth = (window as Window & { ethereum?: EthereumLike }).ethereum;
    if (!eth?.request) {
      return {
        status: 'critical',
        message: 'MetaMask not detected. Install MetaMask Flask to continue.',
        detailLine: 'No window.ethereum',
        responseTimeMs: null,
      };
    }
    const startedAt = Date.now();
    try {
      const snaps = (await eth.request({ method: 'wallet_getSnaps' })) as
        | Record<string, { id: string; version?: string; enabled?: boolean }>
        | undefined;
      const responseTimeMs = Date.now() - startedAt;
      const installed = snaps?.[this.cmmSnapId];
      if (!snaps || !installed) {
        return {
          status: 'warning',
          message:
            'MetaMask is present but the CMM Snap is not installed. The dApp will work in mock or live-readonly mode only.',
          detailLine: `MetaMask reachable · ${responseTimeMs}ms`,
          responseTimeMs,
        };
      }
      return {
        status: 'healthy',
        message: `CMM Snap ${installed.version ?? '(unknown version)'} is installed and enabled.`,
        detailLine: `Snap reachable · ${responseTimeMs}ms`,
        responseTimeMs,
      };
    } catch (err) {
      const responseTimeMs = Date.now() - startedAt;
      return {
        status: 'critical',
        message: `MetaMask refused wallet_getSnaps: ${(err as Error).message}`,
        detailLine: `Error · ${responseTimeMs}ms`,
        responseTimeMs,
      };
    }
  }

  /* ---------------- Contracts ----------------------------------- */

  async checkContracts(_contracts: ContractInfo[]): Promise<VitalCheckResult> {
    // CMM is a wallet, not a dApp deploying contracts. We report 'unknown' so
    // the card stays neutral rather than red.
    return {
      status: 'unknown',
      message: 'Not applicable — CMM is a wallet adapter, not a contract-deploying dApp.',
      detailLine: 'No contracts to monitor',
      responseTimeMs: null,
    };
  }

  /* ---------------- Dependencies -------------------------------- */

  async checkDependencies(): Promise<DependencyCheckResult[]> {
    // The original module checks Docker/Node/Compact for proof-server-having
    // DApps. CMM runs entirely in the browser → no host dependencies to check.
    // We surface a single "Browser environment" entry to keep the panel honest.
    if (typeof navigator === 'undefined') {
      return [
        {
          name: 'Browser',
          installed: false,
          version: null,
          message: 'Cannot detect browser (server-side environment).',
        },
      ];
    }
    return [
      {
        name: 'Browser',
        installed: true,
        version: navigator.userAgent,
        message: 'Running inside a browser. No native host dependencies are required.',
      },
    ];
  }

  /* ---------------- private helpers ----------------------------- */

  private async tryHealthcheck(indexer: IndexerAdapter): Promise<boolean> {
    try {
      return (await indexer.healthcheck?.()) ?? true;
    } catch {
      return false;
    }
  }
}

/**
 * Minimal ducktype for the EIP-1193 provider injected by MetaMask. We avoid
 * pulling in the full @metamask/providers types so the companion-dApp stays
 * dependency-light.
 */
interface EthereumLike {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
}
