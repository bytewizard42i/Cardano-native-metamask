/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BLOCKFROST_PROJECT_ID_CARDANO_PREPROD?: string;
  readonly VITE_BLOCKFROST_PROJECT_ID_CARDANO_MAINNET?: string;
  readonly VITE_DEMO_CARDANO_ADDRESS?: string;
  readonly VITE_DEMO_MIDNIGHT_ADDRESS?: string;
  readonly VITE_MIDNIGHT_INDEXER_URL?: string;
  readonly VITE_CMM_ADAPTER_MODE?: 'mock' | 'live-readonly' | 'auto' | 'real';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
