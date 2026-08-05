# FlowPro (PPG / Simpro) — Finalize & Handoff Runbook

*Last updated 2026-08-05. Goal: ship the pending improvements, get PPG to a low-maintenance state, hand it off cleanly, then step away and focus on the US.*

> ## ✅ STATUS 2026-08-05 — Sections 1–4 are DONE; only Section 5 (the handoff itself) remains
>
> - **Sections 1–3 executed 2026-08-05** (after diagnosing that the 07-27 swap had silently re-pointed production to the old v1 sub — see `SESSION.md` for the full account): CRM deployed with the sibling-premises safety fixes (tests **29/29**, ground-truth 484/512 correct), production re-pointed to `extract-and-create-job (v2 — CRM resolution)` with auto-create ON, learning verified reachable, validated backfill run (403 mappings, 6 historical mis-filings refused).
> - **Section 4a (learning loop)**: the workflow's Learn step is live again; human-resolution learning stays deferred (reds are few). **4b (agency email-domains): dead end, do not build** — one PM domain maps to many Simpro customers (per-landlord), proven 2026-07-27.
> - **Section 5 is now packaged and ready to send**: `n8n-workflows/handover-package/` (zip: `n8n-workflows/FlowPro-Handover-TotalAI-2026-08.zip`) — standalone workflows **updated with all CRM-independent fixes** (E.164 SMS, PDF retry+label, error-visible FlowProIssues runs, sub-error-tolerant parent), all CRM references stripped, plus setup guide, operator runbook, expectations doc (honest ~4-in-10 manual rate for standalone), 408-row address-reference CSV, and a both-sides cutover checklist. Separation memo updated to **$1,750 USD**; send the memo separately from the zip.
> - ⚠ Two corrections to the stale text below: the deploy remote is now **`origin` = `ARTIST-AI-TECH/totalai-crm`** (not `adyngom/saas-starter`), and the matcher self-test count is **29/29** (not 21/21). Also add to daily diagnostics: `SELECT max(updated_at) FROM flowpro_site_map` — a frozen memory behind green executions was the July blind spot.

> **How to use this:** work top to bottom. Each step is tagged **[UI]** (you click through Netlify/n8n), **[DB]** (a read-only psql check), or **[DEV]** (a code change — batch these into one short session or hand to a developer). Boxes with **✅ Verify** tell you how to confirm the step worked before moving on.

---

## 0. Where things stand right now

**Healthy and live:** the CRM "brain" (matcher + resolve + hourly Simpro mirror). Diagnosed 2026-07-26: the high FlowProIssues count was **growth, not a bug** — ~7 genuinely-new properties/day, each needing a manual site-create because auto-create is off. Matcher scored 60/60 on recent known-good work orders.

