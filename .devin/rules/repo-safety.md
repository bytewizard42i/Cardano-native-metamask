---
trigger: always_on
description: Safety guardrails for any AI assistant or automation working in the CMM repo. Protects the audit-critical MetaMask Snap and the git history from dangerous activity.
---

# CMM Repo Safety Rules

These rules are MANDATORY for any AI assistant, agent, or automation operating
in this repository. CMM is an **audit-critical MetaMask Snap** that handles
real Cardano + Midnight keys. Mistakes here can leak user funds. When in doubt,
STOP and ask a human (ping John).

## 1. Git history is sacred — never rewrite it

- NEVER `git push --force` or `--force-with-lease` to `main` or any shared branch.
- NEVER `git reset --hard`, `git rebase`, `git commit --amend`, or `git filter-branch`
  on commits that have already been pushed.
- NEVER delete branches you did not create, and never delete `main`.
- Before ANY potentially destructive git operation, first create and push a dated
  backup branch from the current remote tip:
  `git branch backup/pre-<task>-YYYY-MM-DD origin/main && git push -u origin backup/...`
- Only commit changes that are clearly yours/the current task's. Leave unrelated
  dirty files (other people's WIP, media, unknown configs) untouched and report them.

## 2. Never commit secrets

- NEVER commit private keys, seed phrases, mnemonics, `.env` files, or API tokens.
  `.gitignore` already excludes `.env*` and `*.seed` — do not override these.
- NEVER print, log, or echo a private key, mnemonic, or seed phrase to the terminal,
  to logs, or into test fixtures. Use deterministic TEST-ONLY vectors clearly labeled
  as such.
- If you discover a committed secret, STOP, do not push, and alert a human immediately.

## 3. The Snap (`packages/snap`, `@cmm/snap`) is audit-critical

- Treat every diff as if a security auditor will grep it.
- Do NOT weaken, bypass, or comment out existing security checks, input validation,
  origin checks, or permission/confirmation prompts.
- Do NOT add new network calls, new RPC endpoints, new permissions, or new runtime
  dependencies to the Snap without explicit human approval.
- Do NOT broaden the Snap manifest's `initialPermissions` or `endowments` without
  explicit human approval.
- Cryptographic code (key derivation, signing, address formatting) must not be
  "refactored for style." Change it only with a specific, reviewed reason.

## 4. Test-first and don't weaken tests

- Follow the repo's test-first workflow (see `CONTRIBUTING.md`). Write/extend tests
  before changing audit-critical behavior.
- NEVER delete, skip (`.skip`/`.only`), or weaken existing tests to make a build pass.
- Keep `pnpm typecheck` and `pnpm test` green. Do not disable lint/type rules to
  silence errors; fix the root cause.

## 5. Dependencies and supply chain

- Do not add, upgrade, or pin dependencies in the Snap or shared packages without
  human approval. Prefer the existing pinned versions in `pnpm-lock.yaml`.
- Never run `pnpm install <pkg>` that adds postinstall scripts to the Snap without review.
- Do not modify `.github/workflows/`, `dependabot.yml`, this rules file, or `CODEOWNERS`
  without explicit human approval — these are the repo's guardrails.

## 6. Destructive shell commands require human approval

- Never auto-run destructive commands: `rm -rf`, `git clean -fdx`, dropping databases,
  killing unrelated processes, or anything that mutates state outside the workspace.
- Never disable, uninstall, or reconfigure the MetaMask Flask environment or system
  packages without asking.

## 7. When unsure, stop and ask

If an action could lose funds, leak a key, rewrite history, or weaken an audit
control, do NOT proceed on your own judgment. Pause and ask a human.
