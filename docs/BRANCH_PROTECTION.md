# Branch Protection for `main`

> **Why:** `CODEOWNERS` and the agent-safety rules only *advise* unless GitHub
> branch protection *enforces* them. This doc is the source of truth for the
> `main` ruleset on `bytewizard42i/Cardano-native-metamask`.
>
> **Who can apply it:** a repo admin (John). It cannot be set from a normal
> commit — it's a GitHub setting (web UI or API).

---

## 1. Settings to enable (web UI)

GitHub → **Settings → Branches → Add branch ruleset** (or "Add rule") for `main`:

| Setting | Value |
|---|---|
| **Require a pull request before merging** | ON |
| → Required approvals | 1 |
| → **Require review from Code Owners** | ON (activates `.github/CODEOWNERS`) |
| → Dismiss stale approvals on new commits | ON |
| **Require status checks to pass** | ON |
| → Required checks | the CI jobs from `.github/workflows/ci.yml` (e.g. `typecheck`, `test`) |
| → Require branches to be up to date | ON |
| **Require conversation resolution before merging** | ON |
| **Do not allow force pushes** | ON (blocks history rewrite) |
| **Do not allow deletions** | ON (blocks deleting `main`) |
| **Require linear history** | ON (optional, recommended) |
| **Include administrators** | ON (so the rules apply to everyone) |

---

## 2. Apply it via the GitHub CLI (one command)

Requires `gh` authenticated as a repo admin (`gh auth status`).

```bash
gh api -X PUT repos/bytewizard42i/Cardano-native-metamask/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -F "required_pull_request_reviews[require_code_owner_reviews]=true" \
  -F "required_pull_request_reviews[required_approving_review_count]=1" \
  -F "required_pull_request_reviews[dismiss_stale_reviews]=true" \
  -F "required_status_checks[strict]=true" \
  -f  "required_status_checks[contexts][]=typecheck" \
  -f  "required_status_checks[contexts][]=test" \
  -F "enforce_admins=true" \
  -F "required_conversation_resolution=true" \
  -F "allow_force_pushes=false" \
  -F "allow_deletions=false" \
  -F "restrictions=null"
```

> Adjust the `contexts[]` values to match the exact job names reported by
> `.github/workflows/ci.yml` (check a recent run's check names if unsure).

Verify afterwards:

```bash
gh api repos/bytewizard42i/Cardano-native-metamask/branches/main/protection | jq '{force_push: .allow_force_pushes.enabled, deletions: .allow_deletions.enabled, code_owners: .required_pull_request_reviews.require_code_owner_reviews, admins: .enforce_admins.enabled}'
```

---

## 3. What this protects against

| Threat | Control |
|---|---|
| Force-push / history rewrite on `main` | `allow_force_pushes=false` |
| Deleting `main` | `allow_deletions=false` |
| Unreviewed changes to the audit-critical Snap | `require_code_owner_reviews` + `CODEOWNERS` |
| Merging red builds | `required_status_checks` |
| Admins bypassing the rules | `enforce_admins=true` |

Pairs with `.windsurf/rules/repo-safety.md` (agent guardrails) and
`.github/CODEOWNERS` (review gates).
