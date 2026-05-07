import { useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { SponsorCard } from './sponsor-card';

/**
 * Right-rail "sponsor panel" — a stack of crypto-project ad cards.
 *
 * Purpose: a revenue + exposure surface for partner crypto projects, shown
 * alongside the CMM companion dApp. The slots, copy, and links are static
 * placeholders; a future iteration will fetch from a sponsor-rotation
 * service so creatives can be A/B-tested per visitor.
 *
 * Privacy posture: no impression tracking, no third-party scripts,
 * `rel="nofollow sponsored"` on every outbound link, and the panel is
 * collapsible so users can dismiss it for the session.
 */
export function SponsorPanel() {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sticky top-6 inline-flex items-center gap-2 rounded-full border border-cmm-border bg-cmm-card px-3 py-1.5 text-xs text-cmm-muted hover:text-cmm-text"
        aria-label="Show sponsor panel"
      >
        <Megaphone size={14} /> sponsors
      </button>
    );
  }

  return (
    <aside className="sticky top-6 space-y-4" aria-label="Sponsor placements">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-cmm-muted">
        <div className="flex items-center gap-2">
          <Megaphone size={14} />
          <span>Sponsored</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded p-1 text-cmm-muted hover:bg-cmm-card hover:text-cmm-text"
          aria-label="Hide sponsor panel"
        >
          <X size={14} />
        </button>
      </div>

      <SponsorCard
        brand="Bitcoin"
        headline="Stack sats with self-custody."
        body="Cold storage, multi-sig, and no third-party risk. Sample creative — not affiliated with any specific exchange."
        cta="Learn about Bitcoin"
        href="https://bitcoin.org/"
        accentBg="bg-[#f7931a]"
        accentText="text-white"
        glyph={<BitcoinGlyph />}
      />

      <SponsorCard
        brand="Cardano"
        headline="ADA is built for the long run."
        body="Peer-reviewed research, formal methods, and native assets. Sample creative — not affiliated with IOG or the Cardano Foundation."
        cta="Explore Cardano"
        href="https://cardano.org/"
        accentBg="bg-cmm-cardano"
        accentText="text-white"
        glyph={<AdaGlyph />}
      />

      <SponsorCard
        brand="Midnight"
        headline="Privacy-first by default."
        body="Selective-disclosure ZK on a Cardano-anchored sidechain. Sample creative — for demonstration only."
        cta="Visit Midnight"
        href="https://midnight.network/"
        accentBg="bg-cmm-midnight"
        accentText="text-white"
        glyph={<MidnightGlyph />}
      />

      <p className="text-[10px] leading-snug text-cmm-muted">
        Placeholder ad slots. Logos and copy here are illustrative — they do
        not represent endorsed partners. Replace via the sponsor-rotation
        config in <code className="font-mono">sponsor-panel.tsx</code> once
        real placements ship.
      </p>
    </aside>
  );
}

function BitcoinGlyph() {
  return (
    <svg
      viewBox="0 0 64 64"
      width="80"
      height="80"
      role="img"
      aria-label="Bitcoin symbol"
      className="drop-shadow"
    >
      <circle cx="32" cy="32" r="30" fill="white" fillOpacity="0.1" />
      <text
        x="32"
        y="44"
        textAnchor="middle"
        fontFamily="ui-serif, Georgia, serif"
        fontWeight="700"
        fontSize="44"
        fill="currentColor"
      >
        ₿
      </text>
    </svg>
  );
}

function AdaGlyph() {
  return (
    <svg
      viewBox="0 0 64 64"
      width="80"
      height="80"
      role="img"
      aria-label="Cardano hex symbol"
      className="drop-shadow"
    >
      <circle cx="32" cy="32" r="30" fill="white" fillOpacity="0.12" />
      <g fill="currentColor">
        {/* outer ring of 6 */}
        <circle cx="32" cy="12" r="2.6" />
        <circle cx="49" cy="22" r="2.6" />
        <circle cx="49" cy="42" r="2.6" />
        <circle cx="32" cy="52" r="2.6" />
        <circle cx="15" cy="42" r="2.6" />
        <circle cx="15" cy="22" r="2.6" />
        {/* inner ring of 6 */}
        <circle cx="32" cy="22" r="2" />
        <circle cx="40" cy="27" r="2" />
        <circle cx="40" cy="37" r="2" />
        <circle cx="32" cy="42" r="2" />
        <circle cx="24" cy="37" r="2" />
        <circle cx="24" cy="27" r="2" />
        {/* center */}
        <circle cx="32" cy="32" r="2.4" />
      </g>
    </svg>
  );
}

function MidnightGlyph() {
  return (
    <svg
      viewBox="0 0 64 64"
      width="80"
      height="80"
      role="img"
      aria-label="Midnight crescent"
      className="drop-shadow"
    >
      <defs>
        <mask id="mn-crescent">
          <rect width="64" height="64" fill="white" />
          <circle cx="40" cy="32" r="22" fill="black" />
        </mask>
      </defs>
      <circle cx="30" cy="32" r="22" fill="currentColor" mask="url(#mn-crescent)" />
      <circle cx="48" cy="20" r="1.6" fill="currentColor" />
      <circle cx="52" cy="36" r="1.2" fill="currentColor" />
      <circle cx="46" cy="46" r="1" fill="currentColor" />
    </svg>
  );
}
