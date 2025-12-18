# N8N Work Order Automation - Progress Tracker

**Workflow ID**: `opBCXYhYWnf0YHfk`
**Workflow Name**: PPG-create-job
**n8n Instance**: https://n8n-totalai-au.badou.ai
**Branch**: `puppeteerScrape`

---

## Workflow Goal

Automate the complete flow from work order email → Simpro job creation → FlowControl CRM sync:

1. **Email Detection** - Poll Outlook for new work order emails from PM platforms
2. **Link Extraction** - Extract "View full work order" link from email
3. **Web Scraping** - Fetch and parse work order details from PM platform page
4. **Simpro Job Creation** - Create customer/site/job in Simpro
5. **PDF Attachment** - Attach work order PDF to Simpro job
6. **CRM Sync** - Send work order to FlowControl CRM
7. **Tenant Notification** - SMS/call tenant to schedule
8. **PM Update** - Update PM platform with acceptance/scheduling

---

## ✅ Phase 1: Email Detection & Link Extraction (COMPLETED)

**Date**: December 5, 2025

### Changes Made to n8n Workflow:

1. **Converted Manual Trigger → Outlook Trigger**
   - **Node**: "📧 Poll for Work Order Emails" (ID: `3f3c3a6b-c20f-4b0b-a595-67b0fe6937d3`)
   - **Type**: `microsoftOutlookTrigger`
   - **Poll Interval**: Every 5 minutes
   - **Event**: Message Received
   - **Filters**: (Currently open - will trigger on all new emails)
   - **Options**: Only unread emails
   - **Credentials**: ✅ Microsoft Outlook account (ID: DF5Nc4OXX4DE7beO)

2. **Enhanced URL Extraction Code**
   - **Node**: "🔗 Extract Work Order Link" (ID: `053cc443-83ae-4a34-be94-a32c4541eae1`)
   - **Type**: Code node (JavaScript)
   - **Improvements**:
     - Multiple fallback regex patterns for different PM platforms
     - PM platform detection from sender email (Tapi, BricksAgent, OurProperty, PropertyTree)
     - Subject validation (skips non-work-order emails)
     - Attachment detection
     - Debugging preview (first 500 chars of email body)

3. **Removed Test Nodes**
   - Deleted "Get Test Emails (Tapi)" node - no longer needed
   - Deleted disconnected GET nodes (Customers, Employees, Sites, Contacts, Jobs)
   - Cleaned up workflow to have linear flow: Trigger → Extract

4. **Current Flow**:
   ```
   📧 Poll for Work Order Emails (every 5 min)
              ↓
   🔗 Extract Work Order Link
   ```

### What Works Now:

- ✅ Workflow automatically polls Outlook every 5 minutes
- ✅ Detects emails with "work order" in subject
- ✅ Extracts "View full work order" link with multiple pattern support
- ✅ Identifies PM platform (Tapi, BricksAgent, OurProperty, PropertyTree)
- ✅ Captures email metadata (sender, subject, timestamp, attachments)
- ✅ Returns structured JSON for next nodes

### Next Steps:

**Phase 2**: Add web scraping to fetch and parse work order details from the extracted link.

---

## ✅ Phase 2: Web Scraping with Puppeteer (COMPLETED)

**Date**: December 18, 2025
**Status**: Completed - FireCrawl replaced with Puppeteer community node

### Implementation Decision: Puppeteer vs FireCrawl

**Initial Approach**: FireCrawl API with AI-based extraction
- ✅ Worked well for structured data extraction
- ❌ Cost: $0.50-1.00 per scrape request
- ❌ External API dependency
- ❌ AI-based extraction (non-deterministic)

**Final Approach**: Puppeteer Community Node (n8n-nodes-puppeteer)
- ✅ Zero API costs (compute-only)
- ✅ DOM-based extraction (deterministic, same HTML → same output)
- ✅ Faster execution (no external API roundtrip)
- ✅ Combined scraping + PDF generation in single node
- ✅ Full control over extraction logic
- ✅ Self-hosted in n8n instance

### Nodes Added:

1. **❓ URL Found?** (ID: `check-url-found`)
   - **Type**: IF node
   - **Condition**: Check if `workOrderLink` is not empty
   - **True Branch**: Continue to scraping
   - **False Branch**: Log error (⚠️ No URL Found - Log Error node)

2. **Puppeteer Scrape & Extract** (ID: `691fe30d-7310-49e2-9b75-52934e06e41d`)
   - **Type**: `n8n-nodes-puppeteer.puppeteer` (Community Node)
   - **Operation**: Custom JavaScript execution
   - **Source**: https://github.com/drudge/n8n-nodes-puppeteer

   **Extraction Logic**:
   - Uses DOM selectors based on Tapi HTML structure
   - Extracts 11 fields from work order page
   - Generates print-optimized PDF (A4, print CSS emulation)
   - Returns data in same format as FireCrawl for compatibility

   **Fields Extracted**:
   - `workOrderId` - via `[data-test="work-order-number"]`
   - `issueTitle` - via `[data-test="issue-title"]`
   - `issueDescription` - via `[data-test="issue-description"] p`
   - `propertyAddress` - parsed from "Property:" label section
   - `tenantName` - first `<strong>` under "Tenants:" label
   - `tenantPhone` - via `a[href^="tel:"]` in tenant section
   - `tenantEmail` - via `a[href^="mailto:"]` in tenant section
   - `propertyManagerName` - via `<strong>` under "Managed by:" label
   - `propertyManagerEmail` - via `a[href^="mailto:"]` in manager section
   - `submittedDate` - via `.date-time` data attribute
   - `keyNumber` - parsed from "Key number:" label

   **PDF Generation**:
   ```javascript
   await page.emulateMediaType('print'); // Trigger print CSS
   const pdfBuffer = await page.pdf({
     format: 'A4',
     printBackground: true,
     margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
   });
   ```

