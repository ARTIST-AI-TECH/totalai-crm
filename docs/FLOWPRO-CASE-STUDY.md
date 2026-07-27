# FlowPro → Simpro Site Resolution
### Engineering case study & handover documentation

*Prepared for Ady — July 2026. Two audiences, layered: a plain-English track for anyone (partners, clients, a future buyer) and a deeper technical track for an engineer who has to operate or rebuild this.*

---

## 0. How to read this

- **If you're here for the "what and why" (business value):** read sections 1–5 and 12. They explain, in plain terms, what was broken, why it was genuinely hard, and what the fix is worth.
- **If you're here to operate or rebuild it (engineering):** read all of it. Sections 6–11 are the how, the war stories, and the gotchas that will bite you.

A one-line version: *We turned a job-intake automation that silently failed about half the time — and needed a human to rescue each failure — into one that resolves ~92% of jobs correctly on its own, catches its own past mistakes, and gets smarter every time it runs.*

---

## 1. Executive summary

**FlowPro** is an automation that takes a property-maintenance work order (emailed in via Tapi), reads it, creates the matching job in the client's trade-management system (**Simpro**), attaches the paperwork, and notifies the tenant — all without a human touching it.

For one client (Platinum Plumbing & Gas, "PPG"), it had a chronic failure: **roughly 1 in 2 work orders couldn't be filed automatically** and got dumped into an Outlook folder ("FlowProIssues") for a person to fix by hand. That defeated the purpose of the automation and created constant maintenance load.

The visible trigger looked trivial — an address written "46 Emerald **Blvd**" wouldn't match Simpro's "46 Emerald **Boulevard**." But the real causes were deeper and structural. We rebuilt the address-resolution layer from scratch, moved the intelligence into a proper, testable service, gave it a **memory**, and validated it against **438 real historical work orders**:

- **~92% now resolve to the correct site automatically** (was ~50% failing).
- **Zero wrong-site auto-matches.** (More on this below — the system is *more accurate than the humans and old process it replaced*.)
- The rest are safely set aside as "needs a look," and **every resolution teaches the system**, so the failure rate keeps shrinking instead of staying stuck.

It went live on 13 July 2026.

---

## 2. Background: what FlowPro actually does

The end-to-end pipeline, per work order:

1. **Email arrives** from Tapi (a property-management platform) into a shared Outlook inbox — "New work order at 46 Emerald Blvd…"
2. **n8n** (an automation tool, self-hosted) picks it up, opens the Tapi link, and **scrapes** the work-order details (address, tenant, property manager, issue, a PDF).
3. It **finds the matching "site"** in Simpro (the physical property) and the **customer** (the property agency that owns it).
4. It **creates the job** in Simpro, **attaches the PDF**, marks it accepted on Tapi, and **texts the tenant**.
5. It logs everything to a small CRM dashboard.

Step 3 — "find the matching site" — is the one that was failing, and it's the heart of this document.

**Important framing:** the client barely uses the dashboard. The thing they actually pay for is *this pipeline working*. So the value is in the automation, and specifically in step 3 being reliable.

---

## 3. The problem, as it looked

Half of incoming work orders ended up in the **FlowProIssues** folder with a subject like `[NoJobSiteFound]`. Someone then had to open each one, find the property in Simpro by hand, and create the job manually. On a busy Monday that's dozens of manual rescues — and if the person responsible was travelling or asleep (the client is in Australia), work orders piled up.

The obvious explanation was address formatting: Tapi writes "Blvd," "St," "Rd"; Simpro stores "Boulevard," "Street," "Road." So the natural first thought is "just teach it the abbreviations." That helps — but it is *not* the fix, and believing it is would have left the problem half-broken. Here's why.

---

## 4. The real root causes (there were three)

**Cause 1 — the search was brittle and one-directional.**
The old workflow asked Simpro's API for sites whose name *starts with* the (partly-cleaned-up) address. That approach breaks the moment anything differs at the front of the string — a unit number, a "Unit" prefix, a leading zero — and it only worked if Simpro happened to store addresses in full words. It also used an **incomplete abbreviation list** that was literally missing "blvd" (it had "bvd" but Tapi writes "Blvd"), so the exact screenshot case failed.

**Cause 2 — the safety net didn't exist.**
The workflow *appeared* to have a "if the site isn't found, create it" fallback. It didn't. That node was **disconnected dead code** and even referenced other nodes that no longer existed. So when a site wasn't found, there was no plan B — it went straight to the manual folder, every time.

**Cause 3 — no memory.**
Even when a match succeeded, nothing was remembered. The same property, next month, went through the same fragile guesswork and could fail again. There was no learning; every work order started from zero.

The lesson: a bigger dictionary treats Cause 1's symptom while leaving Causes 1 (structurally), 2, and 3 fully intact. The permanent fix had to address all three.

---

## 5. Why this was genuinely hard (the part that's easy to underestimate)

Address matching *sounds* like a school exercise. It isn't, and here's the honest list of why:

