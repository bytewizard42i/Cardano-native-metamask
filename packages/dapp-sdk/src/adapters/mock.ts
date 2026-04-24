import type { Balance, ChainId, SignedTx, TxPayload } from '@cmm/shared';
import type { SnapAdapter } from '../adapter.js';

/**
 * Mock adapter — returns deterministic fixtures so the companion dApp
 * (and any downstream dApp) can render a complete UX without a real Snap
 * installed.
 *
 * This is the demoland. Swap in `realAdapter` to graduate to live calls.
 */
const FIXTURES = {
  midnight: {
    address: 'mn_shielded_1qz...example...7ha0',
    balance: {
      chain: 'midnight' as ChainId,
      address: 'mn_shielded_1qz...example...7ha0',
      native: {
        assetId: 'night',
        symbol: 'NIGHT',
        decimals: 6,
        amount: '1234567890',
        shielded: true,
      },
      assets: [
        {
          assetId: 'dust',
          symbol: 'DUST',
          decimals: 6,
          amount: '98765432',
        },
      ],
    } satisfies Balance,
  },
  cardano: {
    address:
      'addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2x8agz',
    balance: {
      chain: 'cardano' as ChainId,
      address:
        'addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2x8agz',
      native: {
        assetId: 'lovelace',
        symbol: 'ADA',
        decimals: 6,
        amount: '4200000000',
      },
      assets: [
        {
          assetId:
            '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f.534e454b',
          symbol: 'SNEK',
          decimals: 0,
          amount: '1337',
        },
      ],
    } satisfies Balance,
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const mockAdapter: SnapAdapter = {
  async isInstalled(): Promise<boolean> {
    return true;
  },

  async connect(): Promise<void> {
    await delay(300);
  },

  async getAddress(chain: ChainId): Promise<string> {
    await delay(150);
    return FIXTURES[chain].address;
  },

  async getBalance(chain: ChainId): Promise<Balance> {
    await delay(300);
    return FIXTURES[chain].balance;
  },

  async signTransaction(tx: TxPayload): Promise<SignedTx> {
    await delay(600);
    return {
      chain: tx.chain,
      signed: `MOCK_SIGNED_TX_${tx.chain}_${Date.now().toString(36)}`,
      txHash: `mock_hash_${Math.random().toString(36).slice(2, 10)}`,
    };
  },

  async submitTransaction(signed: SignedTx): Promise<{ txHash: string }> {
    await delay(400);
    return { txHash: signed.txHash ?? `mock_submitted_${Date.now().toString(36)}` };
  },
};
