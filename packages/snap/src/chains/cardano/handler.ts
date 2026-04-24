import type { HandlerArgs } from '../../common/handler.js';

/**
 * Cardano RPC handler.
 *
 * Scope M0: all methods throw "not-yet-implemented" with a descriptive
 * milestone hint. Real implementations land in M4+ per the phasing in
 * MIDNIGHT_FIRST_STRATEGY.md (Midnight ships before Cardano).
 */
export async function handleCardano({ request }: HandlerArgs): Promise<unknown> {
  throw new Error(
    `CMM: Cardano method "${request.method}" is not implemented yet. ` +
      `Cardano ships in milestone M7+ (after Midnight M6 allowlist). ` +
      `See docs/MIDNIGHT_FIRST_STRATEGY.md.`,
  );
}
