/**
 * End-to-end RPC integration test.
 *
 * This is the ONLY test that exercises the real Snap entry point through
 * `@metamask/snaps-jest`'s sandboxed runtime. Per `TESTING_STRATEGY.md`
 * we keep it focused: one method per `it`, fixed mnemonic, no live
 * network. Coverage of corner-case validation lives in unit tests.
 *
 * **Pattern reference:**
 *   `references/metamask-snap-bitcoin-wallet/packages/snap/integration-test/
 *    client-request.test.ts`
 *
 * **Setup:** `installSnap({ options: { secretRecoveryPhrase: TEST_MNEMONIC } })`
 * boots the Snap with a deterministic seed. Every key/address derived
 * inside the test is reproducible from a published mnemonic.
 */

import { describe, expect, it, beforeAll } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';
import type { Snap } from '@metamask/snaps-jest';

import { RpcMethod, TEST_MNEMONIC, TEST_ORIGIN } from './constants';
import { MIDNIGHT_EXPECTED } from './expected-vectors';

describe('CMM Snap — onRpcRequest end-to-end', () => {
  let snap: Snap;

  beforeAll(async () => {
    snap = await installSnap({
      options: {
        secretRecoveryPhrase: TEST_MNEMONIC,
      },
    });
  });

  // ---- common_* ----------------------------------------------------------

  describe('common_*', () => {
    it('common_getCapabilities → milestone M1 + correct flags', async () => {
      const response = await snap.request({
        origin: TEST_ORIGIN,
        method: RpcMethod.Common.GetCapabilities,
      });
      expect(response).toRespondWith(
        expect.objectContaining({
          milestone: 'M1',
          capabilities: expect.objectContaining({
            cardano: expect.objectContaining({
              getAddress: true,
              signTx: false,
            }),
            midnight: expect.objectContaining({
              getPublicKey: true,
              getAddress: 'placeholder',
            }),
          }),
        }),
      );
    });

    it('common_getSupportedChains → contains both chain ids', async () => {
      const response = await snap.request({
        origin: TEST_ORIGIN,
        method: RpcMethod.Common.GetSupportedChains,
      });
      expect(response).toRespondWith(
        expect.objectContaining({
          chains: expect.arrayContaining(['cardano', 'midnight']),
        }),
      );
    });
  });

  // ---- cardano_* ---------------------------------------------------------

  describe('cardano_*', () => {
    it('cardano_getAddress (default preprod) → addr_test1... bech32', async () => {
      const response = await snap.request({
        origin: TEST_ORIGIN,
        method: RpcMethod.Cardano.GetAddress,
      });
      expect(response).toRespondWith(
        expect.objectContaining({
          network: 'preprod',
          paymentPath: "m/1852'/1815'/0'/0'/0'",
          stakePath: "m/1852'/1815'/0'/2'/0'",
          address: expect.stringMatching(/^addr_test1[a-z0-9]{50,}$/),
        }),
      );
    });

    it('cardano_getAddress mainnet → addr1...', async () => {
      const response = await snap.request({
        origin: TEST_ORIGIN,
        method: RpcMethod.Cardano.GetAddress,
        params: { network: 'mainnet' },
      });
      expect(response).toRespondWith(
        expect.objectContaining({
          network: 'mainnet',
          address: expect.stringMatching(/^addr1[a-z0-9]{50,}$/),
        }),
      );
    });

    it('cardano_getAddress with bogus network → CMM_INVALID_PARAMS', async () => {
      const response = await snap.request({
        origin: TEST_ORIGIN,
        method: RpcMethod.Cardano.GetAddress,
        params: { network: 'devnet' },
      });
      // The wire format from @metamask/snaps-sdk's JsonRpcError
      // wrappers (e.g. InvalidParamsError) is:
      //   { code: -32602, data: { code: 'CMM_*', chain: '...', cause: null }, message: '...' }
      // i.e. our CMM payload sits flat in `data`. dApp-side branches on
      // `error.data.code`.
      expect(response).toRespondWithError(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'CMM_INVALID_PARAMS',
            chain: 'cardano',
          }),
        }),
      );
    });

    it('cardano_signTx → CMM_NOT_YET_IMPLEMENTED (M3)', async () => {
      const response = await snap.request({
        origin: TEST_ORIGIN,
        method: RpcMethod.Cardano.SignTx,
      });
      expect(response).toRespondWithError(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'CMM_NOT_YET_IMPLEMENTED',
            chain: 'cardano',
          }),
        }),
      );
    });
  });

  // ---- midnight_* --------------------------------------------------------

  describe('midnight_*', () => {
    it('midnight_getAddress → placeholder marked clearly', async () => {
      const response = await snap.request({
        origin: TEST_ORIGIN,
        method: RpcMethod.Midnight.GetAddress,
      });
      expect(response).toRespondWith(
        expect.objectContaining({
          network: 'testnet-02',
          path: "m/44'/1296'/0'/0'/0'",
          placeholder: true,
          address: expect.stringMatching(MIDNIGHT_EXPECTED.placeholderAddressShape),
        }),
      );
    });

    it('midnight_getPublicKey → 32-byte hex pubkey', async () => {
      const response = await snap.request({
        origin: TEST_ORIGIN,
        method: RpcMethod.Midnight.GetPublicKey,
      });
      expect(response).toRespondWith(
        expect.objectContaining({
          path: "m/44'/1296'/0'/0'/0'",
          pubKeyHex: expect.stringMatching(/^0x[0-9a-f]{64}$/),
        }),
      );
    });

    it('midnight_signTx → CMM_NOT_YET_IMPLEMENTED (M3)', async () => {
      const response = await snap.request({
        origin: TEST_ORIGIN,
        method: RpcMethod.Midnight.SignTx,
      });
      expect(response).toRespondWithError(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'CMM_NOT_YET_IMPLEMENTED',
            chain: 'midnight',
          }),
        }),
      );
    });
  });

  // ---- unknown methods (D2) ---------------------------------------------

  describe('unknown methods', () => {
    it('rejects an unknown namespace with CMM_UNKNOWN_METHOD', async () => {
      const response = await snap.request({
        origin: TEST_ORIGIN,
        method: 'eth_doNotShipThis',
      });
      expect(response).toRespondWithError(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'CMM_UNKNOWN_METHOD',
          }),
        }),
      );
    });

    it('rejects a typo within a known namespace', async () => {
      const response = await snap.request({
        origin: TEST_ORIGIN,
        method: 'cardano_getAdress', // missing one 'd'
      });
      expect(response).toRespondWithError(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'CMM_UNKNOWN_METHOD',
          }),
        }),
      );
    });
  });
});
