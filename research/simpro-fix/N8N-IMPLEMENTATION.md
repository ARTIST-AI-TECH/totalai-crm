# FlowPro on n8n — implementing the Simpro site-address fix

**For:** Ady · **Prepared:** 9 July 2026 · Companion to [SOLUTION-site-address-matching.md](SOLUTION-site-address-matching.md) (read that first for the Simpro API facts — this doc maps the fix onto n8n nodes).

All n8n details below verified against docs.n8n.io / n8n source for **n8n v2.x** (current as of July 2026). If the instance is older self-hosted, notes are flagged.

---

## 0. First decision: drop (or quarantine) `n8n-nodes-simpro`

If the workflow uses the community node `n8n-nodes-simpro`, be aware (all verified by inspecting the 0.4.16 package):

- **Abandoned**: sole hobbyist maintainer, all 42 versions published in one 40-hour burst (Oct 2025), nothing since; the GitHub repo is a 404 — no source, no issue tracker.
- **Not verified, not installable on n8n Cloud** (and can never be verified as-is — it ships runtime dependencies, which n8n forbids for verified nodes).
- **No pagination**: sends `page`/`pageSize` once and **discards response headers**, so `Result-Pages`/`Result-Total` are unreachable — you can't reliably pull the full site list with it.
- Its "search" query field is Simpro's raw `search` param — which, per the companion doc, is just the `all|any` AND/OR combinator. Column filters must be typed as raw JSON into "Custom Query Parameters". Easy to misuse — plausibly part of the current failure.
- List responses come out as **one item wrapping the whole page array**, not per-item.

**Recommendation: plain HTTP Request nodes** with an **HTTP Bearer Auth (or Header Auth)** credential carrying the Simpro API key (`Authorization: Bearer <key>`, base `https://<build>.simprosuite.com/api/v1.0/companies/0/`). Everything below assumes HTTP Request nodes. If you keep the community node for prototyping, pin 0.4.16 and treat it as frozen code.

---

## 1. Target architecture — two workflows

```
WORKFLOW A (main, per work-order email):
Email trigger ─ parse work order ─▶ ① Data Table "site_map" GET (address_key)
                                        │ found ────────────────────────────▶ ⑤ Create job
                                        ▼ not found
                                   ② HTTP: pull all Simpro sites (paginated)
                                   ③ Code node: fuzzy matcher  ─▶ Switch on decision
                                        ├─ match ──▶ ④ upsert site_map ──▶ ⑤ Create job
                                        ├─ review ─▶ WhatsApp/Gmail Send-and-Wait
                                        │             └ human picks ─▶ ④ upsert ─▶ ⑤
                                        └─ no-match ▶ HTTP: create site (+Customers!)
                                                      └▶ ④ upsert ─▶ ⑤ ─▶ notify

WORKFLOW B (optional, nightly): Schedule Trigger ─▶ same paginated site pull
                                ─▶ refresh a "sites_cache" Data Table
```

Workflow B is optional: on a Layer-① miss you can pull sites live (a few seconds even for thousands of sites) — always fresh, one less moving part. Add the cache table only if misses become frequent enough to feel slow.

---

## 2. Node-by-node

### ① Layer 0 — the mapping table (Data Table node)

Data Tables are built-in on Cloud and self-hosted since v1.113 (~Oct 2025); 50 MB instance cap (raisable self-hosted via `N8N_DATA_TABLES_MAX_SIZE_BYTES`) — ample for tens of thousands of mappings. Filters are **exact-match only** (Equals etc., no "contains") — which is exactly why we store a *normalized* key.

Create table **`site_map`** with columns:
| column | type | example |
|---|---|---|
| `address_key` | String | `46 emerald boulevard aldinga beach` |
| `site_id` | Number | `101` |
| `site_name` | String | `46 Emerald Boulevard, Aldinga Beach` |
| `source` | String | `auto-match` / `human-confirm` / `created` |
| `last_ref` | String | `TAPI-82377` |

- **Lookup node**: Data Table ▸ Row ▸ **Get** — condition `address_key` Equals `{{ $json.addressKey }}`. Compute `addressKey` with a small Code node running `normalizeAddress(raw).canonical` (the matcher file exports it — or run the full matcher Code node first and reuse `normalizedInput.canonical`).
- **Write node** (④, all three branches): Data Table ▸ Row ▸ **Upsert** on `address_key`.
- The Row operations also include **If Row Exists / If Row Does Not Exist** — usable directly as the branch instead of Get + IF.
- Older self-hosted without Data Tables: use Google Sheets / Postgres nodes with the same shape.

