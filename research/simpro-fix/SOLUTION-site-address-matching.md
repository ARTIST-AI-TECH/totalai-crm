# FlowPro → Simpro: Fixing site lookup ("46 Emerald Blvd" vs "46 Emerald Boulevard")

**For:** Ady (FlowPro developer) · **Prepared:** 9 July 2026
**Problem:** Work-order emails (Tapi etc.) write addresses with abbreviations ("Blvd"). Simpro stores the site as "Boulevard". FlowPro's site lookup fails, so job creation fails.
**Simpro's official position (Noam Horenczyk, Simpro Partnerships, 5 Feb 2026):** *"we don't offer any fuzzy search for sites. You could create the site if not found and the customer can 'merge sites' in the UI."*

Everything below about the API was verified against **Simpro's official OpenAPI spec** (archived from `developer.simprogroup.com/apidoc/swagger.zip`, cross-checked against an Aug-2025 mirror, the `n8n-nodes-simpro` bundled spec, production integration code on GitHub, and Simpro API forum threads). Items marked ⚠️ still need a 5-minute test against the live Platinum Plumbing build.

---

## 1. Why the current lookup fails — three facts about the Simpro API

### Fact 1: `?search=` is NOT a text search
On every list endpoint, the `search` parameter is an **enum with exactly two values, `all` and `any`**. It only controls whether multiple column filters are combined with AND or OR:

```json
{ "name": "search", "type": "string", "default": "all", "enum": ["all", "any"],
  "description": "Search result must have a match on all provided fields or a match on any of the provided fields." }
```

If FlowPro is calling anything like `GET /sites/?search=46 Emerald Blvd`, **that parameter is being ignored or misinterpreted — it was never a free-text search.** This alone could explain "cannot find".

### Fact 2: Column filters are EXACT matches unless you add a `%` wildcard
"Searching" in this API means filtering columns. Verbatim from the official docs:

- Exact: `GET /api/v1.0/companies/0/sites/?Name=46%20Emerald%20Boulevard`
- Wildcard `%` (URL-encoded `%25`): `?Name=46%20Emerald%25` → "starts with 46 Emerald"
- Substring: `?Name=%25Emerald%25` → "contains Emerald"
- Nested columns via dot notation: `?Address.Address=46%20Emerald%25` (⚠️ documented generically, demonstrated on /companies/ Address.Line2; test on /sites/)
- OR across filters: `?Name=46%20Emerald%25&Address.Address=46%20Emerald%25&search=any`
- Operators: `lt, le, gt, ge, ne, between, in, !in` — **there is NO `like()` operator**. Anything you've read mentioning `like()` (some forum posts claim it) is wrong; the wildcard goes inside the value.
- ⚠️ **Field names are case-sensitive** (`Address.PostalCode`, not `address.postalcode`) — confirmed by Simpro staff on the API forum. Value-matching case sensitivity is undocumented; test `?Name=46%20emerald%25` vs `?Name=46%20Emerald%25`.

So an exact-match filter on `Name=46 Emerald Blvd` returns nothing when the site is named "46 Emerald Boulevard" — matching the screenshots. But `Name=46 Emerald%25` **would have matched both**. No amount of server-side syntax will ever equate "Blvd" and "Boulevard", though — that has to happen in FlowPro.

### Fact 3: The sites list returns only `{ID, Name}` by default
To get addresses back you must ask for them:

```
GET /api/v1.0/companies/0/sites/?columns=ID,Name,Address,Archived&pageSize=250&page=1
```

- `pageSize` max **250**, default 30. Page count comes back in `Result-Pages` / `Result-Total` response headers.
- Rate limit: **10 requests/second per build** (HTTP 429 beyond that), shared across all API consumers on the build.
- A plumbing company with even 5,000 sites = 20 pages = ~2 seconds to pull the entire site list. **Pulling everything and matching locally is cheap.** Cache it (e.g. refresh hourly or on miss).

---

## 2. Why Noam's "create the site" workaround probably failed

Verified against the spec and Simpro's help guide:

