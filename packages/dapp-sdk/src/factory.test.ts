/**
 * Tests for `createSnapAdapter` — adapter selection logic.
 *
 * The 'auto' branch is the most consequential: it decides whether the
 * dApp talks to MetaMask or to fixtures based on `globalThis.ethereum`
 * detection. Bugs here cause silent fallback to mock in production —
 * "user thinks they signed; nothing happened". Lock it down.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockAdapter } from './adapters/mock';
import { realAdapter } from './adapters/real';
import { CMM_SNAP_ID, createSnapAdapter } from './factory';

describe('createSnapAdapter', () => {
  afterEach(() => {
    // Clean up any ethereum stub a test installed.
    delete (globalThis as Record<string, unknown>).ethereum;
  });

  describe('explicit modes', () => {
    it('mode="mock" returns the mock adapter regardless of environment', () => {
      (globalThis as Record<string, unknown>).ethereum = {};
      const adapter = createSnapAdapter('mock');
      expect(adapter).toBe(mockAdapter);
    });

    it('mode="real" returns the real adapter regardless of environment', () => {
      // Even without `globalThis.ethereum`, real is real — the call will
      // fail at request time, not at construction time.
      const adapter = createSnapAdapter('real');
      expect(adapter).toBe(realAdapter);
    });

    it('mode="live-readonly" returns a fresh adapter (not mock, not real)', () => {
      const adapter = createSnapAdapter('live-readonly');
      expect(adapter).not.toBe(mockAdapter);
      expect(adapter).not.toBe(realAdapter);
      expect(typeof adapter.getAddress).toBe('function');
    });
  });

  describe('mode="auto"', () => {
    it('uses real adapter when globalThis.ethereum is present', () => {
      (globalThis as Record<string, unknown>).ethereum = {
        request: vi.fn(),
      };
      const adapter = createSnapAdapter('auto');
      expect(adapter).toBe(realAdapter);
    });

    it('falls back to mock adapter when ethereum is absent', () => {
      // Nothing on globalThis — simulates SSR / headless / non-MM browser.
      const adapter = createSnapAdapter('auto');
      expect(adapter).toBe(mockAdapter);
    });

    it('default mode is "auto"', () => {
      (globalThis as Record<string, unknown>).ethereum = {
        request: vi.fn(),
      };
      const adapter = createSnapAdapter();
      expect(adapter).toBe(realAdapter);
    });
  });

  describe('CMM_SNAP_ID constant', () => {
    it('points at the local dev server during M0–M5', () => {
      expect(CMM_SNAP_ID).toBe('local:http://localhost:8080');
    });

    it('starts with "local:" or "npm:" — never anything else', () => {
      // Hard guardrail: if a future contributor accidentally points at a
      // dev URL like http://... directly, MetaMask's snap loader will
      // reject it. Catch that at the SDK level.
      expect(CMM_SNAP_ID).toMatch(/^(local:|npm:)/);
    });
  });
});
