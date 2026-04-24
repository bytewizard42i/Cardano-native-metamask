import { useEffect, useId, useRef, useState } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { DOCS_LINKS, type DocsLinkKey } from '@/lib/docs-links';

interface InfoHintProps {
  /** Short, plain-English explanation shown in the popover body. */
  children: React.ReactNode;
  /** Key into DOCS_LINKS registry — renders a "Learn more →" link. */
  learnMore?: DocsLinkKey;
  /** Override the default label ("Learn more"). */
  learnMoreLabel?: string;
  /** Accessible label for the trigger (screen readers). */
  label?: string;
  /** Visual size of the trigger. Default: 12px. */
  size?: number;
  /** Popover placement. Default: 'bottom'. */
  placement?: 'top' | 'bottom';
}

/**
 * A small ⓘ trigger that reveals a popover with a plain-English
 * explanation + an optional "Learn more →" doc link.
 *
 * Interaction model:
 * - Hovering opens the popover (like a tooltip).
 * - Clicking pins it open / toggles it off (for touch + keyboard users).
 * - Escape closes.
 * - Focusable button trigger, labelled for screen readers.
 *
 * Implementation note: pure React + Tailwind, no radix/headlessui. We
 * position with absolute+transform so the popover stays near the trigger
 * without needing a floating-ui calc. If a popover gets clipped by a
 * narrow parent, we can swap in floating-ui later.
 */
export function InfoHint({
  children,
  learnMore,
  learnMoreLabel = 'Learn more',
  label = 'More information',
  size = 12,
  placement = 'bottom',
}: InfoHintProps) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLSpanElement>(null);

  // Close on Escape or outside click (only when pinned).
  useEffect(() => {
    if (!pinned) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setPinned(false);
        setOpen(false);
      }
    }
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setPinned(false);
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [pinned]);

  const visible = open || pinned;
  const posClasses =
    placement === 'top'
      ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
      : 'top-full mt-2 left-1/2 -translate-x-1/2';

  return (
    <span ref={rootRef} className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={label}
        aria-describedby={visible ? id : undefined}
        aria-expanded={visible}
        className="inline-flex items-center justify-center rounded-full text-cmm-muted/70 transition hover:text-cmm-text focus:outline-none focus-visible:ring-2 focus-visible:ring-cmm-midnight"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setPinned((p) => !p);
        }}
      >
        <Info size={size} />
      </button>
      {visible && (
        <span
          id={id}
          role="tooltip"
          className={`absolute z-20 w-64 rounded-lg border border-cmm-border bg-cmm-card p-3 text-xs leading-relaxed text-cmm-text shadow-xl ${posClasses}`}
        >
          <span className="block text-cmm-muted">{children}</span>
          {learnMore && (
            <a
              href={DOCS_LINKS[learnMore]}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-cmm-midnight hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {learnMoreLabel}
              <ExternalLink size={10} />
            </a>
          )}
        </span>
      )}
    </span>
  );
}