**Done locally, NOT yet deployed/imported** (this is what Sections 1–3 ship):
- `lib/flowpro/service.ts` — resolve now returns a `parsed` address block.
- `lib/flowpro/address-matcher.ts` — unit refinement (same building / different unit → **review** with siblings shown, never a wrong auto-match). 21/21 tests pass.
- `n8n-workflows/extract-and-create-job.v2.json` — dead clipper removed; FlowProIssues runs now flagged as **errors** (scannable); PDF-attach failure now **retries then continues + labels** instead of killing the job.
- `n8n-workflows/PPG-create-job.json` — parent survives a sub error (batch keeps processing).
- `n8n-workflows/extract-and-create-job.v2-autocreate.json` — clipper removed (but the error/PDF improvements are **not** mirrored here yet — see Step 3).
- `.gitignore` — `n8n-workflows/` + `simpro.env` now ignored (secrets can't be committed).

**Backups:** `n8n-workflows/backups/2026-07-15-preswap/*.EDITED.json` (the new versions). You'll add live-export rollbacks in Step 2.

---

## 1. Deploy the CRM code (makes the matcher + resolve improvements live)

**1.1 [UI/terminal] Commit the code changes** — explicit paths only, never `git add -A` (secrets live in ignored files):
```bash
git checkout -b flowpro-au-finalize
git add lib/flowpro/service.ts lib/flowpro/address-matcher.ts lib/flowpro/address-matcher.test.ts .gitignore
git commit -m "FlowPro: unit-mismatch review refinement + parsed address in resolve"
git push origin flowpro-au-finalize
```
> Netlify deploys from `origin` (`adyngom/saas-starter`). Merge to the deploy branch (or push straight to it) so Netlify builds. If you keep the org repo (`totalai`) in sync, push there too.

**1.2 [UI] Publish the Netlify deploy** (if it doesn't auto-publish).

**✅ Verify** — the live matcher now handles units correctly. From the repo root:
```bash
SECRET=$(grep -E '^N8N_WEBHOOK_SECRET=' .env | cut -d= -f2- | tr -d "\"'" | xargs)
curl -s -X POST https://flowpro-totalai.netlify.app/api/flowpro/resolve \
  -H "Content-Type: application/json" -H "x-crm-webhook-secret: $SECRET" \
  -d '{"rawAddress":"6/615 Brighton Rd, Seacliff, SA"}' | python3 -m json.tool
```
Expect `"decision": "review"`, a `parsed` block, and `4/615` + `7/615` in `candidates` (previously it wrongly returned no-match).

---

## 2. Swap in the all-in-one auto-create workflow (ships everything at once)

> **Simplified 2026-07-26:** Steps 2 and 3 are now ONE step. Auto-create is already validated safe, and `extract-and-create-job.v2-autocreate.json` now contains **all** the fixes (clipper removed + error-flagging + PDF resilience + auto-create). So you import **that** file — not `v2.json` — and get everything, with auto-create ON. (`v2.json` is kept only as the manual/no-auto-create fallback.)

Do this in a **low-traffic window** (early AM Adelaide). ~20 min.

**2.1 [UI] Capture the rollback FIRST.** In n8n, open `extract-and-create-job` (v2) and `PPG-create-job` → **Download** each → save to `n8n-workflows/backups/2026-07-15-preswap/` as `*.LIVE-ROLLBACK.json`. *This is your undo button — do it before importing anything.*

**2.2 [UI] Update the sub.** Open the existing `extract-and-create-job` workflow → ⋯ → **Import from File** → **`extract-and-create-job.v2-autocreate.json`** (the all-in-one). Import **into the existing workflow** (don't create new — that changes its ID and breaks the parent's reference).

**2.3 [UI] Update the parent** the same way with `PPG-create-job.json`. *(Or skip the import and make the 2 tweaks by hand: set the `Call extract-and-create-job` node → onError **Continue (using error output)**, and wire its **error output → `Idle - Error Handled`**.)*

**2.4 [UI] Re-map credentials** on any node that lost them — the OAuth ones especially: **`🏷️ Flag PDF Missing`** (Outlook), **`➕ Create Site`** (Simpro OAuth for the PPG build), and confirm Twilio on the parent. *(The CRM nodes — Resolve Site / Resolve Customer / Learn Site — authenticate via the embedded `x-crm-webhook-secret` header, not an n8n credential, so they don't need re-mapping.)* A mis-mapped credential is the #1 thing that goes wrong here — not the logic.

**✅ Verify** — fire one work order of each kind:
- A **match** → job created, PDF attached, Tapi accepted, SMS sent, execution green.
- A **genuinely-new** property → **site auto-created in Simpro**, job created, SMS sent (this is the new auto-create behavior).
- A **new unit at a known building** → goes to **Review** (Red), NOT auto-created.
- A **review/duplicate** case → email moved + labelled, the **sub execution turns RED** with `FlowProIssues → … · TAPI-… · address` (now easy to find), parent stays green, no SMS.

**↩ Rollback if needed:** open each workflow → Import from File → your `*.LIVE-ROLLBACK.json.json` → re-map creds → re-activate. (That restores the manual, no-auto-create production version exactly.)

---

## 3. ~~Turn on auto-create~~ → folded into Step 2 (done 2026-07-26)

Auto-create is no longer a separate step — the `v2-autocreate.json` you import in Step 2 already turns it on, with all fixes included. Nothing extra to do here except monitor:

**Monitor for 2–3 days.** After the swap, FlowProIssues should shrink to a small trickle: true duplicates + genuinely-ambiguous units (new-unit-at-known-building). If the Red pile is mostly duplicate-address cases, do Step 4b (agency email-domains) to clear those automatically.

---

## 4. Reduce ongoing manual load (recommended before handoff, so it runs itself) — [DEV]

Both are small, well-scoped code changes. They're the difference between "runs itself" and "someone babysits FlowProIssues daily."

**4a. Close the learning loop.** Today, when a human resolves a FlowProIssues item by creating the site in Simpro, the brain only learns it *passively* on the next hourly sync (and never records the agency link). Wire the human-resolution step (or a Simpro webhook) to call `learnSite` so every manual fix teaches the memory. *Effect: repeats of the same property become instant matches; the agency map grows.*

**4b. Populate agency email-domains.** `flowpro_customers.email_domains` is empty (0/2818), so agency disambiguation runs on only 9 learned entries — which is why duplicate addresses (602 of them, 1,225 sites) fall to Red. Update the customer-sync workflow to pull contact email domains from Simpro into `email_domains`, then have `resolveSite` fall back to the mirror's domains for `preferCustomerId`. *Effect: duplicate-address Reds resolve to clean matches automatically.*

---

## 5. Clean handoff to TotalAI / Selva

**⚠ Decision point — what actually gets handed off.** Per your exit plan (keep the IP, clean break, no ongoing access to you), the two paths:

| | **A. Standalone (recommended for a clean IP break)** | **B. Brain-connected** |
|---|---|---|
| What Selva gets | `n8n-workflows/handover/` — the self-contained version (better dictionary, no memory/fuzzy engine). Non-matches go to FlowProIssues for manual handling. | The live brain-connected system (auto-create, unit refinement, memory). |
| Your IP | Fully retained; your CRM/brain is **decommissioned for PPG**. | Your CRM keeps running PPG's traffic — entangles your infra/IP with Selva's op. |
| Selva's manual load | Higher (manual site handling), but PPG barely uses the UI so it's workable. | Low. |
| Fit with your exit | ✅ Clean break. | ✗ Ongoing entanglement. |

**Recommendation: Path A.** It matches everything you said (keep IP, no ongoing access, offload the operation). Sections 1–4 still matter — they get the *current* system stable so the client has zero disruption right up to cutover, and they bank the improvements in *your* codebase for the US.

**5.1 Transfer to Selva (Path A):**
- Hand over `n8n-workflows/handover/` + `HANDOVER-PACKAGE.md` (import into *his* n8n, his own credentials).
- Transfer PPG-specific credentials/config: Simpro OAuth (PPG build), the shared Outlook mailbox, Twilio number.
- Point his workflow's SMS status-callback off your CRM (or drop it).
- Agree a cutover date; after it, **decommission your CRM/brain + n8n for PPG** and your Netlify deploy.

**5.2 Handoff documents to include:**
- `docs/SEPARATION-MEMO.md` (fill the placeholders; solicitor review Sections 3/4/8).
- `docs/FLOWPRO-CASE-STUDY.md`, `docs/FLOWPRO-FLOWPROISSUES-REPORT.md`, `n8n-workflows/FLOWPRO-GOLIVE-RUNBOOK.md`.
- The `handover/HANDOVER-PACKAGE.md` setup steps.

---

## 6. Definition of "good state" — the walk-away checklist

- [ ] CRM code deployed; `resolve` returns `parsed` + handles units (Step 1 verify passes).
- [ ] n8n workflows swapped; FlowProIssues runs show as red/scannable; PDF failures don't kill jobs (Step 2 verify passes).
- [ ] Auto-create ON and monitored; FlowProIssues is a small, mostly-Red trickle.
- [ ] (Recommended) Learning loop + agency-domains shipped, so manual load is minimal.
- [ ] Handoff path chosen; if Path A, Selva has the standalone package running on his own infra with his credentials.
- [ ] Separation memo finalized (solicitor-reviewed) and settlement ($1,500–2,000) agreed.
- [ ] Cutover date set; your infra decommissioning scheduled.
- [ ] `docs/SESSION.md` reflects final state.

---

## 7. Diagnostics cheat-sheet (for whoever operates it)

Connect (read-only) — the DB is Supabase Postgres; `psql` reads `POSTGRES_URL` from `.env`:
```bash
URL=$(grep -E '^POSTGRES_URL=' .env | cut -d= -f2- | tr -d "\"'" | xargs)
case "$URL" in *sslmode=*) ;; *"?"*) URL="$URL&sslmode=require";; *) URL="$URL?sslmode=require";; esac
```
- **Mirror health (is the sync alive?):**
  `psql "$URL" -c "SELECT count(*), max(synced_at) FROM flowpro_sites;"` — `max(synced_at)` should be < 1h old.
- **Learned memory growth:**
  `psql "$URL" -c "SELECT source, count(*) FROM flowpro_site_map GROUP BY source;"`
- **Duplicate density (drives Reds):**
  `psql "$URL" -c "SELECT count(*) FROM (SELECT address_key FROM flowpro_sites WHERE archived=false GROUP BY address_key HAVING count(*)>1) t;"`
- **Replay a failing address through live resolve** (paste FlowProIssues subjects): POST `{"rawAddress":"...","pmEmail":"..."}` to `/api/flowpro/resolve` with header `x-crm-webhook-secret`. Read `decision` + `candidates`.
- **Regression test** (needs `tsx` installed: `pnpm add -D tsx`): `npx tsx lib/flowpro/measure.ts --validate` replays known-good work orders vs the current mirror.
- **Run the matcher self-tests:** `npx tsx lib/flowpro/address-matcher.test.ts` (expect 21/21).

---

## 8. Deferred to a separate session

**US adaptation (Houston 900-unit prospect).** The AU normalizer can't parse US unit notation (`Apt 302` / `#302` / `Unit 302` after the street), so a 900-unit complex collapses to one address. Full brief + plan: **`docs/FLOWCONTROL-US-UNIT-NORMALIZATION.md`**. Pick this up *after* AU is handed off.
