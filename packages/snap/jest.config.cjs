// @ts-check
/**
 * Unit test configuration for @cmm/snap.
 *
 * Pattern lifted from @metamask/bitcoin-wallet-snap (our EUTXO reference)
 * and adapted for the smaller M1 surface. Coverage thresholds start
 * lower than MetaMask BTC's because we're early; ratchet up at every
 * milestone gate. Never lower the bar.
 *
 * See docs/TESTING_STRATEGY.md for the full rationale.
 *
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
const config = {
  // Match unit tests co-located with source.
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).[tj]s?(x)'],

  // Integration tests have their own config (jest.config.integration.cjs).
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/integration-test/'],

  preset: 'ts-jest',

  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },

  // Resolve workspace packages (e.g. @cmm/shared) without a build step.
  moduleNameMapper: {
    '^@cmm/shared$': '<rootDir>/../shared/src/index.ts',
    '^@cmm/shared/(.*)$': '<rootDir>/../shared/src/$1',
  },

  // Snap globals (`snap.request`, etc.) are stubbed per-test; no global setup.
  resetMocks: true,
  clearMocks: true,
  restoreMocks: true,

  collectCoverage: false, // opt-in via `pnpm test:coverage`
  collectCoverageFrom: ['./src/**/*.ts', '!./src/**/index.ts', '!./src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'json-summary', 'lcov'],

  // M1 starting bar — see SECURITY_CHECKLIST.md F3.
  // Ratchet up to 75/65/62/74 (BTC Snap) by M3.
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};

module.exports = config;