### ② Pull the candidate sites (HTTP Request node with pagination)

Two scoping options — test which works on the live build (§6 checklist):
- **Customer-scoped (preferred if it works)**: add `Customers` = `<customerID>` as a query param (relationship filter — forum-evidenced but unverified). Smaller candidate set, faster, avoids cross-agency false matches.
- **Unscoped with `Customers` column**: request `columns=ID,Name,Address,Customers,Archived` and scope client-side. Spec-confirmed that `Customers` is a site field; nested objects are returnable as list columns.
- Either way, keep an **unscoped fallback**: a property can exist in Simpro linked to a *different* customer (agency changes are common in property management) — an unscoped second pass finds it so you can PATCH the site's `Customers` array instead of creating a duplicate.

- **URL**: `https://<build>.simprosuite.com/api/v1.0/companies/0/sites/`
- **Authentication**: predefined credential ▸ HTTP Bearer Auth (the Simpro API key)
- **Query Parameters** (fields, not the URL — n8n URL-encodes field values exactly once):
  - `columns` = `ID,Name,Address,Archived`
  - `pageSize` = `250`
  - `Archived` = `false`
- **Options ▸ Pagination**: mode **Update a Parameter in Each Request**
  - parameter `page` (query) = `{{ $pageCount + 1 }}`
  - **Pagination Complete When**: Other → Complete Expression = `{{ $pageCount >= Number($response.headers['result-pages']) }}` (Simpro returns total pages in the `Result-Pages` header) — or simply "Response Is Empty"
  - **Limit Pages Fetched** = e.g. 100 (safety guard)
  - **Interval Between Requests** = 150 ms (Simpro allows 10 req/s per build, shared with every other integration on the build)
- **Node settings**: Retry On Fail = on, Max Tries 3, Wait Between Tries 2000 ms (handles stray 429s).
- Follow with a **Split Out** node on the response array so each site becomes an item (name this node **`Fetch Simpro Sites`** — the matcher Code node references it by name).