1. **Sites are company-level entities in a many-to-many relationship with customers.** The help guide states: *"Sites must be associated to customers in order to be selected when creating a job or quote."*
2. `POST /api/v1.0/companies/0/sites/` requires only `Name` — so a bare create **succeeds** (HTTP 201)…
3. …but if you didn't include the **`Customers: [<customerID>]`** array in the body, the new site is an **orphan**: it belongs to no customer, so creating the job for OC Real Estate against that site fails or the site is unselectable. The create "works" and the job still breaks — exactly the kind of thing that makes a workaround look impossible.
4. There is **no** `/customers/{id}/sites/` endpoint — the association is written on the site (`Customers` array) or on the customer (`Sites` array). Simpro's own forum guidance: create customer → create site *linked to the customer* → create job/quote.

**Correct minimal create:**

```http
POST /api/v1.0/companies/0/sites/
Authorization: Bearer <token>
Content-Type: application/json

{
  "Name": "46 Emerald Boulevard, Aldinga Beach",
  "Address": {
    "Address": "46 Emerald Boulevard",
    "City": "Aldinga Beach",
    "State": "SA",
    "PostalCode": "5173",
    "Country": "Australia"
  },
  "Customers": [<OC Real Estate customer ID>]
}
```

Other verified traps:
- **422 "No data to be inserted for site."** = malformed JSON body (missing comma, wrong `Content-Type`, lowercase field names — must be PascalCase: `Name`, not `name`).
- **Custom fields cannot be set in the create call** — PATCH `/sites/{siteID}/customFields/{customFieldID}` afterwards.
- ⚠️ Whether `POST /jobs/` hard-rejects a Customer+Site pair that isn't associated (vs silently inferring) is undocumented — 5-minute live test. Always send `Customers` on site create and you never hit the question.
- **Merge Sites is UI-only and irreversible** (People > Sites > Options > Merge Site). No API equivalent — so minimise duplicate creation; don't rely on merging as a routine step.

---

## 3. Recommended architecture: a 4-layer resolution funnel

Fuzzy matching should happen **once per property, ever**. This is how the incumbent integrations work (SyncEzy's PropertyMe/Property Tree → Simpro syncs pre-create every property as a site and keep an ID map; OurProperty's integration keeps explicit mapping tables and stores its external job ID in Simpro's `OrderNo`).

```
Work order email
      │ parse address
      ▼
[Layer 0] FlowPro mapping table:  normalized_address_key → simpro_site_id
      │ hit → done (O(1), no API call)          ← 99% of traffic after warm-up
      ▼ miss
[Layer 1] Local fuzzy match against cached Simpro site list
      │ (normalize both sides, expand Blvd→Boulevard etc., score)
      │ score ≥ 0.93 & clear winner → use it, WRITE Layer-0 mapping
      ▼ 0.75–0.93, or two close candidates
[Layer 2] Human confirm (WhatsApp/email/dashboard: "Is TAPI-82377 at
      │ '46 Emerald Boulevard, Aldinga Beach' (site 101)? [Yes/Pick/New]")
      │ answer → WRITE Layer-0 mapping (permanent memory)
      ▼ no plausible candidate
[Layer 3] Create the site via API — WITH the Customers array (§2) —
          flag it "created by FlowPro" for weekly review; WRITE mapping.
```

Key design points:

- **Layer 0 is the real fix.** Tapi's `TAPI-82377` is the *work order* number (one per job — put it in the Simpro job's `OrderNo` field for idempotency and invoice matching), but Tapi exposes **no stable property ID** to suppliers, so the normalized address string is your mapping key. Once "46 emerald boulevard aldinga beach" → site 101 is learned, every future variant that normalizes the same resolves instantly with zero risk.
- **Layer 1 code is provided** — `address-matcher/simpro-address-match.js` (Node) and `simpro_address_match.py` (Python), zero dependencies, tested. They normalize per the official Australia Post / AS/NZS 4819 / G-NAF abbreviation lists (Blvd/Bvd/Bde/Boulevarde → boulevard, St-vs-Saint handling, unit prefixes `2/46` ≡ `Unit 2, 46`, state/postcode stripping) and score with street-number-exact + Jaro-Winkler on name/suburb. Thresholds are tunable; the defaults auto-accept only a clear ≥0.93 winner.
- **Never auto-accept when two candidates are close** (the 46 vs 46A problem) — the code enforces a winner-gap and returns `review` instead. A wrong auto-match in Simpro means a plumber at the wrong house and an irreversible merge to clean up; a `review` costs one WhatsApp tap.
- **Refresh the site cache** hourly or on any Layer-1 miss (pull `?columns=ID,Name,Address,Archived&pageSize=250`; filter `Archived=false`).
- Optionally stamp the normalized key into a **site custom field** ("FlowPro Ref") for auditability — but keep the authoritative map in FlowPro's DB. (Custom-field *filtering* on list endpoints has documented reliability bugs — don't build the lookup on it.)

