import type { JsonRpcRequest } from '@metamask/snaps-sdk';
import { CHAINS, CMM_BRAND, CMM_LONG_NAME } from '@cmm/shared';

export type HandlerArgs = {
  origin: string;
  request: JsonRpcRequest;
};

/**
 * Common / cross-chain RPC methods.
 *
 * Scope M0: return static brand + supported chain info.
 */
export async function handleCommon({ request }: HandlerArgs): Promise<unknown> {
  switch (request.method) {
    case 'common_getSupportedChains':
      return { chains: CHAINS };

    case 'common_getBrand':
      return { brand: CMM_BRAND, longName: CMM_LONG_NAME };

    default:
      throw new Error(`CMM: unknown common method "${request.method}"`);
  }
}
