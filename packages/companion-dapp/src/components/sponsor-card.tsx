import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';

export interface SponsorCardProps {
  brand: string;
  headline: string;
  body: string;
  cta: string;
  href: string;
  /** Tailwind background class for the visual block. */
  accentBg: string;
  /** Tailwind text-color class for the visual block. */
  accentText: string;
  /** Optional inline SVG / element rendered inside the visual block. */
  glyph?: ReactNode;
}

/**
 * A single sponsor card in the side panel.
 *
 * Renders a stylised "ad" without using any real third-party imagery —
 * brand glyphs are inline SVG so we never carry a copyrighted asset.
 * Cards are clearly labelled "Sponsored — example creative" so they cannot
 * be mistaken for vetted partner placements.
 */
export function SponsorCard({
  brand,
  headline,
  body,
  cta,
  href,
  accentBg,
  accentText,
  glyph,
}: SponsorCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-cmm-border bg-cmm-card shadow-lg">
      <div
        className={`flex h-32 items-center justify-center ${accentBg} ${accentText}`}
        role="img"
        aria-label={`${brand} sponsored visual`}
      >
        {glyph ?? <span className="text-3xl font-semibold tracking-tight">{brand}</span>}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-cmm-text">
            {brand}
          </span>
          <span className="rounded border border-cmm-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-cmm-muted">
            Sponsored · example
          </span>
        </div>
        <h3 className="text-base font-semibold leading-snug text-cmm-text">{headline}</h3>
        <p className="text-sm text-cmm-muted">{body}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cmm-text underline-offset-4 hover:underline"
        >
          {cta} <ExternalLink size={14} />
        </a>
      </div>
    </article>
  );
}
