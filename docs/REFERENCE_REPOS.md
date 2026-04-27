# Reference Repos

CMM pulls in several MetaMask repositories as **read-only references**
(cloned as forks in `bytewizard42i/*-metamask-johns-copy`, mounted into
`Cardano-native-metamask/references/metamask-*` as nested submodules of
CMM itself — they travel with the project, not the monolith).

Forking buys us: offline grep, stable snapshots, and a clean PR path when
we actually need to contribute upstream.

## The Six

| Local path | Purpose | Primary use in CMM |
|---|---|---|
| `references/metamask-snaps` | The Snaps SDK monorepo. | Grep types, RPC method specs, lifecycle docs. Never modify. |
| `references/metamask-snap-bitcoin-wallet` | **EUTXO template.** Closest architectural cousin to Cardano. | Read first when scaffolding the Cardano handler (M2). Pattern-match UTXO selection, tx building, indexer calls, dialog UX. |
| `references/metamask-snap-simple-keyring` | Keyring-Snap pattern. | Reference when we build the CMM keyring (Midnight + Cardano custody). |
| `references/metamask-template-snap-monorepo` | Canonical Snap scaffold. | Cross-check our `@cmm/snap` layout against MM's blessed shape. |
| `references/metamask-snaps-registry` | Official allowlist registry. | We'll PR our Snap's entry here at M6. |
| `references/metamask-SIPs` | Snaps Improvement Proposals. | File a SIP if we need a non-standard RPC method (likely for Midnight shielded signing). |

## Why Bitcoin Is Special

Cardano inherits the UTXO model from Bitcoin and extends it (EUTXO);
Midnight's shielded UTXOs are a Zcash-flavored twist on the same base.
Both chains we're integrating are UTXO-family, so patterns from
`snap-bitcoin-wallet` transfer much more cleanly than anything from
account-model chains (Solana, EVM). The Solana Snap was intentionally
dropped from this list on 2026-04-24 for that reason.

## How to Refresh Upstream Changes

These are our forks, so they can drift from MetaMask's original repos over
time. To pull upstream changes into a fork:

```bash
# Inside the fork directory
git remote add upstream git@github.com:MetaMask/<original-repo>.git
git fetch upstream
git merge upstream/main    # or rebase
git push origin main
```

Then update the CMM submodule pointer:
```bash
cd /home/js/DIDzMonolith/Cardano-native-metamask
git add references/metamask-<name>
git commit -m "chore: bump references/metamask-<name> from upstream"
```

No rush; we should sync when we notice drift or when we're about to file
a PR. Between refreshes these are a stable snapshot.

## Do NOT Vendor Code

The reference repos exist to **read and learn from**, not to copy from
directly. Any Apache-2.0 / MIT code we adapt must be re-implemented in
our own tree with attribution in the commit message. This keeps the CMM
audit surface clean and avoids license ambiguity.
