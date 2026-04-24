import type { Balance, ChainId } from '@cmm/shared';
import type { IndexerAdapter } from './interface';

/**
 * Returns deterministic fixture balances, indistinguishable in shape from
 * a real indexer response. Used for demoland, tests, and storybook.
 *
 * Fixture values are chosen to be memorable and obviously synthetic so no
 * one mistakes them for real funds:
 *   - Cardano: 4,200.000000 ADA + 1,337 SNEK
 *   - Midnight: 1,234.567890 NIGHT (shielded) + 98.765432 DUST
 */
export class MockIndexer implements IndexerAdapter {
  public readonly name = 'mock-indexer';

  constructor(public readonly chain: ChainId) {}

  async getBalance(address: string): Promise<Balance> {
    if (this.chain === 'cardano') {
      return {
        chain: 'cardano',
        network: 'preprod',
        address,
        native: {
          assetId: 'lovelace',
          symbol: 'ADA',
          amount: '4200000000', // 4,200.000000 ADA
          decimals: 6,
        },
        assets: [
          {
            assetId:
              '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f534e454b',
            symbol: 'SNEK',
            amount: '1337',
            decimals: 0,
          },
        ],
      };
    }

    // midnight
    return {
      chain: 'midnight',
      network: 'testnet-02',
      address,
      native: {
        assetId: 'night',
        symbol: 'NIGHT',
        amount: '1234567890',
        decimals: 6,
        shielded: true,
      },
      assets: [
        {
          assetId: 'dust',
          symbol: 'DUST',
          amount: '98765432',
          decimals: 6,
          shielded: true,
        },
      ],
    };
  }

  async healthcheck(): Promise<boolean> {
    return true;
  }
}
