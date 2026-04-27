import { defineConfig } from 'vitest/config';

/**
 * Vitest config for @cmm/dapp-sdk.
 *
 * Vitest > jest here because the package is `"type": "module"` and ships
 * raw TS via the `exports` map. Vitest natively runs ESM/TS without a
 * transform stage, keeping test feedback under a second.
 *
 * Coverage thresholds start at 60 (matches the Snap), ratchet upward each
 * milestone — see docs/TESTING_STRATEGY.md and SECURITY_CHECKLIST.md F3.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/index.ts'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