- **Simpro has no fuzzy search.** Its API can filter columns but cannot do "find the closest address." Confirmed directly with Simpro's own partnerships team. So the intelligence has to live on our side.
- **Australian addresses are a minefield.** ~100 official street types with ~191 accepted abbreviations and misspellings (Blvd/Bvd/Bvde/Boulevarde…), unit notation ("2/46", "Unit 2, 46"), directionals ("Esplanade Sth"), "St" meaning both "Street" and "Saint."
- **The reference data is dirty.** Simpro had ~20,000 sites including **duplicate records for the same address** and **historical mis-filings** (jobs filed against the wrong suburb entirely). Any matcher that trusts this data blindly inherits its errors.
- **A wrong match isn't a small bug — it can send a plumber to the wrong house,** and Simpro's "merge duplicate sites" is manual and irreversible. So "mostly right" is not good enough; being *wrong* has to be near-impossible.
- **The two systems disagree about identity.** Tapi gives no stable property ID, so the only thing linking a work order to a Simpro site is the address string itself — the exact thing that's inconsistent.

Getting from "half fail" to "92% correct with zero wrong dispatches" required treating this as a real information-matching problem, not a find-and-replace.

---

## 6. The solution architecture

Two clean halves:

```
n8n  = "hands"  — scrape the email, call Simpro, attach PDF, notify, move the email
CRM  = "brain"  — decide which site + customer, and remember it forever
```

- The **brain** lives in the CRM (a Next.js app on Netlify, backed by a Postgres database). It holds a **local mirror** of all Simpro sites and customers, plus a **learned memory** of every address it has resolved. Because matching runs against our own copy, it is completely immune to Simpro's search limitations.
- The **hands** (n8n) simply ask the brain "what site is this?" over a secure HTTP call, then act on the answer.

Why this split matters: the hard, valuable logic is now **testable code in one place** instead of scattered across fragile visual-workflow nodes — and it can be reused for entirely different clients or markets without touching n8n.

**The resolution funnel** the brain runs, in order:

1. **Memory lookup** — have we resolved this exact address before? If yes, answer instantly (no Simpro call). After warm-up this handles the vast majority of traffic.
2. **Fuzzy match** — normalize both the incoming address and every mirror site to a canonical form, score them, and take a clear winner.
3. **Ask a human** — if two candidates are genuinely close, don't guess; flag for review.
4. **New property** — if nothing plausible exists, it's a genuinely new site (create it, or route it for a human, depending on the phase).

Every confident resolution is **written back to memory**, which is what makes the fix permanent instead of a one-time patch.

---

## 7. How we built it (step by step)

1. **Database tables** (via Drizzle migrations): a mirror of Simpro sites and customers, plus two "learned map" tables (address→site, agency→customer).
2. **The matcher** — a dependency-free TypeScript module: full Australian street-type normalization + a proven string-similarity algorithm (Jaro-Winkler). Shipped with an automated test suite (18 cases) so it can't silently regress.
3. **API routes** — `resolve` (address → answer), `learn` (remember a resolution), `resolve-customer` (find the agency for a new site), and two `sync` endpoints to refresh the mirror. Secured with the existing shared secret between n8n and the CRM.
4. **The sync workflow** — an hourly n8n job that pulls all Simpro sites/customers and pushes them into the mirror (paginated and batched — see gotchas).
5. **The backfill** — a one-time script that seeds the memory from every past successful work order, so the system starts *warm*, not cold.
6. **The rewired main workflow (v2)** — replaces the old fragile lookup with a call to the brain, keeps the existing job-creation/PDF/notify steps, and adds a "learn" step at the end.

---

## 8. The hard-won discoveries (the war stories)

These are the moments that separate "looks done" from "actually correct." Each one is both a story about the complexity and a gotcha for whoever operates it next.

**8.1 — The dictionary was a trap, not a fix.**
Swapping in the full 191-abbreviation list fixes "Blvd," but we proved it can't touch unit notation, discarded suburbs, or the no-memory problem. It's a useful *band-aid* (and is now embedded directly in the n8n workflow as a standalone safety net), but it is not the cure.

**8.2 — The "customer" comes free with the site.**
A key realization that shrank the whole problem: in Simpro, each site already knows which agency owns it. So *recovering the site automatically recovers the customer too* — we don't need a separate, fragile customer lookup for existing properties.

**8.3 — The poisoned memory.**
When we first seeded memory from history, resolution started returning *wrong* answers instantly. The cause: the history itself contained mistakes — e.g., a "6 Pym St, **Belair**" work order had once been filed against "6 Pym St, **Croydon Park**." Seeding that verbatim taught the system the wrong answer, and because memory answers *first* and *instantly*, it silently overrode the (correct) matcher. **Fix:** the backfill now validates every entry — it only remembers a mapping if the work order's address actually matches the site it was filed against. Divergent rows are skipped and logged. **This also produced a bonus: a list of the client's historical mis-filings.**

**8.4 — A different unit is a different home.**
The matcher once matched "1/185A Portrush Rd" to "**3**/185A Portrush Rd." Same building, different apartment — a real wrong-door risk. We added a strong penalty so a different unit can never auto-match; the correct unit wins, or it drops to review.

