# FlowPro — Address Resolution Engine: Complete Engineering Reference

*Definitive technical documentation of the address-resolution IP. Written to onboard a developer or AI (e.g. Fable 5) cold — enough to finalize gaps and adapt the engine to new markets (the US 900-unit-complex sister project). Self-contained; assumes no prior context.*

*Last updated 2026-07-27.*

---

## 0. TL;DR
Property-management platforms email free-text work orders; a trade's job system (Simpro) needs each turned into a job attached to the right **site** (property) and **customer** (managing agency). Simpro has **no fuzzy search** ("46 Emerald Blvd" never matches "46 Emerald Boulevard"), so ~50% of valid orders failed. The fix: a local **mirror** of Simpro + a **two-sided normalizing fuzzy matcher** + a **learned memory**, all in the CRM ("the brain"), with n8n doing the I/O ("the hands"). It resolves messy addresses, auto-creates genuinely-new sites, and never mis-dispatches. Validated ~92% correct auto-match, 0 dangerous wrong-matches.

---

## 1. The problem
- **Source:** Tapi (property-mgmt platform) emails a work order; the address is free-text, messy, abbreviated ("Blvd", "St", "Cres", "u2/46").
- **Destination:** Simpro (trade job system). A job must reference a **Site ID** (the property) and a **Customer ID** (the agency). Simpro's API search is exact/substring only — no fuzzy, confirmed with Simpro. So abbreviation/format differences = no match.
- **Old behaviour:** unmatched orders were dumped into an Outlook **"FlowProIssues"** folder for manual handling — ~50% of valid orders, defeating the automation.
- **Goal:** resolve the address to the correct existing site, auto-create the site when it's genuinely new, route only true ambiguity to a human, and never dispatch to the wrong door.

## 2. Architecture — "n8n = hands, CRM = brain + memory"
```
Outlook inbox ──poll──> n8n (PPG-create-job) ──calls──> CRM /api/flowpro/resolve
   (Tapi emails)          │                                   │ (matches against a LOCAL
                          │  scrape Tapi page (Puppeteer)     │  mirror of ALL Simpro sites
                          │  ▼                                │  + a learned memory)
                          │  extract-and-create-job (sub):    ◄── decision + site + customer
                          │    resolve → decide → create Simpro job → attach PDF →
                          │    accept on Tapi → SMS tenant → move email → learn
```
- **CRM:** Next.js (App Router) + Postgres (Supabase) + Drizzle ORM, deployed on Netlify. Holds the mirror, the matcher, the memory. **All matching runs here**, immune to Simpro's search limits.
- **n8n:** self-hosted workflow automation. Polls, scrapes, orchestrates Simpro/Outlook/Twilio, writes back the learned mapping.
- **Auth:** n8n → CRM via a shared secret header `x-crm-webhook-secret` (= `N8N_WEBHOOK_SECRET`).

## 3. Data model (Postgres, all rows scoped by `team_id` for future multi-tenant)
| Table | Role | Key columns |
|---|---|---|
| `flowpro_sites` | **Mirror** of Simpro sites | `simpro_site_id`, `name`, `address_line/city/state/postcode`, `customer_ids[]`, `archived`, **`address_key`** (canonical), `raw_data`, `synced_at` |
| `flowpro_customers` | **Mirror** of Simpro customers (agencies) | `simpro_customer_id`, `company/given/family_name`, **`email_domains[]`**, `raw_data` |
| `flowpro_site_map` | **L0 learned memory** (address → site) | **`address_key`** (unique), `simpro_site_id/name`, `simpro_customer_id/name`, `source` (`backfill`\|`auto_match`\|`human_confirm`\|`created`), `times_used` |
| `flowpro_customer_map` | **Agency memory** (domain → customer) | `agency_key` (email domain), `simpro_customer_id`, `source` |
| `work_orders` | Log of **successful** jobs (not failures) | full WO snapshot incl. `property_address`, `simpro_site_id`, `pm_email`, sms/pdf/tapi status |

The mirror is refreshed hourly by an n8n sync workflow (`syncSites`/`syncCustomers`, chunked 250/batch). Freshness matters: new Simpro sites appear in the mirror within the hour, so human-created sites become matchable automatically.

