/**
 * Tests for `realAdapter` — the production code path that actually
 * talks to MetaMask via `wallet_invokeSnap`.
 *
 * **What we test:** the adapter calls `window.ethereum.request` with the
 * correct shape (method=`wallet_invokeSnap`, snapId, nested request).
 * **What we don't test here:** the Snap's response semantics — those are
 * covered by the Snap's own integration suite at
 * `packages/snap/integration-test/onRpcRequest.test.ts`.
 *
 * SECURITY_CHECKLIST coverage: D2 (method-name spoofing — adapter must
 * never silently lower-case or alias method names; what we send is what
 * the Snap routes on).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import {
  invokeCardanoGetAddress,
  invokeGetCapabilities,
  invokeMidnightGetAddress,
  realAdapter,
} from './real';
import { CMM_SNAP_ID } from '../factory';

type EthereumMock = { request: Mock };

function installEthereum(): EthereumMock {
  const ethereum: EthereumMock = { request: vi.fn() };
  // jsdom-free: just attach to the cross-environment `globalThis`.
  // Real adapter reads `window.ethereum` so we mirror it on globalThis
  // and assign window if it doesn't exist.
  (globalThis as Record<string, unknown>).window = globalThis;
  (globalThis as Record<string, unknown>).ethereum = ethereum;
  return ethereum;
}

describe('realAdapter', () => {
  let eth: EthereumMock;

  beforeEach(() => {
    eth = installEthereum();
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).ethereum;
    delete (globalThis as Record<string, unknown>).window;
  });

  describe('isInstalled', () => {
    it('returns true when CMM snapId is present in wallet_getSnaps', async () => {
      eth.request.mockResolvedValueOnce({ [CMM_SNAP_ID]: { version: '0.0.0' } });
      await expect(realAdapter.isInstalled()).resolves.toBe(true);
      expect(eth.request).toHaveBeenCalledWith({ method: 'wallet_getSnaps' });
    });

    it('returns false when CMM snapId is absent', async () => {
      eth.request.mockResolvedValueOnce({ 'npm:other-snap': {} });
      await expect(realAdapter.isInstalled()).resolves.toBe(false);
    });

    it('returns false (does not throw) when ethereum.request rejects', async () => {
      eth.request.mockRejectedValueOnce(new Error('user rejected'));
      await expect(realAdapter.isInstalled()).resolves.toBe(false);
    });
  });

  describe('connect', () => {
    it('calls wallet_requestSnaps keyed by CMM_SNAP_ID', async () => {
      eth.request.mockResolvedValueOnce({});
      await realAdapter.connect();
      expect(eth.request).toHaveBeenCalledWith({
        method: 'wallet_requestSnaps',
        params: { [CMM_SNAP_ID]: {} },
      });
    });
  });

  describe('getAddress', () => {
    it('cardano: invokes wallet_invokeSnap with method=cardano_getAddress', async () => {
      eth.request.mockResolvedValueOnce({
        address: 'addr_test1qfake',
        network: 'preprod',
        paymentPath: "m/1852'/1815'/0'/0/0",
        stakePath: "m/1852'/1815'/0'/2/0",
      });

      const out = await realAdapter.getAddress('cardano');
      expect(out).toBe('addr_test1qfake');
      expect(eth.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          snapId: CMM_SNAP_ID,
          request: { method: 'cardano_getAddress', params: undefined },
        },
      });
    });

    it('midnight: invokes wallet_invokeSnap with method=midnight_getAddress', async () => {
      eth.request.mockResolvedValueOnce({
        address: 'mn_test_02_stub_abc123',
        network: 'testnet-02',
        path: "m/44'/1296'/0'/0/0",
        placeholder: true,
      });
      const out = await realAdapter.getAddress('midnight');
      expect(out).toBe('mn_test_02_stub_abc123');
      expect(eth.request.mock.calls[0]?.[0]).toMatchObject({
        params: { request: { method: 'midnight_getAddress' } },
      });
    });
  });

  describe('signTransaction', () => {
    it('routes to {chain}_signTx with tx in params', async () => {
      const tx = {
        chain: 'cardano' as const,
        summary: ['Send 10 ADA'],
        body: 'cbor:deadbeef',
      };
      const fakeSigned = { chain: 'cardano', signed: 'hex:01', txHash: 'abc' };
      eth.request.mockResolvedValueOnce(fakeSigned);

      const result = await realAdapter.signTransaction(tx);
      expect(result).toEqual(fakeSigned);
      expect(eth.request.mock.calls[0]?.[0]).toMatchObject({
        params: {
          request: {
            method: 'cardano_signTx',
            params: { tx },
          },
        },
      });
    });
  });

  describe('error propagation (D4: stable code surface)', () => {
    it('forwards CmmSnapError data shape from the Snap', async () => {
      const snapError = Object.assign(new Error('CMM: invalid params'), {
        data: { code: 'CMM_INVALID_PARAMS', chain: 'cardano' },
      });
      eth.request.mockRejectedValueOnce(snapError);

      try {
        await invokeCardanoGetAddress({ network: 'devnet' as never });
        throw new Error('should have thrown');
      } catch (err) {
        const data = (err as { data?: { code?: string } }).data;
        expect(data?.code).toBe('CMM_INVALID_PARAMS');
      }
    });
  });
});

describe('advanced exports', () => {
  let eth: EthereumMock;

  beforeEach(() => {
    eth = installEthereum();
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).ethereum;
    delete (globalThis as Record<string, unknown>).window;
  });

  it('invokeCardanoGetAddress passes network param through', async () => {
    eth.request.mockResolvedValueOnce({
      address: 'addr1mainnet',
      network: 'mainnet',
      paymentPath: "m/1852'/1815'/0'/0/0",
      stakePath: "m/1852'/1815'/0'/2/0",
    });
    const res = await invokeCardanoGetAddress({ network: 'mainnet' });
    expect(res.network).toBe('mainnet');
    expect(eth.request.mock.calls[0]?.[0]).toMatchObject({
      params: {
        request: {
          method: 'cardano_getAddress',
          params: { network: 'mainnet' },
        },
      },
    });
  });

  it('invokeMidnightGetAddress carries placeholder marker', async () => {
    eth.request.mockResolvedValueOnce({
      address: 'mn_test_02_stub_xyz',
      network: 'testnet-02',
      path: "m/44'/1296'/0'/0/0",
      placeholder: true,
    });
    const res = await invokeMidnightGetAddress();
    expect(res.placeholder).toBe(true);
  });

  it('invokeGetCapabilities returns the M1 milestone marker', async () => {
    eth.request.mockResolvedValueOnce({
      milestone: 'M1',
      capabilities: { cardano: { getAddress: true }, midnight: { getAddress: 'placeholder' } },
    });
    const caps = await invokeGetCapabilities();
    expect(caps.milestone).toBe('M1');
  });
});
