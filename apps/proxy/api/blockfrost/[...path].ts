/**
 * CMM Blockfrost proxy — Vercel Edge Function.
 *
 * Why this exists: keep the Blockfrost project_id server-side so it never
 * ships to the browser. The companion dApp calls this URL; we add the
 * project_id header and forward to Blockfrost.
 *
 * Routes:
 *   /api/blockfrost/<network>/<rest...>  →  https://cardano-<network>.blockfrost.io/api/v0/<rest>
 *
 * Where <network> ∈ { preprod, preview, mainnet }.
 *
 * Env vars (set in Vercel dashboard):
 *   BLOCKFROST_PROJECT_ID_PREPROD   — required if you allow preprod traffic
 *   BLOCKFROST_PROJECT_ID_PREVIEW   — optional
 *   BLOCKFROST_PROJECT_ID_MAINNET   — optional
 *   ALLOWED_ORIGINS                 — comma-separated list of dApp origins
 *                                     (e.g. "https://cmm.wallet,https://cmm.vercel.app")
 *                                     Set to "*" only for dev/demo.
 *
 * Security notes:
 *   - GET requests only (Blockfrost reads only — no writes through this proxy)
 *   - CORS allow-list enforced
 *   - Path is sanity-checked against an allow-list of Blockfrost endpoints
 *   - No request bodies forwarded
 */

export const config = {
  runtime: 'edge',
};

const NETWORK_BASE_URLS: Record<string, string> = {
  preprod: 'https://cardano-preprod.blockfrost.io/api/v0',
  preview: 'https://cardano-preview.blockfrost.io/api/v0',
  mainnet: 'https://cardano-mainnet.blockfrost.io/api/v0',
};

/**
 * Allow-list of Blockfrost path prefixes the proxy will forward.
 * Anything else returns 404. Keeps the surface area small.
 */
const ALLOWED_PATH_PREFIXES = [
  'addresses/',
  'blocks/',
  'health',
  'network',
  'epochs/',
  'pools/',
  'assets/',
  'txs/',
];

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  const allowAll = allowed.includes('*');
  const allow =
    allowAll || (origin && allowed.includes(origin)) ? origin ?? '*' : '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function projectIdFor(network: string): string | undefined {
  switch (network) {
    case 'preprod':
      return process.env.BLOCKFROST_PROJECT_ID_PREPROD;
    case 'preview':
      return process.env.BLOCKFROST_PROJECT_ID_PREVIEW;
    case 'mainnet':
      return process.env.BLOCKFROST_PROJECT_ID_MAINNET;
    default:
      return undefined;
  }
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const cors = corsHeaders(origin);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...cors, 'content-type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  // Path looks like /api/blockfrost/preprod/addresses/addr_test1...
  const parts = url.pathname.split('/').filter(Boolean);
  // parts: ["api", "blockfrost", "<network>", ...rest]
  if (parts.length < 4 || parts[0] !== 'api' || parts[1] !== 'blockfrost') {
    return new Response(JSON.stringify({ error: 'bad_route' }), {
      status: 404,
      headers: { ...cors, 'content-type': 'application/json' },
    });
  }
  const network = parts[2];
  const rest = parts.slice(3).join('/');
  const base = NETWORK_BASE_URLS[network];
  if (!base) {
    return new Response(JSON.stringify({ error: 'unknown_network', network }), {
      status: 404,
      headers: { ...cors, 'content-type': 'application/json' },
    });
  }

  // Path allow-list — refuse anything outside our small set of read endpoints.
  if (!ALLOWED_PATH_PREFIXES.some((p) => rest === p || rest.startsWith(p))) {
    return new Response(
      JSON.stringify({ error: 'path_not_allowed', path: rest }),
      { status: 403, headers: { ...cors, 'content-type': 'application/json' } },
    );
  }

  const projectId = projectIdFor(network);
  if (!projectId) {
    return new Response(
      JSON.stringify({
        error: 'proxy_misconfigured',
        detail: `BLOCKFROST_PROJECT_ID_${network.toUpperCase()} is not set on the proxy.`,
      }),
      { status: 500, headers: { ...cors, 'content-type': 'application/json' } },
    );
  }

  // Forward query string verbatim.
  const targetUrl = `${base}/${rest}${url.search}`;
  const upstream = await fetch(targetUrl, {
    method: 'GET',
    headers: { project_id: projectId },
  });

  // Stream the body through; rewrite headers so CORS works.
  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: upstream.status,
    headers: {
      ...cors,
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
      'cache-control': 'public, max-age=2', // tiny cache; Blockfrost data is fresh-ish
    },
  });
}
