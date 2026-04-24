import { useEffect, useState } from 'react';
import type { Balance, ChainId } from '@cmm/shared';
import { createSnapAdapter } from '@cmm/dapp-sdk';
import { Loader2 } from 'lucide-react';

interface ChainCardProps {
  chain: ChainId;
  title: string;
  subtitle: string;
  accent: string;
}

/**
 * A balance card driven by the `@cmm/dapp-sdk` adapter.
 *
 * In demoland / SSR the adapter auto-falls-back to the mock — so this
 * component renders real fixtures without any MetaMask detected.
 * Once the real Snap is installed, same component lights up for live data.
 */
export function ChainCard({ chain, title, subtitle, accent }: ChainCardProps) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adapter = createSnapAdapter('mock'); // M0/M1: mock-only
    let alive = true;
    adapter
      .getBalance(chain)
      .then((b) => {
        if (alive) setBalance(b);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [chain]);

  return (
    <div className="rounded-2xl border border-cmm-border bg-cmm-card p-6 shadow-lg">
      <div className="flex items-center gap-3">
        <span className={`inline-block h-3 w-3 rounded-full ${accent}`} />
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-cmm-muted">{subtitle}</p>

      <div className="mt-6 rounded-xl border border-cmm-border bg-cmm-bg/60 p-4">
        {loading && (
          <div className="flex items-center gap-2 text-cmm-muted">
            <Loader2 className="animate-spin" size={16} />
            <span>Fetching balance…</span>
          </div>
        )}
        {balance && (
          <>
            <div className="font-mono text-xs text-cmm-muted break-all">{balance.address}</div>
            <div className="mt-3 text-3xl font-semibold">
              {formatAmount(balance.native.amount, balance.native.decimals)}{' '}
              <span className="text-base text-cmm-muted">{balance.native.symbol}</span>
            </div>
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

      <p className="mt-4 text-xs text-cmm-muted">
        Demoland mode: values above are deterministic fixtures. Install the CMM Snap
        to replace with live data.
      </p>
    </div>
  );
}

function formatAmount(amount: string, decimals: number): string {
  const n = BigInt(amount);
  const divisor = 10n ** BigInt(decimals);
  const whole = n / divisor;
  const frac = n % divisor;
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 6);
  return decimals > 0 ? `${whole}.${fracStr}` : whole.toString();
}
