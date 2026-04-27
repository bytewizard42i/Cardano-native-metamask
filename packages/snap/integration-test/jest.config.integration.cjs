// @ts-check
/**
 * Integration-test configuration for @cmm/snap.
 *
 * Spins up the Snap inside @metamask/snaps-jest's sandboxed runtime via
 * `installSnap()`. Lives in its own folder + config so it doesn't slow
 * down the unit-test inner loop.
 *
 * Runs serially (`--runInBand`) because each `installSnap()` call boots
 * a worker that's not safe to parallelize.
 *
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
const config = {
  rootDir: '..',
  testMatch: ['<rootDir>/integration-test/**/?(*.)+(spec|test).[tj]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  preset: '@metamask/snaps-jest',

  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },

  moduleNameMapper: {
    '^@cmm/shared$': '<rootDir>/../shared/src/index.ts',
    '^@cmm/shared/(.*)$': '<rootDir>/../shared/src/$1',
  },

  resetMocks: true,
  clearMocks: true,

  // Integration tests do not contribute to the unit coverage threshold.
  collectCoverage: false,

  // Slower than unit tests — give them headroom.
  testTimeout: 30_000,
};

module.exports = config;