⚠️ Two things to live-test once (5 min): that `%` typed in a query-param value goes out as `%25` exactly once on your n8n version (known-good per docs, but there was a double-encoding report — GitHub issue #22144), and that `Address.Address=46 Emerald%` dot-filters work on `/sites/` (documented generically, not literally demonstrated for sites).

### ③ The matcher (Code node)

- Language **JavaScript**, mode **Run Once for All Items**. Paste [`address-matcher/n8n-code-node-matcher.js`](address-matcher/n8n-code-node-matcher.js) wholesale.
- It's zero-dependency by design because **n8n Cloud's Code node cannot import npm packages** (only `crypto` and `moment` are available there; self-hosted needs `NODE_FUNCTION_ALLOW_EXTERNAL` set on the *task-runner* process in v2). Nothing to install, works on both.
- Edit the three CONFIG lines at the top: where the parsed address lives (`$json.address`), the site-list node name (`Fetch Simpro Sites`), and thresholds.
- Output item: `{ decision: 'match'|'review'|'no-match', siteId, siteName, score, candidates[], searchTerms[], normalizedInput }`.
- Don't use the Python Code node for this: on Cloud it can't import anything at all, and Pyodide was removed in v2.

### Switch node on `{{ $json.decision }}`

Rules mode, three String-Equals rules (`match` / `review` / `no-match`), Fallback Output → Extra Output wired to an alert (belt-and-braces).

### `review` branch — human-in-the-loop (Send and Wait for Response)

FlowPro already routes unmatched work orders by moving the email to the **FlowProIssues** folder — keep that as the baseline behaviour for `review` and `no-match` if you want the smallest change (binary routing: matched → job + `FlowPro` folder; everything else → `FlowProIssues`). The send-and-wait step below is the upgrade that closes the loop: **whenever a human resolves a `FlowProIssues` case, write the answer into the `site_map` table** — otherwise the same address goes back to `FlowProIssues` every month and the system never learns.

- Nodes supporting **Send and Wait for Response**: **WhatsApp Business Cloud**, Gmail, Outlook, Slack, Telegram, Teams, Discord, Google Chat, and the plain Send Email node. Given you already live on WhatsApp, use the WhatsApp node (requires a Meta WhatsApp Business Cloud credential) or Gmail as the low-friction alternative.
- **Response type**: *Custom Form* — a dropdown listing `{{ $json.candidates }}` ("46 Emerald Boulevard, Aldinga Beach — 96%") plus a "None of these — create new site" option. (*Approval* type works too when there's exactly one candidate: Approve/Decline buttons.)
- The execution parks in **waiting** state and resumes when the form/button is answered. **Limit Wait Time** is optional; when enabled it defaults to 45 minutes — set it to e.g. 2 days with the timeout path routed to the no-match branch so work orders never hang forever.
- On response: Upsert `site_map` with `source = human-confirm`, then create the job. Every answer permanently teaches Layer 0.

### `no-match` branch — create the site (HTTP Request POST)

```json
POST https://<build>.simprosuite.com/api/v1.0/companies/0/sites/
{
  "Name": "{{ $json.normalizedInput.number }} {{ ...street... }}, {{ ...suburb... }}",
  "Address": { "Address": "...", "City": "...", "State": "SA", "PostalCode": "...", "Country": "Australia" },
  "Customers": [{{ $json.customerId }}]
}
```

**The `Customers` array is the critical line** — without it the site is created but orphaned (not associated with OC Real Estate), and job creation still fails. This is almost certainly why "create if not found" never worked. Field names are PascalCase; a malformed body returns the misleading `422 "No data to be inserted for site."`. Grab the new site ID from the response `ID` (also in the `Resource-ID` header), upsert `site_map` with `source = created`, and send yourself a weekly digest of `source = created` rows to eyeball for duplicates (Merge Sites in the Simpro UI is manual and irreversible — better to review weekly than merge often).

### ⑤ Create the job (HTTP Request POST ×3)

1. `POST /companies/0/jobs/` — `{"Type": "Service", "Customer": <id>, "Site": <siteId>, "OrderNo": "TAPI-82377", ...}`. `OrderNo` = the Tapi work-order number → gives you **idempotency**: before creating, `GET /jobs/?OrderNo=TAPI-82377&columns=ID` and skip if it exists (duplicate emails are a matter of time). ⚠️ Do **not** try to embed cost centres in this call — the job POST body has no `Sections` property (spec-verified); a nested `Sections.CostCenters` payload is not supported. Steps 2–3 below are the supported path.
2. `GET /jobs/{id}/sections/` — use the existing section if the Service job auto-created one, else `POST` an empty section.
3. `POST /jobs/{id}/sections/{sectionId}/costCenters/` — `{"CostCenter": <setup-cost-centre-ID>}` from `GET /setup/accounts/costCenters/` (Builders / Corporate / Private Domestic / Warranty). This is the whole fix for the cost-centre issue from the Noam thread.

### Error handling

Set an instance **Error Workflow** (Error Trigger → WhatsApp/email alert with execution URL) and assign it in each workflow's settings, so a Simpro outage or parse failure pings you instead of dying silently. Use **Stop And Error** on data-quality violations (e.g. no address parsed from the email) to force that path deliberately.

---

## 3. The 10-minute quick win (if you change nothing else today)

In whatever node currently searches Simpro, replace the exact/`search=` lookup with a wildcard column filter on a street-type-free term:

- Query params: `Name` = `46 Emerald%`, `Address.Address` = `46 Emerald%`, `search` = `any`, `columns` = `ID,Name,Address`
- Type the `%` literally in the query-param value field — n8n encodes it to `%25` on the wire, which is what Simpro expects.
- The matcher's `searchTerms` output (e.g. `["46 emerald", "emerald", "46 aldinga beach"]`) generates these terms automatically; verify whatever comes back with the matcher before using it.

This fixes the Blvd/Boulevard case in the screenshots immediately. The full funnel above is what makes the problem *stay* fixed.

---

## 4. Rollout order

1. Quick win (§3) — same day.
2. Code-node matcher + Switch (§2③) replacing blind search — day 1–2.
3. `site_map` Data Table (Layers 0/④) — day 2.
4. Send-and-Wait review branch — day 3.
5. Create-site branch **with `Customers`** + weekly created-sites digest — day 3–4.
6. Live-verify the five ⚠️ items from the companion doc §6 (needs the API key from System ▸ Setup ▸ API ▸ Applications on the Platinum Plumbing build).
