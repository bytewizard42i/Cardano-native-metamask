import type { AdapterMode } from '@cmm/dapp-sdk';
import { Database, Wand2, Wifi, WifiOff } from 'lucide-react';
import { InfoHint } from './info-hint';

interface ModeSwitcherProps {
  mode: AdapterMode;
  onChange: (mode: AdapterMode) => void;
  liveAvailable: boolean;
}

/**
 * Top-of-page toggle between `mock` (fixtures), `live-readonly`
 * (real Blockfrost), and `real` (Snap-backed — partially live at M1).
 *
 * Each button ships with an ⓘ hint that opens a tooltip explaining the
 * mode and linking to authoritative docs. Hover to peek, click to pin.
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
          hint={
            <InfoHint
              label="About mock mode"
              learnMore="cmmBuildStrategy"
              learnMoreLabel="Why demoland first"
            >
              Deterministic fixtures — no network, no Snap, no MetaMask required. Lets
              you see the dApp UX end-to-end before any real keys or funds touch the
              browser. Useful for UX review and demos.
            </InfoHint>
          }
        />
        <ModeButton
          active={mode === 'live-readonly'}
          onClick={() => onChange('live-readonly')}
          disabled={!liveAvailable}
          icon={liveAvailable ? <Wifi size={14} /> : <WifiOff size={14} />}
          label="Live data"
          hint={
            <InfoHint label="About live-readonly mode" learnMore="blockfrost">
              Real Cardano preprod balances pulled from Blockfrost, with Midnight still
              shown as a shielded placeholder. Read-only — no signing. This proves our
              indexer wiring works without needing MetaMask Flask.
            </InfoHint>
          }
        />
        <ModeButton
          active={mode === 'real'}
          onClick={() => onChange('real')}
          icon={<Database size={14} />}
          label="Snap"
          hint={
            <InfoHint label="About Snap mode" learnMore="metaMaskFlask">
              Backed by the CMM MetaMask Snap. M1 returns real bech32
              <code className="mx-1 font-mono">addr_test1…</code>
              addresses from HD-derived keys; signing and balance reads ship in
              M2–M3. Requires MetaMask Flask.
            </InfoHint>
          }
        />
      </div>
      <p className="text-xs text-cmm-muted">
        {mode === 'mock' && 'Rendering deterministic fixtures.'}
        {mode === 'live-readonly' &&
          'Real Cardano preprod balance via Blockfrost. Midnight still mock until M2.'}
        {mode === 'real' &&
          'Snap-backed — returns real derived addresses (M1). Balances/signing land M2–M3.'}
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

// `hint` intentionally consumes a full <InfoHint/> node (not a key) so
// callers can compose custom content per button without leaking all
// copy into this component.
type Hint = React.ReactElement;

function ModeButton({
  active,
  onClick,
  disabled,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  hint?: Hint;
}) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition';
  if (disabled) {
    return (
      <span className="inline-flex items-center">
        <button
          type="button"
          disabled
          className={`${base} cursor-not-allowed text-cmm-muted/50`}
          title="Configure .env.local to enable this mode"
        >
          {icon}
          {label}
        </button>
        {hint && <span className="ml-1">{hint}</span>}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center">
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
      {hint && <span className="ml-1">{hint}</span>}
    </span>
  );
}
