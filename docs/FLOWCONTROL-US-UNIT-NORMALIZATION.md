# FlowControl — US Address / Unit Normalization (deferred brief)

*Created 2026-07-26. Parked for a dedicated session. Trigger: the Houston 900-unit gated-community prospect — the first US client. Do NOT start until AU/PPG is handed off.*

## Why this exists
The address matcher/normalizer (`lib/flowpro/address-matcher.ts`) is **AU-shaped**. It works beautifully for Simpro/PPG but breaks on US conventions. A 900-unit complex is **one street address with 900 units**, so unit parsing *is* the product there — if units don't parse, every unit collapses to the base address and the matcher can't tell 302 from 305.

## The proven gap (tested 2026-07-26)
`normalizeAddress` expects the unit **before** the number (AU "302/123 Main St"). US puts it **after**:

| Input | Current result | Should be |
|---|---|---|
| `302/123 Main St` (AU) | unit `302` ✓ | — |
| `123 Main St Apt 302, Houston TX` | unit `""` ✗ | unit `302` |
| `123 Main St #302, Houston TX` | unit `""` ✗ | unit `302` |
| `123 Main St Unit 302` | unit `"nit"` ✗ (garbage) | unit `302` |
| `Bldg 5 Apt 302, 123 Main St` | unit `302`, num `5` ✗ (scrambled) | bldg `5`, unit `302`, num `123` |

## What's ALREADY done (reuse it)
The **unit-mismatch decision logic** is done and shipped in the AU matcher (2026-07-26): same building / different unit → **review** with siblings visible, never a wrong auto-match even under agency confirmation, correct unit still matches. **This logic is notation-agnostic** — once US units parse correctly, it just works. So this session is *parsing*, not decision-making.

## Scope for the US session
1. **US unit notation** — parse unit AFTER the street: `Apt`, `Apt.`, `Unit`, `#`, `Ste`, `Suite`, `Bldg`/`Building`, `Rm`, `Fl`. Handle `123 Main St #302`, `123 Main St, Apt 302`, `Bldg 5 Unit 302`. Keep the AU `302/123` path working (dual-mode, or detect by country/region).
2. **US street suffixes** — the AU dictionary overlaps (St/Ave/Blvd/Dr/Ln/Ct/Pl) but add US-specific (Pike, Turnpike, Trail already there, Highway, etc.) and confirm no AU-only expansions misfire.
3. **State/ZIP** — 2-letter US states (50 + DC/territories) vs AU 3-letter; 5-digit (or ZIP+4) postcode vs AU 4-digit. Update the trailing-token strip + `parseDisplayAddress`.
4. **Directionals** — US uses N/S/E/W prefixes heavily ("123 N Main St", "W 4th St") — already partly handled; verify.
5. **Address validation source** — swap AU G-NAF assumptions for USPS/Smarty/Melissa (easier + better coverage in the US) if/when we add validation.
6. **Tests** — a US test suite mirroring `address-matcher.test.ts`, including a synthetic 900-unit complex (match exact unit; new unit → review + siblings; never cross-unit auto-match).

## Design note
Prefer a **region flag** (`AU` | `US`) on `normalizeAddress`/`MatchOptions` over trying to auto-detect, so the same engine serves both markets cleanly. Default per deployment/tenant.

## Effort
~1 focused session for parsing + tests (the decision logic is already built). Address-validation integration (Smarty/USPS) is a separate, optional add-on.

## Related
- Market thesis: `docs/FLOWCONTROL-US-MARKET-RESEARCH.md`
- Maestro/positioning + interview plan: `docs/SESSION.md`, `docs/FLOWCONTROL-CUSTOMER-INTERVIEW-GUIDE.md`
- AU handoff (must finish first): `docs/FLOWPRO-AU-HANDOFF-RUNBOOK.md`
