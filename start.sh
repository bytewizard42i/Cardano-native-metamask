#!/usr/bin/env bash
# CMM one-button local startup.
#
# What this does:
#   1. Verifies Node ≥ 20 and pnpm ≥ 9
#   2. Installs dependencies if node_modules is missing
#   3. Creates packages/companion-dapp/.env.local from the example if missing
#   4. Starts the entire monorepo in dev mode (Snap watch+serve, dApp HMR, libs in watch)
#
# After this runs:
#   - companion dApp:  http://localhost:3000
#   - Snap (Flask):    local:http://localhost:8080
#
# Usage:
#   ./start.sh           # run everything
#   ./start.sh --check   # just verify prerequisites and bail
#
# Stop with Ctrl-C. Turborepo will tear down all processes cleanly.

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

step() { echo -e "${BOLD}${GREEN}▸${NC} $1"; }
warn() { echo -e "${BOLD}${YELLOW}!${NC} $1"; }
fail() { echo -e "${BOLD}${RED}✖${NC} $1"; exit 1; }

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

# --- 1. Prerequisites ---------------------------------------------------------
step "Checking prerequisites"

if ! command -v node >/dev/null 2>&1; then
  fail "Node.js is not installed. Install Node 20+ from https://nodejs.org/ or via nvm."
fi
NODE_MAJOR="$(node -v | sed -E 's/v([0-9]+).*/\1/')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  fail "Node $NODE_MAJOR detected. CMM requires Node 20 or newer. Try: nvm install 20 && nvm use 20"
fi
echo "  Node $(node -v) ✓"

if ! command -v pnpm >/dev/null 2>&1; then
  warn "pnpm is not installed. Installing via corepack..."
  corepack enable
  corepack prepare pnpm@9.12.3 --activate
fi
echo "  pnpm $(pnpm -v) ✓"

if [ "${1:-}" = "--check" ]; then
  step "Prerequisites OK. Re-run without --check to actually start."
  exit 0
fi

# --- 2. Install dependencies --------------------------------------------------
if [ ! -d node_modules ] || [ ! -d packages/snap/node_modules ]; then
  step "Installing dependencies (first run only — ~2 minutes)"
  pnpm install
else
  echo "  node_modules present ✓ (run 'pnpm install' manually if package.json changed)"
fi

# --- 3. Companion dApp environment file ---------------------------------------
ENV_FILE="packages/companion-dapp/.env.local"
ENV_EXAMPLE="packages/companion-dapp/.env.example"
if [ ! -f "$ENV_FILE" ]; then
  step "Creating $ENV_FILE from .env.example"
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  warn "$ENV_FILE was created with empty values."
  warn "  - 'Mock' mode will work right now (no setup needed)."
  warn "  - 'Live data' mode needs a free Blockfrost key:"
  warn "      1. Sign up at https://blockfrost.io/dashboard"
  warn "      2. Create a project: 'Cardano preprod'"
  warn "      3. Paste project_id into VITE_BLOCKFROST_PROJECT_ID_CARDANO_PREPROD"
  warn "      4. Pick any preprod address (or use https://docs.cardano.org/cardano-testnet/tools/faucet/)"
  warn "         and paste it into VITE_DEMO_CARDANO_ADDRESS"
  warn "  - 'Snap' mode needs MetaMask Flask: https://metamask.io/flask/"
  echo
fi

# --- 4. Start the dev orchestrator --------------------------------------------
step "Starting CMM dev environment (Ctrl-C to stop everything)"
echo
echo "  ┌─────────────────────────────────────────────────────────────┐"
echo "  │  companion dApp  →  http://localhost:3000                   │"
echo "  │  Snap (Flask)    →  local:http://localhost:8080             │"
echo "  │                                                             │"
echo "  │  Modes available in the UI:                                 │"
echo "  │    • Mock           always works                            │"
echo "  │    • Live data      needs Blockfrost key in .env.local      │"
echo "  │    • Snap           needs MetaMask Flask installed          │"
echo "  └─────────────────────────────────────────────────────────────┘"
echo

exec pnpm dev
