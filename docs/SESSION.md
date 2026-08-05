# Session state — FlowPro / FlowControl (resume point)

*Last updated: 2026-08-05. Read this first to pick up where we left off.*

## 🚨 2026-08-05 — ROOT CAUSE of the ~40% red rate: production silently ROLLED BACK to v1 on 07-27

The "too many review items" investigation (Fable 5) found the red rate is NOT the v2 matcher's review behaviour — **the v2 brain isn't running at all**:

- **What happened:** the runbook's Step-2 parent import (07-27 18:08 UTC) used the repo's `n8n-workflows/PPG-create-job.json`, whose `Call extract-and-create-job` node carried a **stale sub-workflow reference** to the OLD pre-CRM v1 sub (`BC9zzabGVrI6nMVH`). Importing it silently re-pointed production away from v2 (`WXihj3biRDzFT8no`). Since then every work order runs **v1**: Simpro exact-prefix search on the clipped address ("Blvd"≠"Boulevard" bug back), **no CRM resolve, no learning, no auto-create** (v1's Create Site nodes are disabled), and every miss labelled `[NoJobSiteFound]`/Red (v1 has no Blue path — "zero blue items" was an artifact of the rollback, not auto-create working).
- **Evidence:** v2 sub last executed 07-24 (matches `flowpro_site_map` last write 07-24 exactly — 0 writes despite 30 jobs since); v1 executions resume 07-26 23:18 UTC (= swap morning Adelaide); live workflow fetched via n8n API is the 27-node v1 (updated 07-08); of 75 post-swap executions: 31 jobs, 23 red (43% ≈ the observed 7:5).
- **The good news:** the v2-autocreate content WAS correctly imported into `WXihj3biRDzFT8no` on 07-26 (36 nodes, Create Site enabled, all credentials mapped — verified identical to the local file). It has simply never run. **The fix is a one-click re-point of the parent's Execute node back to it** (+ Netlify deploy of the matcher fixes below, first).
- **Red-pile categorization** (23 red executions 07-27→08-05, 22 unique, replayed via live `/resolve` + `created_at` cross-check): **~16 (73%) genuinely-new properties** → v2 would have auto-created (no red); **~2 (9%) existing sites v1's search missed** → v2 would have matched; **2 (9%) new-unit-at-known-building** → correct §7 review-with-siblings; **~2 (9%) genuine data-mess/duplicate reviews** (e.g. 15 Charbray double-record). So ~82% of the red pile is the rollback, NOT matcher behaviour. Hypothesis "the unit-safety rule drives the reds" is **refuted** (2/22); "learning stalled" is real but a symptom of the rollback (Learn wiring itself verified healthy through 07-24).
- **Two latent WRONG-DOOR holes found & FIXED in the matcher while categorizing** (`lib/flowpro/address-matcher.ts`, tests 29/29):
  1. **Unit-in-name-only:** a record named "4/17 Leadenhall St" with unit-less address line "17 Leadenhall St" scored 0.98 `unitMismatch=false` for a "2/17" WO → would have auto-matched the wrong unit. Now units revealed by ANY record string count; uncorroborated WO units cap into the review band (also covers bare building records = "unknown unit" per §7).
  2. **Suffix asymmetry:** `numbersMatch("41","41a")=true` → WO "41 Glengyle Tce" would have auto-matched "41a" (real case TAPI-20556; 41a existed since go-live, 41 didn't). Now bare-vs-suffixed number = sibling-premises cap + `numberConflict` flag, never auto-matched, still visible for review.
  - Bonus effects: exact-unit hits are no longer minGap-blocked into review by their siblings' unit-less strings (live cases 2/17 Leadenhall, 3/275-277 Portrush now match cleanly), and 5-vs-5A ties resolve to the exact record. Ground-truth replay of all 512 logged WOs: **correct 472→484 (95%), review 32→20, wrong 8→8 (same pre-existing historical mis-filings, none new)**.
- **Repo fixes:** local `n8n-workflows/PPG-create-job.json` reference corrected → `WXihj3biRDzFT8no` (the landmine that caused this); matcher + tests updated; this doc + engineering doc §5 updated.
- **GO-LIVE (pending, in order):** (1) deploy CRM to Netlify (matcher safety fixes must precede re-point); (2) re-point parent `PPG-create-job` → `extract-and-create-job (v2 — CRM resolution)` in n8n (creds already mapped; low-traffic window); (3) verify first executions: Resolve/Learn nodes fire, `flowpro_site_map` writes resume, a genuinely-new WO auto-creates; (4) expect red rate to drop from ~43% to roughly ~10% (new-unit + dup reviews only).

## TL;DR
1. **FlowPro→Simpro fix: DONE and LIVE** (the reason the session started).
2. **Exit from the Selva/PPG collaboration: deliverables produced, a few decisions pending.**
3. **Strategic pivot: adapt the platform into "FlowControl," a US/Canada CONTRACTOR-side inbound-capture product.** Deep market research done.
4. **NEW asset surfaced: "Maestro" (voice AI + telephony) — strengthens and reorders the thesis.** User to share Maestro details next.

---

## 1. FlowPro → Simpro fix (delivered, live)
Fixed the ~50%-failure bug where Tapi work orders couldn't be matched to Simpro sites ("Blvd"≠"Boulevard") and landed in the Outlook **FlowProIssues** folder for manual handling.
- **Architecture:** `n8n = hands`, `CRM = brain + memory` (matcher + learned maps in Postgres). Code in `lib/flowpro/` + `app/api/flowpro/`; migration 0004.
- **Result:** validated on 438 real work orders → **~92% correct auto-match, 0 true-wrong** (the "wrong" ones were historical mis-filings the matcher *corrected*).
- **LIVE since 2026-07-12** (PPG-create-job reactivated, calling `extract-and-create-job.v2.json`; FlowProIssues now split-labelled 🔵`[NewJobSiteFound]` / 🔴`[NoJobSiteFound]`).
- **Blue vs Red — verified 2026-07-14 (NO BUG):** 🔵`[NewJobSiteFound]` = decision `no-match` (nothing close → genuinely new site). 🔴`[NoJobSiteFound]` = decision `review` (a look-alike exists, human confirm). Routing: `Resolved directly?`(hit|match→job) → `New site?`(no-match→Blue, else→Red). Live-checked the 3 example WOs via `/api/flowpro/resolve`: 1A Randell Rd (0.745→Blue ✅), 7 Bristol Lane (0.738→Blue ✅), 9 Bryant St (0.838 vs "9 Bryan St/Brian St, Salisbury"→Red ✅ genuine near-twin). All 3 since created in Simpro (siteIds 24758-60, sequential) → now auto-match. Explainer for Selva: `docs/FLOWPRO-FLOWPROISSUES-REPORT.md` (+ print-ready `.html`).
- **Recommended next FlowPro improvement (the lever to shrink Red):** close the learning loop — when a human resolves a FlowProIssues item (creates the site in Simpro), also call Learn Site so the L0 map + agency→customer map grow. Today manual resolutions only get learned passively via the hourly mirror-sync (yields `match` not `hit`, never teaches the agency link).
- **Auto-create gate:** `v2-autocreate.json` verified to auto-create ONLY on `no-match` (Blue), guarded by customer-resolve; `review` (Red) still routes to a human. Before flipping it on: spot-check current Blue flags are genuinely new in Simpro.
- **Address-capture reviewed (2026-07-14) — NOT a matching bug:** scraper already captures the FULL address (`propertyAddress` = all property lines) and `Resolve Site (CRM)` already sends it (`rawAddress:$json.address`). Proof: 9 Bryant St went Red at 0.838 (needs suburb); street-only would've been 0.939→wrong auto-match. The `normalizeAddress` first-comma-part field is a DEAD leftover (only the old pre-CRM `extract-and-create-job.json` reads it). **Real fix landed in the site-CREATION path** (`Prep Site Create`, autocreate): naive `split(',')` had 3 bugs — hardcoded `state:'SA'`, positional `city`, postcode regex grabbing a 4-digit STREET NUMBER. Replaced with a hardened AU parser (state from tail, postcode = tail 4-digit not leading, suburb = last segment). **Handover-safe design:** parser is INLINE + self-contained in the n8n node (works with NO CRM after Ady pulls the plug); prefers CRM `parsed` if present. CRM also now returns `parsed` (unit/street/city/state/postcode) from `/resolve` — `lib/flowpro/service.ts:parseDisplayAddress` (twin of the node's copy). tsc clean. **Needs Netlify deploy for live `parsed`; node already works standalone.**
- **Workflow debuggability + resilience pass (2026-07-15) — needs re-import to n8n:**
  1. **Clipper removed** — deleted the dead `normalizeAddress` (first-comma-part) function + return field from `Prep data for work order` in BOTH v2 files (confirmed via live screenshot: resolve sends full `$json.address`; clipper was only read by the retired pre-CRM `extract-and-create-job.json`).
  2. **FlowProIssues now shows as ERROR (scannable)** — added throw nodes `🛑 Flag FlowProIssues` (after `No Site Found Payload`) and `🛑 Flag Job-Create Failed` (after `No job created Payload`) in v2 sub; message = `FlowProIssues → <tag> · <ref> · <address>`. Parent `Call extract-and-create-job` set to `onError: continueErrorOutput`, error output → `Idle - Error Handled` (no SMS, batch keeps processing, parent stays green; sub execution goes RED). Replaces the old soft-error `workflowExecutionError` handling for these cases.
  3. **PDF-attach resilience** — `📎 Attach PDF to Job` now `retryOnFail` 3× @3s + `onError: continueErrorOutput`; on final failure → new `🏷️ Flag PDF Missing` (Outlook: category `Orange` + subject `[PDFNotAttached]`) → rejoins `Auto-accept job on Tapi`, so the job stays created and the tenant is still SMS'd; email flagged for a human to attach the PDF manually.
  - **Applied to `extract-and-create-job.v2.json`, `extract-and-create-job.v2-autocreate.json` (both subs), + `PPG-create-job.json` (parent).** As of 2026-07-26 #2/#3 ARE mirrored into `v2-autocreate.json` (36 nodes; throws on `No Site Found Payload`/`No job created Payload`, PDF retry+Flag PDF Missing). **Decision: go straight to auto-create** — import `v2-autocreate.json` (the all-in-one: auto-create + all fixes), NOT `v2.json`. `v2.json` kept as manual fallback only. **Re-import caveat:** re-map OAuth creds — `🏷️ Flag PDF Missing` (Outlook) + `➕ Create Site` (Simpro); CRM nodes use the embedded secret header (no cred). Test one WO of each type first.
- **High-FlowProIssues investigation (2026-07-25/26): NOT a regression — engine healthy.** User alarmed at ~19 FlowProIssues vs ~16 success in a recent window (~54%). DB diagnosis (via psql on Supabase, read-only):
  - Mirror FRESH: `flowpro_sites`=20,064 (grew from 19,979), synced <1h ago, 0 archived; `flowpro_customers`=2,818. Hourly sync works → stale-mirror catastrophe RULED OUT.
  - **Live regression test: 60/60 recent known-good WOs resolve CORRECTLY via live `/resolve` (0 wrong, 0 review, 0 no-match).** Matcher provably healthy → the 19 are legitimately unmatched = genuinely-new (Blue) + ambiguous dups (Red), i.e. GROWTH, not a bug. → signal to turn on `v2-autocreate`.
  - Confirmed weaknesses (not the 54% cause): `site_map` has 0 `human_confirm` (learning loop dead for manual fixes) + only 50 `auto_match`; `customer_map` only 9/2818 agencies; `flowpro_customers.email_domains`=0/2818 (sync doesn't populate domains → agency disambiguation nearly off); 602 duplicate address_keys / 1,225 sites → drive avoidable Reds.
  - Recent-success agency mix (30d): harrisre.com.au 71, jumpproperty 15, ocre 9, shorlandre 3, raywhite 1.
  - **RESOLVED 2026-07-26 — it's GROWTH, not a bug (definitive).** User pasted 20 FlowProIssues subjects (9 Red / 11 Blue). Replayed via `resolve`: ~18/20 resolve to an exact Simpro site NOW — BUT `flowpro_sites.created_at` proves those sites were first-synced **07-20→07-24** (IDs 24798-24841), i.e. created by humans AFTER the WOs, in response to the FlowProIssues. They did NOT exist at WO-time → system correctly flagged them. Mirror shows **~95 new sites created in 13 days (~7/day)** = PPG onboarding new properties fast (e.g. Marblewood Way, Mount Barker estate filling in — "20" existed at go-live, "24"/"32" new). The manual labor per new property (auto-create OFF) is the felt pain, NOT a matcher fault.
    - Categorized: ~10 genuinely-new→Blue (auto-create handles), ~5 genuinely-new→Red (a same-number different-street lookalike scored 0.75-0.93, e.g. "10 Caralue" vs "10 Castle St" 0.87), ~3 real ambiguity→Red (2 Giles Avenue = TRUE DUPLICATE ×2 in mirror; 275-277 Portrush = multiple units), 2 still open (7A Lelos, 6/615 Brighton).
    - **Auto-create VALIDATED SAFE by this batch:** every Blue was genuinely new (0 false no-matches → no duplicate risk). Turning on `v2-autocreate` auto-handles ~half the volume (the Blues); Reds stay manual.
  - **NEXT (priority):** (a) **turn on `v2-autocreate`** — the real lever for the volume; (b) wire learning loop on human-resolve; (c) populate email_domains in customer sync → agency disambiguation to shrink dup-driven Reds.
- **Unit-matching refinement DONE (2026-07-26) — `lib/flowpro/address-matcher.ts`:** same building (number+street+suburb) but DIFFERENT unit → now routes to **review** with sibling units visible, instead of burying them into a no-match ("new site"). Softened the unit penalty (`s>=0.9 ? 0.86 : s*0.5`) so siblings stay in the review band; added `unitMismatch` to `ScoredCandidate`; decision logic never auto-matches a wrong unit even under agency confirmation; correct unit still auto-matches. **21/21 self-tests pass** (`address-matcher.test.ts`, +3 new Houston/unit cases), tsc clean. Real "6/615 Brighton Rd, Seacliff" (units 4×2-dup & 7 exist, 6 doesn't) will now go Red-with-siblings instead of misleading Blue. **Not deployed yet** — needs Netlify deploy (live resolve still uses old matcher until then).
- **US ADAPTATION BLOCKER found (Houston 900-unit gated community = first US prospect):** `normalizeAddress` is AU-shaped (expects unit BEFORE number, "302/123"). US notation puts unit AFTER ("123 Main St Apt 302 / #302 / Unit 302") → unit NOT extracted (or garbage: "Unit 302"→unit "nit"; "Bldg 5 Apt 302"→scrambled). For a 900-unit complex every unit collapses to the base address → matcher can't distinguish units. **This is the core US work "regardless of Simpro."** NEXT: build a US normalization mode (Apt/Ste/#/Unit/Bldg unit-after-number, 2-letter states, 5-digit ZIP) + a US test suite mirroring the AU one. Then reuse the same unit-refinement decision logic (already done).
  - Diagnostics: `psql "$POSTGRES_URL"`; replay via POST `/api/flowpro/resolve`; `lib/flowpro/measure.ts --validate` needs `tsx` (not installed locally).
- **Only open technical item:** monitor FlowProIssues volume; if mostly 🔵 and Blue is trustworthy, activate `extract-and-create-job.v2-autocreate.json`.
- Deep detail: `docs/FLOWPRO-CASE-STUDY.md`, runbook `n8n-workflows/FLOWPRO-GOLIVE-RUNBOOK.md`, memory `[[flowpro-simpro-resolution]]`.

## 2. The exit (Selva / PPG collaboration)
~8-month informal collab (no binding contract): Ady = tech, Selva/TotalAI = business. Only ever one client (PPG), unprofitable, high support/emotional tax. **Decision: clean break — offload the PPG operation, keep the IP.**
- **IP position (strong):** Ady owns **FlowPro name** (he coined it), the codebase (in his repos), and the resolution engine. **TotalAI is Selva's** company. No non-compete. PPG barely uses the UI (the automation is the product).
- **Terms:** clean break, keep IP, **no transfer money**; only money = a **one-time $1,500–2,000 support-time settlement** (uncollected support). No ongoing relationship/licensing (he wants zero ongoing access to him).
- **Deliverables produced:**
  - `docs/FLOWPRO-CASE-STUDY.md` (value + handover doc) + shareable artifact: **https://claude.ai/code/artifact/e2ed63ba-5da0-486c-be7e-8c0076182c17** (private until shared).
  - `n8n-workflows/handover/` — standalone decoupled workflows (CRM-logging disabled, secret scrubbed) + `HANDOVER-PACKAGE.md`. Selva gets the "good enough" standalone version; the memory/fuzzy engine stays Ady's IP.
  - `docs/SEPARATION-MEMO.md` — plain-language draft (clean break, IP retained, settlement, mutual release).
- **Pending decisions:** exact settlement figure + currency (AUD likely), cutover date, handover-call terms; then solicitor review of the memo. Optional: send accompanying email to Selva (offered, not yet drafted).
- Note: code lives in TWO remotes — `origin`=`adyngom/saas-starter` (Netlify deploys from here), `totalai`=`ARTIST-AI-TECH/totalai-crm` (org repo). Both `main` are in sync through the flowpro commits. `n8n-workflows/` kept LOCAL only (embeds the webhook secret; not committed by user's choice).

## 3. FlowControl — US/Canada market research (DONE)
Full cited brief: **`docs/FLOWCONTROL-US-MARKET-RESEARCH.md`**. (Deep-research workflow harness errored on a schema bug; research was run manually via web search instead.)

**Core thesis:** Don't build for the property manager (crowded: Lula, Property Meld, Latchel, YC-backed Haven & Vendoroo). **Build for the CONTRACTOR** — the unowned "last mile" of pulling dispatched work from multiple third-party portals INTO the FSM they already run. That's exactly what FlowPro proved (Tapi→Simpro).
- **Wedge:** "Never re-key a portal work order again." Aggregate warranty + PM + facility work orders → resolve property/customer → dispatch-ready job in **Housecall Pro / Jobber** (open APIs; ServiceTitan gated ~$3–10k/yr).
- **Lead channel:** home-warranty + PM contractors (documented re-keying pain that *caps their revenue*). Facilities = expansion.
- **Segment:** 2–15-tech crews. Not solo (churny), not enterprise (on ServiceTitan already).
- **HAVE vs NEED:** engine portable; address matching gets EASIER (US Smarty/USPS vs AU G-NAF); real work = one parser per source ("each source is a new Tapi") + FSM integrations; compliance = US A2P 10DLC/TCPA + Canada CASL.
- **Effort:** ~8–14 weeks to sellable v1 (one source + one FSM). Willingness-to-pay proven by Avoca (~$1B, ~$1,500/mo).
- **Biggest caveat:** the gap is INFERRED — validate with 5–10 customer interviews first.
- User confirmed: **contractor-focused** (was the original intent).

## 4. "Maestro" — conversational AI concierge (reshapes the strategy) — DETAIL RECEIVED 2026-07-13
Ady's separate product (HQIQ / hqiq.ai). **Conversational AI avatar concierge that turns point-and-click into conversation.** Custom-built per industry (look, dress, voice). Clean IP — his to commercialize (built on LiveKit + Gemini Live / OpenAI Realtime as swappable engines; the KB, avatar-generator ecosystem, and orchestration are his).

**LIVE today (web + mobile, LiveKit SDK):**
- **Knowledge base** (first capability): anything informational on a website → grounded KB; ~98% no-hallucination, "source-grounded."
- **DSC — Dynamic Scene Choreography** (proprietary): as the agent gets context, the right UI appears on cue (menu, booking form). Visual + voice together.
- **Tooling:** web search, calendar check + appointment scheduling, DB status lookups (e.g. job status), role-based access to answers.
- **Multi-agent warm handoff:** big orgs get multiple Maestros; specialist transfers mid-conversation ("let me transfer you to…").
- **78 languages** (Gemini Live). Multilingual.
- **Radical transparency stance:** always discloses it's an AI, offers a human + honest wait time. Deliberate anti-deception — a compliance/trust ASSET in the US.
- Current verticals shown: **Legal, Healthcare, Government, Tourism, Education, Real Estate, Finance** — all WHITE-COLLAR / front-of-house. **Trades/home-services is NOT yet a vertical** (net-new persona + KB — but low-lift given the abstraction layer).

**ROADMAP (not built yet):**
- **Telephony** (phone answering) via extending LiveKit to the phone layer — described as relatively contained since KB/tooling/scheduling already exist. Candidate stacks: Retell, Vonage, or extend LiveKit itself; Twilio SMS already integrated. This is the piece that hits the ACUTE "buried in calls / missed calls" pain (Avoca's ~$1B lane).
- Transcripts, KPIs, sentiment analysis down the road.

**How it changes the findings (revised):**
- **Product vision:** "Every inbound request — a customer talking OR a portal dumping a work order — becomes a dispatch-ready job in your system, automatically." Maestro = the HUMAN channel, FlowPro = the MACHINE channel; **both converge on the SAME back end** (resolve customer/property → create job in FSM). Genuinely one machine.
- **The seam is real:** Maestro's live "check calendar / schedule appointment / DB status" tooling is exactly where it calls FlowPro's resolve→job back end.
- **ICP broadens:** missed-calls pain hits ~every home-services shop, not just the PM/warranty niche → voice widens the top of funnel; portal-intake DEEPENS the moat for the PM/warranty sub-segment.
- **Honest correction to the earlier note:** phone-answering is ROADMAP, not live. No single wedge is simultaneously live + acute + US-ready today — every path needs some build. So sequence matters (see below).
- **Competitive:** leapfrogs voice-only (Avoca/Sameday — no portal channel, no visual/web surface) AND PM-side players (don't serve the contractor). Voice + portal + visual-web-concierge together = unowned.
- **New de-risking assets:** 78 languages (US Hispanic + Canada French), transparency stance (TCPA/trust), DSC/avatar (demo weapon + adjacent verticals), multi-agent handoff (scales to bigger shops). Moves opportunity further toward **fundable** (multi-channel AI front office for contractors).
- **New risks:** telephony unbuilt + brings carrier/compliance work (A2P 10DLC, call-recording consent, STIR/SHAKEN); trades persona is net-new; the avatar is a demo/front-of-house asset, NOT core value for a plumber's phone customer — don't over-index on it.

**RECOMMENDED SEQUENCING (voice-led story, risk-managed build):**
1. **Now (0–6 wk) — sell/validate with what's LIVE:** package Maestro as a "trades concierge" demo (home-services persona + KB template + one FSM scheduling hookup). It's the sales + interview instrument; low build.
2. **Wedge (6–14 wk) — telephony extension:** Maestro answers the phone → books/creates the job. The acute, proven-WTP pain. This is what people pay for.
3. **Moat (parallel/after) — FlowPro US portal-intake** for the PM/warranty sub-segment: the channel voice-only competitors can't touch.

---

## Open threads / next-step menu
- **[Maestro]** ✅ Details received + positioning re-run (2026-07-13, §4 above). Voice-led story, risk-managed build (concierge-now → telephony-wedge → portal-moat).
- **[Validation]** Draft customer-interview guide + target list to test BOTH assumptions now: (a) missed-calls pain + WTP for AI phone answering, (b) portal re-keying pain. ← highest-leverage de-risk.
- **[Build scope]** Turn the combined wedge into a concrete v1 spec (voice → job + one portal source → job, one FSM, 10DLC onboarding).
- **[Exit]** Fill separation-memo placeholders; solicitor review; optional email to Selva.
- **[FlowPro ops]** Monitor FlowProIssues Blue/Red mix; decide on v2-autocreate.
- Optional: render the market research as a shareable artifact/deck for a US partner.

## ✅ AU at walk-away state (2026-07-27, Step B)
- **B1 (SMS resilience): DONE** — `SMS to Tenant` onError=continueRegularOutput (UI + file). Bad number no longer blocks email-move/logging.
- **B2 (agency email_domains): NOT VIABLE — do not build.** Data proof: PPG's Simpro maps one agency domain → MANY customers (harrisre.com.au → 19; 9 domains → 31 pairs). Customers are per-landlord/property, not per-agency, so a domain can't pick a customer → agency disambiguation via domain is a dead end. `flowpro_customers.raw_data` also holds only `ID` (0/2820 have emails), so nothing to derive from.
- **Residual Reds (~3) are correct safety behavior:** true duplicates (2 Giles Avenue ×2 in Simpro) + unit ambiguity. Should stay human. Not defects.
- **Remaining "reduce Reds" options (NOT worth it now):** (a) learning loop for HUMAN resolutions needs a Simpro reconciliation to capture manual job creation; (b) de-dupe the 602 duplicate site records = client-side Simpro hygiene. Folder is tiny → leave both.
- **→ AU is done. No meaningful code fix remains.** Focus shifts to US (Fable 5, 900-unit) via `docs/FLOWPRO-ADDRESS-RESOLUTION-ENGINEERING.md` + `docs/FLOWCONTROL-US-UNIT-NORMALIZATION.md`.

## ✅ Auto-create LIVE & client-validated (2026-07-27)
- `v2-autocreate` (all-in-one) imported + active; parent SMS E.164 fix applied live. Platinum/Hilary confirmed the flagged "new site" detections are **all genuinely new** (detection accurate). Backlog she already created manually → will now MATCH (no re-creation). FlowProIssues down to ~3 Reds, no more Blue.
- **Reprocessing is impossible** (Selva's concern): trigger excludes FlowProIssues folder + backlog subjects relabelled (no longer match `[TAPI-`) + 24h window. Auto-create = new incoming only.
- Catalogue: **20,074 active sites / 2,820 customers**, hourly sync (answered Selva's "19k not 1.9k").
- **Definitive engineering doc written: `docs/FLOWPRO-ADDRESS-RESOLUTION-ENGINEERING.md`** — for Fable 5 to onboard cold + seed the US sister project.
- Env move: commit `docs/` + `lib/flowpro/` + `.gitignore` to totalai remote (survives pull); `n8n-workflows/` + `.env`/`simpro.env` transfer OUTSIDE git (secrets).

## ▶ Current focus (2026-07-26)
- **Finish + hand off AU/PPG, then return to US.** The step-by-step is **`docs/FLOWPRO-AU-HANDOFF-RUNBOOK.md`** — deploy CRM code → swap n8n workflows → turn on auto-create → (recommended) learning-loop + agency-domains → clean handoff to Selva (standalone package, Path A). Has a walk-away checklist + diagnostics cheat-sheet.
- **US is PARKED** (user's call) → brief in **`docs/FLOWCONTROL-US-UNIT-NORMALIZATION.md`** (Houston 900-unit; unit-parsing is the work; decision logic already done). Pick up AFTER AU handoff.

## Key pointers
- CRM app: Next.js + Postgres/Drizzle, deployed on Netlify (`flowpro-totalai.netlify.app`).
- Docs: `docs/FLOWPRO-CASE-STUDY.md`, `docs/SEPARATION-MEMO.md`, `docs/FLOWCONTROL-US-MARKET-RESEARCH.md`, `docs/SESSION.md` (this file).
- Handover: `n8n-workflows/handover/`.
- Case-study artifact: https://claude.ai/code/artifact/e2ed63ba-5da0-486c-be7e-8c0076182c17