### Quick win if you change only one line today
Search with the street type **removed** and a wildcard: instead of filtering on `46 Emerald Blvd`, call

```
GET /api/v1.0/companies/0/sites/?Name=46%20Emerald%25&columns=ID,Name,Address&search=any
```

then confirm the returned candidates with the matcher. `buildSearchTerms()` in the provided code generates these terms ("46 emerald", "emerald", "46 aldinga beach"). This fixes the screenshot case immediately, though the full funnel above is the robust answer.

---

## 4. Alternatives / upgrades (when rule-based isn't enough)

| Option | What it does | Cost | Verdict |
|---|---|---|---|
| Provided matcher (rule-based + Jaro-Winkler) | Expands official AU abbreviations, fuzzy-scores | Free, zero deps | **Start here** — covers Blvd/Boulevard-class issues entirely |
| **Google Address Validation API** | Canonicalizes any free-text AU address to one standard form; validate BOTH the email address and each Simpro site once, compare canonical strings | ~US$17/1000, **first 5,000/month free** — likely $0 at your volume | **Best upgrade** if messy inputs exceed the rule-based matcher; AU has premise-level coverage |
| **Geoscape Hub (G-NAF)** | The government address authority; returns stable G-NAF address PIDs | **Free tier 20,000 credits/month** | Ideal canonical key if you want gov-grade IDs; slightly more integration work |
| Addressfinder / Addressify | AU/NZ validation SaaS | From A$19/mo; A$2,000/yr flat | Fine, but Google/Geoscape free tiers likely suffice |
| libpostal (open-source parser) | ML address parser/expander | Free, but ~1.8–2.2 GB model, needs a sidecar service | Overkill here; known weakness on AU `2/46` unit notation |
| An LLM call to normalize the address | Flexible | ~fractions of a cent per work order | Reasonable *fallback* for weird inputs, but non-deterministic — keep the rule-based layer primary |

Also worth knowing: **nobody has productized Tapi → Simpro** (Tapi has no public API and no trade-side integrations; the existing PropertyMe/PropertyTree→Simpro products are pre-sync-the-rent-roll, not work-order-driven). FlowPro is filling a real gap — worth mentioning to Noam/Addison for marketplace listing.

Longer-term option in the same spirit as the incumbents: ask the agency (OC Real Estate) for their managed-property list once and bulk-create/verify all sites up front — then per-work-order matching almost never misses.

---

## 5. Bonus: the cost-center issue from the same email (issue #1)

Verified 3-step sequence — sections and cost centers **cannot** be embedded in the job-create body. (Directly checked against the official spec: `POST /jobs/` writable properties are exactly `Type, Site, Customer, CustomerContact, CustomerContract, Name, Description, Notes, OrderNo, RequestNo, DateIssued, DueDate, DueTime, ResponseTime, Stage, Status, Salesperson, ProjectManager, Technician, Technicians, SiteContact, AdditionalContacts, Tags, AutoAdjustStatus, CompletedDate, STC` — there is **no `Sections` property**, so a nested `Sections.CostCenters` payload in the job create is not supported and will be ignored or rejected as invalid data.)