**8.5 — Duplicate sites, resolved by agency.**
Simpro has multiple records for the same address (from years of the old system creating a new site each time). Pure address matching can't tell them apart. The fix: use the **work order's property manager** to disambiguate — the duplicate belonging to *that* agency is the right one. When even that can't decide, we route to review rather than guess.

**8.6 — The most important finding: the matcher was right, the history was wrong.**
During validation, five cases looked like "wrong matches." On inspection, the matcher had correctly followed the work order's own suburb, while the *historical* job had been filed against a different suburb entirely. **The new system is more accurate than the process it replaced** — it was catching old human errors. This is worth emphasizing to anyone assessing the work: the "errors" were corrections.

**8.7 — An ordering bug that broke PDF attachment.**
When we inserted the "learn" step into the workflow, it accidentally sat *between* job-creation and the PDF-attach step, replacing the job data (which carried the job's ID) with its own response. The PDF-attach then had no job ID and failed. **Fix:** move "learn" to the very end of the chain, where it can't clobber anything.

**8.8 — Microsoft's message IDs change when you move an email.**
Re-testing a work order failed because the email had already been moved to the FlowProIssues folder in a prior run — and Microsoft assigns a *new* ID on folder move, so the old reference 404s. **Not a production issue** (each work order is processed once, while still in the inbox), but a real gotcha for anyone re-running tests.

**8.9 — You can't POST 20,000 records at once.**
The first sync tried to send all ~20,000 sites in one 6MB request and was rejected by the host's size limit. **Fix:** the sync now loops in batches of 1,000.

---

## 9. How we proved it works

We didn't rely on spot checks. We took **all 438 historical work orders that had a known-correct Simpro site** and ran the fuzzy matcher against them *with memory disabled* (a fair test), then compared its pick to ground truth:

- **~92% correct** automatic matches.
- **0 truly wrong** matches (the handful that differed from history were history's own mistakes — see 8.6).
- The remainder correctly flagged as "review" or "new," never mis-dispatched.

We also confirmed the full pipeline end-to-end on a live address that used to fail: it resolved, created the Simpro job, attached the PDF, accepted on Tapi, and recorded the mapping — start to finish.

---

## 10. Operational notes & gotchas (for whoever runs it)

- **Deploys** publish from a specific Git repo to Netlify; a build sometimes needs a manual "Publish deploy" before it's live.
- **The mirror must stay fresh** — the hourly sync is what lets brand-new Simpro properties become matchable. If matching quality drifts, check the sync ran.
- **Monitoring is built into the Outlook folder:** issues are now labelled and colour-coded — one colour for "genuinely new property," another for "ambiguous, needs a human." The mix tells you at a glance whether to turn on automatic site-creation.
- **The memory is safe to re-seed** — the backfill is idempotent and self-correcting.
- Full step-by-step operating instructions live in the go-live runbook.

---

## 11. What's live vs. deferred

**Live now:** the full resolution brain, the memory, the hourly sync, the rewired workflow (match → job → PDF → notify → learn), and the labelled monitoring.

**Deliberately deferred (a clean "v3"):**
- Automatic creation of brand-new sites (built and ready, held back until the new-property volume is known).
- A one-tap "confirm which site" step for the rare ambiguous cases (so even those teach the memory).
- Duplicate-job prevention and formal error-handling/alerting on both workflows.

None of these are missing pieces of the fix — they're the next tier of polish, intentionally staged.

---

## 12. The architecture, framed for value & ownership

It's worth being explicit about *where the value lives*, because it's not evenly spread:

- **The reusable platform (high, durable value):** the resolution engine (matcher + memory + learning + agency-disambiguation), the "brain/hands" architecture, the codebase, and the **FlowPro** concept and brand. This is market-agnostic — the same design solves the identical bottleneck for any trade business that receives work orders and files them into a job system. It is the part worth carrying forward to other markets.
- **The client operation (low, situational value):** the specific running instance for one client — their Simpro configuration, their data, their hosting, and the day-to-day support of it. This is valuable to *that client's continuity*, but it is not the reusable asset.

The two are separable. The brain runs as an independent service the workflow *calls*; the client-specific workflow can be made to stand on its own (using the embedded band-aid from 8.1) without the brain at all. That separation is what makes it possible to transition the operation to someone else while retaining the platform.

---

## Glossary

- **Tapi** — the property-management platform that emails in work orders.
- **Simpro** — the trade job-management system where jobs live.
- **Site** — a physical property in Simpro. **Customer** — the agency that owns/manages sites.
- **Work order** — one maintenance request (e.g. "leaking tap at 46 Emerald Blvd").
- **n8n** — the visual automation tool that runs the pipeline.
- **The mirror** — our local copy of Simpro's sites/customers, kept fresh so matching runs on our side.
- **The memory** — our learned record of "this address = this site," so the same property never has to be figured out twice.
- **Fuzzy match** — deciding two differently-written addresses are the same place.
- **Normalize** — rewriting an address into one standard form so two versions can be compared fairly.
