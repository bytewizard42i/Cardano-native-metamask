import {
  createSnapAdapter,
  type AdapterMode,
  type SnapAdapter,
} from '@cmm/dapp-sdk';

/**
 * One place to resolve the dApp's adapter. Reads:
 *
 * 1. `VITE_CMM_ADAPTER_MODE` env override (forces a mode for demos)
 * 2. Explicit `mode` argument
 * 3. Falls back to `mock`
 *
 * And wires Blockfrost / demo-address env vars into the `live-readonly` mode
 * so no component needs to know about `import.meta.env`.
 */
export function resolveAdapter(mode?: AdapterMode): SnapAdapter {
  const envMode = import.meta.env.VITE_CMM_ADAPTER_MODE;
  const finalMode: AdapterMode = envMode ?? mode ?? 'mock';

  return createSnapAdapter(finalMode, {
    liveReadonly: {
      indexerConfig: {
        mode: 'auto',
        cardano: {
          network: 'preprod',
          blockfrostProjectId:
            import.meta.env.VITE_BLOCKFROST_PROJECT_ID_CARDANO_PREPROD,
        },
        midnight: {
          network: 'testnet-02',
          indexerUrl: import.meta.env.VITE_MIDNIGHT_INDEXER_URL,
        },
      },
      demoAddresses: {
        cardano: import.meta.env.VITE_DEMO_CARDANO_ADDRESS,
        midnight: import.meta.env.VITE_DEMO_MIDNIGHT_ADDRESS,
      },
    },
  });
}

/**
 * Whether Cardano live-readonly data is configured (Blockfrost PID + demo addr).
 * Used by the UI to decide if the "Live data" toggle can be enabled.
 */
export function hasLiveCardanoConfig(): boolean {
  return Boolean(
    import.meta.env.VITE_BLOCKFROST_PROJECT_ID_CARDANO_PREPROD &&
      import.meta.env.VITE_DEMO_CARDANO_ADDRESS,
  );
}
