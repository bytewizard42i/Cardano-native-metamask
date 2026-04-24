import { useEffect, useMemo, useState } from 'react';
import type { AdapterMode, Balance, ChainId } from '@cmm/dapp-sdk';
import { AlertTriangle, EyeOff, Loader2 } from 'lucide-react';
import { resolveAdapter } from '@/lib/adapter';

interface ChainCardProps {
  chain: ChainId;
  title: string;
  subtitle: string;
  accent: string;
  mode: AdapterMode;
}

/**
 * Balance card driven by the `@cmm/dapp-sdk` adapter.
 *
 * - `mode='mock'`        → fixtures
 * - `mode='live-readonly'` → real Blockfrost for Cardano; encrypted placeholder for Midnight
 * - `mode='real'`         → M1+ Snap-backed (not wired yet)
 */
export function ChainCard({ chain, title, subtitle, accent, mode }: ChainCardProps) {
  const adapter = useMemo(() => resolveAdapter(mode), [mode]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setBalance(null);
    adapter
      .getBalance(chain)
      .then((b) => {
        if (alive) setBalance(b);
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [adapter, chain, mode]);

  const encrypted = balance?.native.amount === 'encrypted';

  return (
    <div className="rounded-2xl border border-cmm-border bg-cmm-card p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-block h-3 w-3 rounded-full ${accent}`} />
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>
        {balance?.network && (
          <span className="rounded-full border border-cmm-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-cmm-muted">
            {balance.network}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-cmm-muted">{subtitle}</p>

      <div className="mt-6 rounded-xl border border-cmm-border bg-cmm-bg/60 p-4">
        {loading && (
          <div className="flex items-center gap-2 text-cmm-muted">
            <Loader2 className="animate-spin" size={16} />
            <span>Fetching balance…</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-300">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}
        {balance && !error && (
          <>
            <div className="break-all font-mono text-xs text-cmm-muted">{balance.address}</div>
            {encrypted ? (
              <div className="mt-3 flex items-center gap-2 text-xl text-cmm-muted">
                <EyeOff size={18} />
                <span>Encrypted — install CMM Snap to decrypt</span>
              </div>
            ) : (
              <div className="mt-3 text-3xl font-semibold">
                {formatAmount(balance.native.amount, balance.native.decimals)}{' '}
                <span className="text-base text-cmm-muted">{balance.native.symbol}</span>
                {balance.native.shielded && (
                  <span className="ml-2 rounded bg-cmm-midnight/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-cmm-midnight">
                    shielded
                  </span>
                )}
              </div>
            )}
            {balance.assets.length > 0 && (
              <div className="mt-3 space-y-1 text-sm">
                {balance.assets.map((a) => (
                  <div key={a.assetId} className="flex justify-between text-cmm-muted">
                    <span>{a.symbol}</span>
                    <span className="font-mono">{formatAmount(a.amount, a.decimals)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <p className="mt-4 text-xs text-cmm-muted">{modeFooter(chain, mode)}</p>
    </div>
  );
}

function modeFooter(chain: ChainId, mode: AdapterMode): string {
  if (mode === 'mock') return 'Mock mode — deterministic fixtures. Install the CMM Snap for live data.';
  if (mode === 'live-readonly') {
    return chain === 'cardano'
      ? 'Live Cardano preprod via Blockfrost. Read-only — signing lands in M1.'
      : 'Midnight balances are shielded; true decryption requires the Snap (M2+).';
  }
  return 'Snap-backed — activates in M1.';
}

function formatAmount(amount: string, decimals: number): string {
  if (amount === 'encrypted') return amount;
  try {
    const n = BigInt(amount);
    const divisor = 10n ** BigInt(decimals);
    const whole = n / divisor;
    const frac = n % divisor;
    const fracStr = frac.toString().padStart(decimals, '0').slice(0, 6);
    return decimals > 0 ? `${whole}.${fracStr}` : whole.toString();
  } catch {
    return amount;
  }
}