## 4. Normalization — `normalizeAddress()` (the heart) — `lib/flowpro/address-matcher.ts`
**Principle: normalize BOTH sides** (the work order AND every candidate site) to a canonical form, then compare. Steps:
1. Lowercase; replace punctuation `.,;:()'"` with spaces; collapse whitespace.
2. **Parse unit** via patterns: `unit 2 46`, `u2/46`, `2/46`, `flat/apt/shop/suite/lot N/…`. (⚠ AU-shaped — unit BEFORE number. See §11 for the US gap.)
3. Strip **postcode** (a 4-digit token not in first position), **state** (nsw/vic/qld/sa/wa/tas/nt/act), **noise** (australia/aus/au).
4. **Street number** = first token starting with a digit.
5. **Expand street-type abbreviations** from a 100-type / 191-abbreviation dictionary (Australia Post / AS-NZS 4819 / GNAF): `blvd/bvd/boulevarde→boulevard`, `st/str→street`, `cres/cr→crescent`, … Special case: `st`/`str` at the **start** = "saint".
6. Split remaining into **streetName / streetType / suburb**; expand leading **directionals** in the suburb (n/s/e/w → north/south/…).
7. Build **`canonical`** = `[u<unit>] <number> <streetName> <streetType> <suburb>` (filtered, space-joined).

