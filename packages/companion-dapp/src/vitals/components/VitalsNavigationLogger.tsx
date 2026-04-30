// =============================================================================
// MidnightVitals — Navigation Logger (CMM-adapted)
// =============================================================================
// In the original DiscoveryManagement integration this component listened to
// `react-router-dom`'s location. The CMM companion-dApp is single-page, so we
// provide a no-op stub by default and a `popstate`-based fallback for any
// consumer that mounts this on a multi-route shell. Drop in a real version
// keyed on `useLocation()` if/when CMM grows a router.
// =============================================================================

import { useEffect, useRef } from 'react';
import { useVitalsLogger } from '../context';


/**
 * Maps route paths to human-readable page descriptions.
 * Handles both exact paths and parameterized routes.
 */
function describeRoute(pathname: string): string {
  // Exact matches first
  const exactRoutes: Record<string, string> = {
    '/': 'the Dashboard — your overview of all active cases and compliance status.',
    '/login': 'the Login page.',
    '/cases': 'the Cases list — all your active discovery matters.',
    '/search': 'the Search page — full-text and metadata search across all documents.',
    '/compliance': 'the Compliance Reports page — compliance record history and audit trail.',
    '/settings': 'the Settings page — account preferences and configuration.',
    '/reference': 'the Jurisdiction Reference — discovery rules by jurisdiction.',
  };

  if (exactRoutes[pathname]) {
    return exactRoutes[pathname];
  }

  // Parameterized routes
  const caseContactsMatch = pathname.match(/^\/cases\/([^/]+)\/contacts$/);
  if (caseContactsMatch) {
    return `the Contacts page for case "${caseContactsMatch[1]}".`;
  }

  const caseViewMatch = pathname.match(/^\/cases\/([^/]+)$/);
  if (caseViewMatch) {
    return `case "${caseViewMatch[1]}" — viewing case details, discovery steps, and documents.`;
  }

  return `"${pathname}".`;
}


export function VitalsNavigationLogger() {
  const vitals = useVitalsLogger();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = () => {
      const next = window.location.pathname;
      if (previousPathRef.current === null) {
        previousPathRef.current = next;
        return;
      }
      if (previousPathRef.current === next) return;

      vitals.action(`Navigated to ${describeRoute(next)}`);
      previousPathRef.current = next;
    };

    handler(); // record initial path
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [vitals]);

  return null;
}
