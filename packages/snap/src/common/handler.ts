import type { Json, JsonRpcRequest } from '@metamask/snaps-sdk';
import { CHAINS, CMM_BRAND, CMM_LONG_NAME } from '@cmm/shared';
import { UnknownMethodError } from './errors';

export type HandlerArgs = {
  origin: string;
  request: JsonRpcRequest;
};

export type HandlerResult = Promise<Json>;

/**
 * Common / cross-chain RPC methods.
 *
 * M1 live methods:
 *   - common_getSupportedChains → list of chain IDs CMM serves
 *   - common_getBrand           → brand + long-name strings
 *   - common_getCapabilities    → feature flags the dApp can branch on
 */
export async function handleCommon({ request }: HandlerArgs): HandlerResult {
  switch (request.method) {
    case 'common_getSupportedChains':
      return { chains: [...CHAINS] };

    case 'common_getBrand':
      return { brand: CMM_BRAND, longName: CMM_LONG_NAME };

    case 'common_getCapabilities':
      return {
        milestone: 'M1',
        capabilities: {
          cardano: {
            getPublicKey: true,
            getAddress: true,
            signTx: false, // M3
            submitTx: false, // M3
          },
          midnight: {
            getPublicKey: true,
            getAddress: 'placeholder', // M1 stub encoding — see docs/BUILD_STRATEGY.md
            getBalance: false, // M2 (needs viewing key)
            signTx: false, // M3
          },
        },
      };

    default:
      throw new UnknownMethodError(request.method);
  }
}