1. `POST /companies/0/jobs/` (`required: Type, Site`; include `Customer`, set `OrderNo` = `TAPI-xxxxx`) → grab job ID from the `Resource-ID` response header.
2. `GET /companies/0/jobs/{jobID}/sections/` — service jobs may already have a section; if empty, `POST .../sections/` (no required fields) → section ID.
3. `POST /companies/0/jobs/{jobID}/sections/{sectionID}/costCenters/` with `{"CostCenter": <ID>}` where the ID comes from `GET /companies/0/setup/accounts/costCenters/` (the **setup** cost-center ID — Builders / Corporate / Private Domestic / Warranty — not a job-cost-center ID and not a name).

The Invoicing-API-deprecation rumor is irrelevant to this path — these are core Jobs endpoints.

Two operational notes: a cost centre **locks once invoiced**, so set it at creation time and optionally read it back (`GET /jobs/{id}/sections/{sectionId}/costCenters/`) to confirm a customer default didn't override it. And if a new agency appears, customers are created via `POST /customers/companies/` (required: `CompanyName`) or `POST /customers/individuals/` (required: `GivenName`, `FamilyName`) — both spec-verified; `?createSite=true` on those calls auto-creates a linked site from the customer's address.

---

## 6. Live-test checklist (needs an API key — 15 minutes total)

Credentials: the `simpro.allbound.com` login is the **partner portal**, not the API. For API access to the Platinum Plumbing build, an admin logs into the build → **System ▸ Setup ▸ API ▸ Applications** → create an API application (API-key auth is simplest; keys are unscoped). Base URL: `https://<build>.simprosuite.com/api/v1.0/`.

Then verify the five ⚠️ items:

```bash
B="https://<build>.simprosuite.com/api/v1.0/companies/0"; H="Authorization: Bearer $KEY"

# 1. Wildcard + columns work on sites
curl -s "$B/sites/?Name=46%20Emerald%25&columns=ID,Name,Address" -H "$H"

# 2. Dot-notation Address filter works on /sites/
curl -s "$B/sites/?Address.Address=46%20Emerald%25&columns=ID,Name,Address" -H "$H"

# 2b. Customer-scoped site fetch — two candidate mechanisms, test both:
curl -s "$B/sites/?Customers=<custID>&columns=ID,Name,Address" -H "$H"   # relationship filter (forum-evidenced, unverified)
curl -s "$B/sites/?columns=ID,Name,Address,Customers&pageSize=250" -H "$H" # Customers as a list column (spec-plausible) → scope client-side

# 3. Value case-insensitivity
curl -s "$B/sites/?Name=46%20emerald%25" -H "$H"

# 4. Orphan-site behavior: create site WITHOUT Customers, then POST a job using it
#    (expect failure or orphan) — then PATCH the site with "Customers":[id] and retry.

# 5. Does a new Service job auto-create a default section?
curl -s "$B/jobs/<newJobID>/sections/" -H "$H"
```

---

## Sources
- Official OpenAPI spec: `developer.simprogroup.com/apidoc/swagger.zip` (Wayback 2023-05-20, SHA-verified; cross-checked vs Aug-2025 mirror `github.com/jezweb/simpro-api-docs` — byte-identical on all quoted sections — and `n8n-nodes-simpro`'s bundled spec)
- Help guides: "How to Create Sites", "How to Manage Sites" (helpguide.simprogroup.com)
- Simpro API forum threads t=354 (field-name case sensitivity), t=992 (customer→site→job workflow), t=2097 ("No data to be inserted"), t=2902 (10 req/s since 9 Aug 2022)
- Production code: stitch-digital/simpro-php-sdk, ozmarks/simpro-mcp, UniversalElectroTech (custom-field filters)
- AU addressing: Australia Post Appendix 1, AS/NZS 4819:2011 Appendix A, G-NAF STREET_TYPE_AUT (276 types)
- Integration patterns: SyncEzy (PropertyMe/PropertyTree→Simpro), OurProperty→Simpro, Zapier Simpro connector, Tapi help centre
