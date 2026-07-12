/**
 * Warm-start the FlowPro memory from history — VALIDATED.
 * Run:  npx tsx lib/flowpro/backfill.ts
 *
 * Every work order that produced a Simpro job carries an address -> site ->
 * customer mapping. But historical assignments contain mistakes (a "6 Pym St,
 * Belair" work order was once filed against "6 Pym Street, Croydon Park"). If
 * we seed those verbatim, the L0 map returns the wrong site forever and
 * short-circuits the (correct) fuzzy matcher.
 *
 * So we only seed a mapping when the work order's address actually MATCHES the
 * site it was filed against (score >= THRESHOLD). Divergent rows are historical
 * misassignments — skipped and printed, so the fuzzy matcher resolves them
 * correctly at runtime instead.
 *
 * Idempotent + self-correcting: clears prior backfill rows first, so re-running
 * after a matcher change re-seeds cleanly. Learned rows from live runs
 * (auto_match / human_confirm / created) are left untouched.
 */
import { and, eq, isNotNull } from 'drizzle-orm';
import { db, client } from '@/lib/db/drizzle';
import { workOrders, flowproSiteMap, flowproCustomerMap } from '@/lib/db/schema';
import { learnSite } from './service';
import { addressKey, normalizeAddress, scorePair } from './address-matcher';

const TEAM_ID = 1;
const THRESHOLD = 0.9; // work-order address must match its filed site this well

async function main() {
  // Clear only prior backfill rows so re-runs are clean and can't accumulate
  // stale/incorrect mappings. Live-learned rows are preserved.
  const delSites = await db
    .delete(flowproSiteMap)
    .where(and(eq(flowproSiteMap.teamId, TEAM_ID), eq(flowproSiteMap.source, 'backfill')))
    .returning({ id: flowproSiteMap.id });
  const delCusts = await db
    .delete(flowproCustomerMap)
    .where(and(eq(flowproCustomerMap.teamId, TEAM_ID), eq(flowproCustomerMap.source, 'backfill')))
    .returning({ id: flowproCustomerMap.id });
  console.log(`Cleared prior backfill rows: ${delSites.length} site, ${delCusts.length} agency.`);

  const rows = await db
    .select({
      externalId: workOrders.externalId,
      propertyAddress: workOrders.propertyAddress,
      simproSiteId: workOrders.simproSiteId,
      simproSiteName: workOrders.simproSiteName,
      simproCustomerId: workOrders.simproCustomerId,
      simproCustomerName: workOrders.simproCustomerName,
      pmEmail: workOrders.pmEmail,
    })
    .from(workOrders)
    .where(and(eq(workOrders.teamId, TEAM_ID), isNotNull(workOrders.simproSiteId)));

  console.log(`Found ${rows.length} historical work orders with a Simpro site.\n`);

  const seenKeys = new Set<string>();
  let seeded = 0, customers = 0, skippedNoAddr = 0, skippedDup = 0, skippedMismatch = 0;
  const mismatches: string[] = [];

  for (const r of rows) {
    if (!r.simproSiteId || !r.propertyAddress) { skippedNoAddr++; continue; }
    const key = addressKey(r.propertyAddress);
    if (!key) { skippedNoAddr++; continue; }

    // Validate: does the work order address actually match the filed site?
    const score = scorePair(normalizeAddress(r.propertyAddress), normalizeAddress(r.simproSiteName || ''));
    if (score < THRESHOLD) {
      skippedMismatch++;
      mismatches.push(`  ${r.externalId}: "${r.propertyAddress}"  filed against  "${r.simproSiteName}"  (score ${score.toFixed(2)})`);
      continue;
    }

    if (seenKeys.has(key)) { skippedDup++; continue; }
    seenKeys.add(key);

    const res = await learnSite({
      addressKey: key,
      siteId: r.simproSiteId,
      siteName: r.simproSiteName,
      customerId: r.simproCustomerId,
      customerName: r.simproCustomerName,
      source: 'backfill',
      ref: r.externalId,
      pmEmail: r.pmEmail,
    });
    seeded++;
    if (res.learnedCustomer) customers++;
  }

  console.log('— backfill complete —');
  console.log(`  site mappings seeded:        ${seeded}`);
  console.log(`  agency mappings seeded:      ${customers}`);
  console.log(`  skipped (no address):        ${skippedNoAddr}`);
  console.log(`  skipped (dup key in pass):   ${skippedDup}`);
  console.log(`  skipped (historical MISMATCH): ${skippedMismatch}  <- fuzzy matcher will resolve these correctly`);
  if (mismatches.length) {
    console.log('\nHistorical misassignments NOT seeded (address ≠ filed site):');
    console.log(mismatches.slice(0, 40).join('\n'));
  }

  await client.end();
}

main().catch(async (err) => {
  console.error('backfill failed:', err);
  await client.end();
  process.exit(1);
});