3. **📝 Transform FireCrawl to Work Order** (Updated)
   - Now handles Puppeteer output format
   - Maintains compatibility with existing downstream nodes

### Validation & Testing

**Comparison Results** (Puppeteer vs FireCrawl):
- 8/11 fields: 100% exact match
- 3/11 fields: Minor formatting differences (easily reconcilable)
- Match rate: 73% exact, 100% data accuracy

**Key Findings**:
- All critical data extracted correctly by Puppeteer
- Differences were only formatting (uppercase, date precision)
- Both methods returned binary PDF data
- Puppeteer output was deterministic across multiple runs

See `/docs/api/jobs/scrape-compared.md` for detailed comparison.

### Current Flow:

```
🧪 Manual Test Trigger
        ↓
📥 Get Test Emails (Tapi)
        ↓
🔗 Extract Work Order Link
        ↓
❓ URL Found?
    ├─ True → Puppeteer Scrape & Extract → Merge → 📝 Transform to Work Order
    └─ False → ⚠️ No URL Found - Log Error
```

### Files Created:

- `/docs/api/jobs/tapi-raw.html` - Sample Tapi work order HTML for selector testing
- `/docs/api/jobs/puppeteer-scrape-example.md` - Puppeteer usage guide
- `/docs/api/jobs/scrape-compared.md` - Side-by-side comparison of FireCrawl vs Puppeteer outputs

### What Works Now:

- ✅ DOM-based data extraction from Tapi work orders
- ✅ Print-optimized PDF generation (matches client workflow)
- ✅ Zero API costs (replaced $0.50-1.00 per request)
- ✅ All 11 required fields extracted accurately
- ✅ Binary PDF data attached to workflow output
- ✅ Faster execution (no external API calls)
- ✅ Deterministic output (same input → same output)

### Next Steps:

**Phase 3**: Simpro customer/site lookup and job creation

---

## 🔄 Phase 3: Simpro Job Creation (PENDING)

**Status**: Not started
**Estimated Time**: 2-3 hours

### Nodes to Add:

1. **Code: Customer Lookup/Create**
   - Search existing Simpro customers
   - Create if not found

2. **Code: Site Lookup/Create**
   - Search existing Simpro sites
   - Create if not found

3. **HTTP Request: Create Job**
   - POST to Simpro jobs endpoint
   - Link customer and site
   - Set description, priority, status

4. **HTTP Request: Attach PDF**
   - Download PDF from email/work order page
   - Upload to Simpro job

---

## 🔄 Phase 4: CRM Integration (PENDING)

**Status**: Not started (requires CRM webhook endpoint)
**Estimated Time**: 2 hours

### Tasks:

**n8n Side:**
- Add HTTP Request node to POST work order to CRM
- Configure webhook URL and secret
- Map fields to CRM schema

**CRM Side** (Next.js):
- Create `/app/api/webhooks/work-orders/route.ts`
- Validate webhook secret
- Store work orders in database (once schema ready)
- Log webhook events

---

## Configuration Status

### Credentials Configured:
- ✅ Microsoft Outlook OAuth2
- ✅ Simpro OAuth2
- ❌ Twilio (for SMS) - Not configured yet
- ❌ OpenAI API (for AI extraction) - Not configured yet

### Environment Variables Needed:
```env
# Add to CRM .env file:
N8N_WEBHOOK_SECRET=<generate_secure_string>
N8N_INSTANCE_URL=https://n8n-totalai-au.badou.ai
N8N_WEBHOOK_ENDPOINT=https://n8n-totalai-au.badou.ai/webhook/crm-updates
SIMPRO_API_URL=https://platinumplumbinggassolutions.simprosuite.com/api/v1.0
```

---

## Testing Notes

### Test Data Available:
The workflow has pinned test data from Simpro:
- 30 customers
- 30 employees
- 30 sites
- 30 contacts
- 20 recent jobs

### To Test Phase 1:
1. Activate the workflow in n8n
2. Send a test email to the configured Outlook account with:
   - Subject: "New work order from Tapi"
   - Body: HTML with "View full work order" link
   - Sender: hi@tapihq.com
3. Wait up to 5 minutes for trigger
4. Check execution log for extracted URL

---

## Workflow URL

**Edit**: https://n8n-totalai-au.badou.ai/workflow/opBCXYhYWnf0YHfk

---

## Related Files

**CRM Code:**
- `/lib/crm/types.ts` - WorkOrder interface
- `/lib/crm/mock-data.ts` - Mock work orders and webhook config
- `/components/crm/webhooks/webhook-status.tsx` - Webhook status UI
- `/app/(dashboard)/dashboard/webhooks/page.tsx` - Webhook log page

**n8n Reference:**
- `/artifacts/n8n-work-order-pipeline.json` - Original workflow template
- `/.mcp_n8n.json` - n8n MCP configuration

**Plan:**
- `/.claude/plans/sharded-hatching-cherny.md` - Complete implementation plan

---

## Commits

- [x] Phase 1: Email detection and link extraction (Dec 5, 2025)
- [x] Phase 2: Puppeteer web scraping + PDF generation (Dec 18, 2025)
- [ ] Phase 3: Simpro job creation
- [ ] Phase 4: PDF attachment
- [ ] Phase 5: CRM webhook integration

---

**Last Updated**: December 18, 2025
