import type { AdapterMode } from '@cmm/dapp-sdk';
import { Database, Wand2, Wifi, WifiOff } from 'lucide-react';

interface ModeSwitcherProps {
  mode: AdapterMode;
  onChange: (mode: AdapterMode) => void;
  liveAvailable: boolean;
}

/**
 * Top-of-page toggle between `mock` (fixtures) and `live-readonly`
 * (real Blockfrost). The `real` mode is disabled until M1 ships the Snap.
 */
export function ModeSwitcher({ mode, onChange, liveAvailable }: ModeSwitcherProps) {
  return (
    <div className="mt-10 flex flex-col items-center gap-2">
      <div className="inline-flex items-center gap-1 rounded-full border border-cmm-border bg-cmm-card p-1 shadow-lg">
        <ModeButton
          active={mode === 'mock'}
          onClick={() => onChange('mock')}
          icon={<Wand2 size={14} />}
          label="Mock"
        />
        <ModeButton
          active={mode === 'live-readonly'}
          onClick={() => onChange('live-readonly')}
          disabled={!liveAvailable}
          icon={liveAvailable ? <Wifi size={14} /> : <WifiOff size={14} />}
          label="Live data"
        />
        <ModeButton
          active={mode === 'real'}
          onClick={() => onChange('real')}
          disabled
          icon={<Database size={14} />}
          label="Snap (M1+)"
        />
      </div>
      <p className="text-xs text-cmm-muted">
        {mode === 'mock' && 'Rendering deterministic fixtures.'}
        {mode === 'live-readonly' &&
          'Real Cardano preprod balance via Blockfrost. Midnight still mock until M2.'}
        {mode === 'real' &&
          'Snap-backed — activates in M1 once MetaMask Flask loads the CMM Snap.'}
        {!liveAvailable && mode === 'mock' && (
          <>
            {' · '}
            <span className="text-cmm-muted/70">
              Configure <code className="font-mono">.env.local</code> to enable Live mode.
            </span>
          </>
        )}
      </p>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  disabled,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition';
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={`${base} cursor-not-allowed text-cmm-muted/50`}
        title={label.includes('M1') ? 'Requires the CMM Snap (M1+)' : 'Configure .env.local'}
      >
        {icon}
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${
        active
          ? 'bg-cmm-midnight/90 text-white shadow'
          : 'text-cmm-muted hover:bg-cmm-border/40 hover:text-cmm-text'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
