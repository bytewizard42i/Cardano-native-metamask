# Naming — CMM

## Decision

**Nickname**: **CMM** (pronounced "see-em-em")

Long forms:
- **External / public**: "Cardano MetaMask"
- **Internal / strategic**: "Cardano + Midnight in MetaMask"

Both expansions work with the same three letters. That's the whole point.

## Why CMM

| Criterion | CMM | CMMN | Verdict |
|---|---|---|---|
| Pronounceable | Yes ("see-em-em") | Awkward ("see-em-em-en") | CMM |
| Searchable | Unique in Cardano + MetaMask context | Unique but harder to type | CMM |
| Covers both chains | Yes (Cardano + Midnight + MetaMask) | No (the N is "Native") | **CMM** |
| Domain / handle availability | Likely workable | Likely workable | Tie |
| Fits a logo | 3 letters, symmetric | 4 letters, awkward | CMM |
| Expands to a tagline | "Cardano + Midnight, one wallet" | — | **CMM** |

The killer reason: **CMM accommodates Midnight inside the same brand without
changing letters later.** CMMN locks us into "Native Cardano" framing and would
need re-branding when we ship Midnight.

## Not used (for reference)

- **CNMM** — Cardano Native MetaMask → "see-en-em-em" is tongue-twisting
- **ADAMask** — cute but ADA-only, no room for Midnight
- **NightMask** / **MidMask** — Midnight-only, awkward for Cardano
- **MaskKano** — too clever, obscures the product
- **Masquerade** — privacy-leaning but overwrought

## Using the name

### In prose
- First mention in a document: "the Cardano + Midnight MetaMask Snap (CMM)"
- Subsequent mentions: "CMM"
- Never: all-caps "C.M.M." with dots

### In code
- Package names: `@cmm/snap`, `@cmm/dapp-sdk`, `@cmm/companion-dapp`, `@cmm/shared`
- npm org (once public): `cmm-project` or `cardanomidnightmask` (pick when we go public)
- Snap `proposedName` in manifest: **cannot** contain "MetaMask" or "Mask" per allowlist rules → use "Cardano + Midnight Wallet" or "Cardano & Midnight" (MM's rule)
- Brand short-name visible to users: "CMM"

### In URLs
- Companion dApp: `cmm.wallet` or `cardano-midnight-metamask.io` (decide pre-launch)
- GitHub repo: stays `bytewizard42i/Cardano-native-metamask` (rename optional later)

### In the Snap manifest (preview)
```json
{
  "proposedName": "Cardano & Midnight",    // no "Mask"/"Meta"/"Snap" allowed
  "description": "CMM — Cardano + Midnight accounts in MetaMask",
  ...
}
```

## Revisit trigger

Rename only if:
- MetaMask itself objects to a name collision
- A compelling partner (CF, Midnight Foundation, IOG) proposes a stronger brand
- A trademark conflict surfaces

Otherwise: **CMM stays.**
