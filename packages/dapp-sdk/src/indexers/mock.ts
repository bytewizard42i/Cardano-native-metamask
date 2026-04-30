import type { Balance, BlockInfo, ChainId, NetworkInfo, Utxo } from '@cmm/shared';
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

  async getUtxos(address: string): Promise<Utxo[]> {
    // Deterministic fixture UTXOs so snapshots stay stable across runs.
    if (this.chain === 'cardano') {
      return [
        {
          chain: 'cardano',
          txHash: '4200000000000000000000000000000000000000000000000000000000000001',
          outputIndex: 0,
          address,
          amount: '2500000000', // 2,500 ADA
        },
        {
          chain: 'cardano',
          txHash: '4200000000000000000000000000000000000000000000000000000000000002',
          outputIndex: 1,
          address,
          amount: '1700000000', // 1,700 ADA + SNEK
          assets: [
            {
              assetId:
                '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f534e454b',
              symbol: 'SNEK',
              amount: '1337',
              decimals: 0,
            },
          ],
        },
      ];
    }
    // midnight: shielded UTXOs are opaque in fixture mode, so surface a single
    // commitment-style entry with the `shielded` flag. Matches what M2+ decrypt
    // flows will later produce.
    return [
      {
        chain: 'midnight',
        txHash: '0000000000000000000000000000000000000000000000000000000000000042',
        outputIndex: 0,
        address,
        amount: '1234567890',
        shielded: true,
      },
    ];
  }

  async getLatestBlock(): Promise<BlockInfo> {
    // Fixture block: height 12_345_678 at epoch-ish time. Stable across calls.
    const base = this.chain === 'cardano' ? 12_345_678 : 7_654_321;
    return {
      chain: this.chain,
      hash:
        this.chain === 'cardano'
          ? 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
          : 'cafebabe00000000cafebabe00000000cafebabe00000000cafebabe00000000',
      height: base,
      time: 1_700_000_000, // Frozen unix timestamp for determinism
      epoch: this.chain === 'cardano' ? 500 : undefined,
    };
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    const latest = await this.getLatestBlock();
    return {
      chain: this.chain,
      network: this.chain === 'cardano' ? 'preprod' : 'testnet-02',
      era: this.chain === 'cardano' ? 'Conway' : 'Ariadne',
      latestBlock: latest,
      msSinceLastBlock: 500, // fake "half a second ago" freshness
      healthy: true,
    };
  }

  async healthcheck(): Promise<boolean> {
    return true;
  }
}