`addressKey(raw)` = `normalizeAddress(raw).canonical` — the **stable key** stored in `flowpro_site_map` and used for the O(1) L0 lookup. **Invariant:** every surface variant of an address must normalize to the SAME key, or memory silently misses (there's a self-test for this).

## 5. Matching — `scorePair()` + `matchSite()`
**`scorePair(wo, site)` → 0..1:**
- **Number gate:** if both have a number and they don't match (via `numbersMatch`, which handles ranges `12-14` and suffixes `46A`), return 0.
- Weighted **Jaro-Winkler**: streetName ×0.55, streetType ×0.15 (exact), suburb ×0.25 (JW), unit ×0.05 (exact). Normalize by the weight actually present.
- Small adjustments: both-numbers +0.03; number-differs ×0.9; postcode match +0.02 / mismatch ×0.85.
- **Sibling-premises cap** (added 2026-08-05): if the rest is a **strong building match** (`s ≥ 0.9`) → cap to **0.86** (stays visible in the review band, never auto-matches); else ×0.5. Applies to BOTH: **unit mismatch** (both have units, differ — the 900-unit-complex rule, see §7) AND **bare-vs-suffixed street number** (`41` vs `41a` — usually different dwellings on a subdivided lot; found auto-matching in live PPG data).

**`matchSite(woAddress, sites, opts)` → decision:**
- Thresholds (defaults): `acceptAt = 0.93`, `reviewAt = 0.75`, `minGap = 0.04`.
- Score all candidates, keep those `≥ reviewAt*0.8` (0.60), sort desc.
- **Duplicate detection:** other candidates whose `canonical` == the top's canonical = same physical address, different Simpro site id (data-quality dupes).
- **Agency disambiguation:** if the WO's agency (`preferCustomerId`) uniquely owns one of the close candidates, lock to it (`agencyConfirmed`).
- **`unitMismatch` flag:** same building, different/unknown unit. Computed against the units revealed by **ANY** of the record's address strings (2026-08-05): Simpro records often carry the unit only in the NAME while the address line omits it — the unit-less string used to sail past the cap at 0.98 and could auto-match a wrong unit. Now: if the WO names a unit no string of the record corroborates (different unit in the name, or a bare building record), the score is capped into the review band and flagged. The record whose name reveals the CORRECT unit is unaffected.
- **`numberConflict` flag:** street numbers agree only across a bare/suffixed split (`41` vs `41a`) — same treatment as `unitMismatch` in the cascade.
- **Decision cascade:**
  1. duplicate & no agency → `review` (never guess the billing record)
  2. **unitMismatch or numberConflict → `review`** (never auto-match a sibling unit or a suffixed-number sibling, even under agency)
  3. agency-confirmed & ≥reviewAt → `match`
  4. ≥acceptAt & clear of runner-up by minGap → `match`
  5. ≥reviewAt → `review`
  6. else → `no-match`

Decision meaning: **`match`/`hit`** → safe, create the job. **`review`** → human confirm (routes to FlowProIssues Red). **`no-match`** → treat as a **new property** (auto-create the site).

## 6. Resolve service — `resolveSite()` — `lib/flowpro/service.ts`
1. **L0 memory:** exact `address_key` lookup in `flowpro_site_map` → instant **`hit`** (O(1), no Simpro call).
2. **Agency:** resolve `preferCustomerId` from `flowpro_customer_map` by the WO's PM email domain (disambiguates dupes/ties).
3. **L1 fuzzy:** `matchSite` against the mirror (all active sites).
4. Returns `{decision, siteId, customerId, candidates, addressKey, parsed, …}`. **Only surfaces a concrete site/customer on a confident `match`** — `review`/`no-match` null them so a non-match can't advertise a bogus site.
- **`learnSite()`** — the single write path. After n8n commits a job, records `address_key → site` (and agency `domain → customer`). Sources: `auto_match`, `human_confirm`, `created`, `backfill`. This grows the L0 memory so repeats become instant hits. *(Known gap: manual human resolutions in Simpro currently only get learned passively via the hourly mirror sync — wiring `learnSite` into the human-resolution step is a pending improvement.)*
- **`parseDisplayAddress()`** — a SEPARATE parser from the matching normalizer: produces human-readable components (original casing) — `addressLine/city/state/postcode` — for **creating** a Simpro site. Robust postcode (takes a tail 4-digit, never the street number), state detection with default, suburb. Mirrored inline in the n8n `Prep Site Create` node so site-creation works even without the CRM (handover-safe). Returned on `resolve` as `parsed`.

## 7. The unit model (critical for US 900-unit complexes)
A 900-unit gated community is **one street address with 900 units** — unit precision *is* the product. Rules:
- Correct unit present → **matches** that unit (never a sibling).
- Correct unit absent, building known (units 4 & 7 exist, WO is unit 6) → **`review` with sibling units visible**, NEVER silently "new" and NEVER auto-matched — a human confirms "genuinely new unit vs. typo for 4/7".
- Even under agency confirmation, a wrong unit never auto-matches.
The decision logic here is **market-agnostic**: once US unit notation parses (§11), this behaviour applies unchanged. Tests: the 3 "Houston 900-unit" cases in `address-matcher.test.ts`.

## 8. Workflow integration (n8n) — `extract-and-create-job.v2-autocreate.json` + `PPG-create-job.json`
- **Parent** (`PPG-create-job`): Outlook poll (filter `subject startsWith '[TAPI-'`, **excludes** the FlowProIssues folder, last-24h window) → calls the sub → on success: SMS tenant → move email → log to CRM. Survives sub errors (`onError: continueErrorOutput`).
- **Sub** (`extract-and-create-job.v2-autocreate`): scrape Tapi page (Puppeteer) → **resolve** → branch:
  - `hit`/`match` → build + create Simpro **job**
  - `review` → FlowProIssues **Red** (human)
  - `no-match` → resolve customer → **auto-create the site** → job
  - then: attach PDF → accept on Tapi → **learn** → return; parent SMSes tenant.
- **Resilience built in:**
  - **PDF attach:** retries 3× then **continues + labels** the email `[PDFNotAttached]` (job is never lost).
  - **FlowProIssues runs throw** → the sub execution shows **red** with a scannable message (`FlowProIssues → <tag> · <ref> · <address>`) instead of a misleading green "success".
  - **SMS number** normalized to E.164 (handles `0423…`, `423…`, `61…`, `+61…` — no double country code).
- **Reprocessing safety (why the backlog can't duplicate):** folder-exclude + subject-relabel (`[NewJobSiteFound]`/`[NoJobSiteFound]` no longer matches `[TAPI-`) + 24h window. Auto-create only ever sees new incoming orders.

## 9. Hard-won lessons (distilled from the build)
- **Two-sided normalization beats one-sided.** Normalizing only the query (the original approach) still missed; normalizing candidates too is what fixed "Blvd≠Boulevard".
- **Backfill must be validated.** Seeding memory from historical mail *without* checking each entry poisoned it (wrong instant-hits). Fix: only seed a mapping if `scorePair(normalized WO, normalized site) ≥ 0.9`, and clear prior `source='backfill'` rows first.
- **High exception volume ≠ a bug.** A scary ~54% FlowProIssues rate turned out to be **genuine growth** — the client onboarding ~7 new properties/day. Proved by: mirror is fresh, matcher scores **60/60** on recent known-good orders, and the "existing" sites' `created_at` showed they were created *after* the work orders (by the human resolving the backlog). Lesson: always separate "new property" from "matcher failure" using `created_at` + a regression replay before concluding.
- **`no-match` precision is deliberately defensive.** Anything scoring ≥0.60 becomes `review`, not `no-match` — so auto-create almost never fires on an existing property. That's what makes auto-create safe to leave on.
- **Duplicate Simpro records + empty agency map drive avoidable Reds.** 602 duplicate `address_key`s (1,225 sites) with an almost-empty `customer_map` (9/2,818) and **0 populated `email_domains`** → ambiguous dupes fall to review. Fix: populate `email_domains` in the customer sync so agency disambiguation resolves them automatically.
- **Units were a blind spot.** A wrong-unit penalty that buried sibling units made "6/615 Brighton" look brand-new. Fixed with §7's review-with-siblings.
- **Small integration bugs bite:** SMS hard-coded `+61` in front of numbers that already had it (`+61+61…` → invalid); a dead "first-comma-part" clipper lingered from the pre-CRM era. Both fixed.

## 10. Files, tests, diagnostics
- **Engine:** `lib/flowpro/address-matcher.ts` (normalize + score + match), `lib/flowpro/service.ts` (resolve/learn/sync + `parseDisplayAddress`).
- **Routes:** `app/api/flowpro/{resolve,learn,resolve-customer,sync-sites,sync-customers}/route.ts`; auth in `lib/flowpro/http.ts`.
- **Tools:** `lib/flowpro/measure.ts` (`--validate` replays known-good WOs vs the live mirror), `lib/flowpro/backfill.ts` (validated memory seeding).
- **Tests:** `npx tsx lib/flowpro/address-matcher.test.ts` → **29/29** (includes 3 Houston/unit cases + 8 sibling-premises safety cases). Needs `tsx` (`pnpm add -D tsx`) or compile with local `tsc` + run on node.
- **Workflows:** `n8n-workflows/` (gitignored — embed the webhook secret; import into n8n directly).
- **Diagnostics (read-only psql on `POSTGRES_URL`):** mirror freshness `SELECT count(*),max(synced_at) FROM flowpro_sites`; memory growth `… GROUP BY source FROM flowpro_site_map`; duplicate density on `address_key`; replay a failing address by POSTing to `/api/flowpro/resolve`.

## 11. US adaptation — the sister-project seed
**The blocker (proven):** `normalizeAddress` is AU-shaped — it expects the unit BEFORE the number (`302/123 Main St`). US notation puts it AFTER (`123 Main St Apt 302`, `#302`, `Unit 302`, `Bldg 5 Apt 302`), which the current parser fails to extract (or garbles). For a 900-unit complex, every unit then collapses to the base address → the matcher can't tell 302 from 305.

**What to build (US mode):**
1. **Unit parsing** for `Apt/Apt./Unit/#/Ste/Suite/Bldg/Building/Rm/Fl`, unit-AFTER-street. Keep the AU `302/123` path (dual-mode via a **region flag** `AU|US` on `normalizeAddress`/`MatchOptions`, default per tenant).
2. **State** — 2-letter US (50 + DC/territories) vs AU 3-letter; **ZIP** 5-digit (or ZIP+4) vs AU 4-digit. Update the trailing-token strip + `parseDisplayAddress`.
3. **Street suffixes** — the dictionary overlaps (St/Ave/Blvd/Dr/Ln/Ct/Pl); add US-specific, verify no AU-only expansion misfires.
4. **Directionals** — US leans on prefixes (`123 N Main St`, `W 4th St`) — already partly handled; verify.
5. **Validation source** (optional) — swap AU G-NAF assumptions for **USPS / Smarty / Melissa**.
6. **Tests** — a US suite mirroring the AU one, including a synthetic 900-unit complex.

**Reuse as-is (market-agnostic):** the unit-decision logic (§7), the thresholds/decision cascade (§5), the memory model (§3/§6), agency disambiguation, the mirror/sync pattern. **The US session is parsing, not decision-making.**

Companion brief: `docs/FLOWCONTROL-US-UNIT-NORMALIZATION.md`. Market thesis: `docs/FLOWCONTROL-US-MARKET-RESEARCH.md`.
