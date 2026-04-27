# Contributing to CMM

Welcome! This is the on-ramp for new contributors. Read it before
opening your first PR.

> **Status**: M1 milestone. Internal-only repo — public unveiling
> happens at M5/M6. If you're outside the core team and reading this,
> we either invited you specifically or made a mistake; ping John.

---

## 1. The 30-Second Mental Model

CMM is a **MetaMask Snap** that gives MetaMask users native Cardano +
Midnight accounts without installing a second wallet. Four packages
in one pnpm monorepo:

| Package | What it does | Test runner |
|---|---|---|
| `@cmm/snap` | The audited Snap. Runs sandboxed inside MetaMask Flask. | jest + `@metamask/snaps-jest` |
| `@cmm/dapp-sdk` | TypeScript SDK dApps use to call the Snap. | vitest |
| `@cmm/companion-dapp` | Vite/React demo app. Doubles as our demoland. | vitest (UI tests TBD) |
| `@cmm/shared` | Types + constants used by all of the above. | vitest |

**The Snap is the audit-critical core.** Treat any change there as if a
real auditor will grep your diff. Use `docs/SECURITY_CHECKLIST.md` as
the lens before opening a PR.

---

## 2. First-Time Setup

```bash
git clone --recurse-submodules git@github.com:bytewizard42i/Cardano-native-metamask.git
cd Cardano-native-metamask
pnpm install
```

Verify everything wires up:

```bash
pnpm typecheck     # tsc across all four packages via turbo
pnpm test          # all unit tests across all four packages
pnpm -F @cmm/snap test:integration   # boots the Snap in a sandbox
pnpm -F @cmm/snap build              # produces dist/bundle.js
pnpm -F @cmm/snap serve              # runs at local:http://localhost:8080
```

If `pnpm test` is green, you're set up.

---

## 3. Test-First Workflow

This is non-negotiable for the Snap package and strongly preferred
elsewhere:

1. **Write the test first.** Even a stubbed `it.todo('...')` is fine.
2. **Run it red.** Confirm it fails for the reason you expect.
3. **Implement.** Smallest change that makes it green.
4. **Re-read the diff** through the SECURITY_CHECKLIST.md lens.
5. **Commit.** Subject ≤ 72 chars, body explains *why*, not *what*.

### What to test

| Code area | Mandatory tests |
|---|---|
| New RPC method on the Snap | unit (handler routing) + integration (`onRpcRequest.test.ts`) + new error codes covered in `errors.test.ts` |
| New crypto path (derive / address / signing) | KAT (known-answer test) with hand-pinned expected values, **never** snapshot |
| New param shape | Hostile-input fuzz in `validate.test.ts` (`it.each` over wrong cases) |
| New dApp-SDK adapter method | mock fixture + real-adapter `wallet_invokeSnap` shape |
| New error code | Stability assertion in `errors.test.ts` (codes are a public contract) |

### What NOT to do

- ❌ `toMatchSnapshot()` for any cryptographic output. KAT only.
- ❌ Mock `@noble/hashes` or `bech32`. They're audited; mocking hides bugs.
- ❌ Live network calls in tests. Ever. Use recorded fixtures (`nock`) at
  M2 when Blockfrost lands.
- ❌ Lower a coverage threshold to make CI green. Add tests instead.
- ❌ Edit `integration-test/expected-vectors.ts` without three answers in
  the PR body — see the file's header for the rules.

---

## 4. Branching & Commits

```
main                  # protected, CI-gated
└── feature/<topic>   # short-lived, squash-merge to main
└── chore/<topic>     # docs, infra, deps
└── fix/<topic>       # bugfixes
```

**Conventional commits** at the subject level: `feat:`, `fix:`,
`chore:`, `docs:`, `test:`, `refactor:`. Footer of the body should
include `Refs: M1` (or whichever milestone owns the change). Example:

```
feat(snap): add cardano_signTx with snap_dialog confirmation

Implements full transaction signing for Cardano. Routes through
deriveCardanoKeys → CSL signature → returns hex CBOR. Dialog shows
the requesting origin per SECURITY_CHECKLIST.md A2.

Tests:
- src/chains/cardano/sign.test.ts (unit, mocks key-tree)
- integration-test/cardano.signTx.test.ts (end-to-end via installSnap)

Refs: M3
```

---

## 5. Reading the Codebase Effectively

Read these in order before touching anything:

1. `README.md` — project intro
2. `docs/ARCHITECTURE.md` — package layout + Snap API surface
3. `docs/TESTING_STRATEGY.md` — how we test (deep dive on MetaMask's
   own patterns from `references/metamask-snap-bitcoin-wallet`)
4. `docs/SECURITY_CHECKLIST.md` — the threat model the tests defend
   against. **Read before every Snap PR.**
5. `docs/RESEARCH_LOG.md` — append-only chronicle of decisions.
   Skim the most recent entries before proposing big changes.
6. `docs/REFERENCE_REPOS.md` — pointer to the 6 MetaMask reference
   forks at `references/metamask-*`. Grep these for patterns; never
   modify them.

---

## 6. Reporting Issues / Asking Questions

- Stuck on something? Open a draft PR with `[WIP]` and describe what
  you tried. The team prefers seeing the broken-but-honest diff over
  a perfect Slack message.
- Found a security issue? **Don't open a public issue.** Email John
  directly. We'll triage and decide on disclosure timing together.
- Bug in a reference repo? File it upstream at MetaMask, not here.

---

## 7. The Sister Convention

CMM is co-developed by John and a "sisterhood" of AI pair-programmers
across his machines (Cassie, Casie, Cara, Penny, Alice). If a commit
mentions a sister name in the body, that's who paired on it. It's
fine to do the same when you pair with one of us.

---

## 8. License & Provenance

Apache-2.0. By committing you certify the DCO (a Signed-off-by trailer
in your commit is appreciated but not yet enforced). If you adapted
code from any of the `references/metamask-*` forks (MIT-0 / Apache-2.0),
attribute the source repo + commit SHA in your PR description.

---

*Welcome aboard. The hard part isn't the code — it's keeping the
boundary between "what we know" and "what we're guessing" honest. The
RESEARCH_LOG is how we do that. Read it. Add to it.*
