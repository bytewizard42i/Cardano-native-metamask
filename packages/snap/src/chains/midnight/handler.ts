import type { HandlerArgs } from '../../common/handler.js';

/**
 * Midnight RPC handler.
 *
 * Scope M0: stub responses with milestone hints.
 *  - M1: dApp-side mocks only (this handler unchanged)
 *  - M2: `midnight_getAddress` and `midnight_getBalance` go real
 *  - M3: `midnight_signTx` + `midnight_generateProof` + `midnight_submitTx` go real
 */
export async function handleMidnight({ request }: HandlerArgs): Promise<unknown> {
  switch (request.method) {
    case 'midnight_getAddress':
    case 'midnight_getBalance':
      throw new Error(
        `CMM: Midnight method "${request.method}" lands in milestone M2. ` +
          `See docs/BUILD_STRATEGY.md.`,
      );

    case 'midnight_signTx':
    case 'midnight_generateProof':
    case 'midnight_submitTx':
    case 'midnight_exportViewingKey':
    case 'midnight_scanShielded':
      throw new Error(
        `CMM: Midnight method "${request.method}" lands in milestone M3. ` +
          `See docs/BUILD_STRATEGY.md.`,
      );

    default:
      throw new Error(`CMM: unknown Midnight method "${request.method}"`);
  }
}
