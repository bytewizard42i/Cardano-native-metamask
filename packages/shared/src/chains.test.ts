/**
 * Tests for `isChainId` and the chain enum constants.
 *
 * `isChainId` is the type-narrowing guard used everywhere downstream.
 * If it returns true for a wrong-shape input, every consumer relying on
 * the narrowing breaks silently. Pin it.
 */

import { describe, expect, it } from 'vitest';

import {
  CARDANO_NETWORKS,
  CHAINS,
  MIDNIGHT_NETWORKS,
  isChainId,
} from './chains';

describe('CHAINS', () => {
  it('exports both supported chains', () => {
    expect(CHAINS).toContain('cardano');
    expect(CHAINS).toContain('midnight');
  });

  it('Midnight comes first (per MIDNIGHT_FIRST_STRATEGY.md)', () => {
    // The order is meaningful — UI defaults often pick CHAINS[0].
    expect(CHAINS[0]).toBe('midnight');
  });
});

describe('isChainId', () => {
  it.each(['cardano', 'midnight'])('accepts %s', (chain) => {
    expect(isChainId(chain)).toBe(true);
  });

  it.each([
    'ethereum',
    'CARDANO',
    'Cardano',
    ' cardano',
    'cardano ',
    '',
  ])('rejects unknown / mis-cased string %p', (bad) => {
    expect(isChainId(bad)).toBe(false);
  });

  it.each([null, undefined, 0, 1, true, false, [], {}, () => 'cardano'])(
    'rejects non-string value %p',
    (bad) => {
      expect(isChainId(bad)).toBe(false);
    },
  );
});

describe('network enum disjointness', () => {
  // Both chains use 'mainnet' — that's intentional. But Cardano testnets
  // and Midnight testnets must be disjoint identifiers so a UI never
  // shows the wrong one.
  it('Cardano and Midnight testnets do not overlap', () => {
    const cardanoTestnets = CARDANO_NETWORKS.filter((n) => n !== 'mainnet');
    const midnightTestnets = MIDNIGHT_NETWORKS.filter((n) => n !== 'mainnet');
    for (const c of cardanoTestnets) {
      expect(midnightTestnets).not.toContain(c);
    }
  });
});
