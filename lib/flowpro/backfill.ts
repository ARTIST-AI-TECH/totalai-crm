/**
 * Warm-start the FlowPro memory from history.
 * Run:  npx tsx lib/flowpro/backfill.ts
 *
 * Every work order that already produced a Simpro job carries a proven
 * address -> site -> customer mapping. Seeding flowpro_site_map (and the agency
 * map) from those rows means previously-successful properties resolve as an
 * instant L0 'hit' from day one — the memory isn't cold.
 *
 * Idempotent: re-running upserts the same keys. Safe to run repeatedly.
 */
import { and, eq, isNotNull } from 'drizzle-orm';
import { db, client } from '@/lib/db/drizzle';
import { workOrders } from '@/lib/db/schema';
import { learnSite } from './service';
import { addressKey } from './address-matcher';

const TEAM_ID = 1;

async function main() {
  const rows = await db
    .select({
      externalId: workOrders.externalId,
      propertyAddress: workOrders.propertyAddress,
      simproSiteId: workOrders.simproSiteId,
      simproSiteName: workOrders.simproSiteName,
      simproCustomerId: workOrders.simproCustomerId,
      simproCustomerName: workOrders.simproCustomerName,
      pmEmail: workOrders.pmEmail,
      jobCreatedAt: workOrders.jobCreatedAt,
    })
    .from(workOrders)
    .where(and(eq(workOrders.teamId, TEAM_ID), isNotNull(workOrders.simproSiteId)));

  console.log(`Found ${rows.length} historical work orders with a Simpro site.`);

  const seenKeys = new Set<string>();
  let sites = 0;
  let customers = 0;
  let skippedNoAddress = 0;
  let skippedDupKey = 0;

  for (const r of rows) {
    if (!r.simproSiteId || !r.propertyAddress) {
      skippedNoAddress++;
      continue;
    }
    const key = addressKey(r.propertyAddress);
    if (!key) {
      skippedNoAddress++;
      continue;
    }
    if (seenKeys.has(key)) {
      skippedDupKey++;
      continue; // avoid inflating timesUsed within one backfill pass
    }
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
    sites++;
    if (res.learnedCustomer) customers++;
  }

  console.log('\n— backfill complete —');
  console.log(`  site mappings seeded:      ${sites}`);
  console.log(`  agency mappings seeded:    ${customers}`);
  console.log(`  skipped (no address):      ${skippedNoAddress}`);
  console.log(`  skipped (dup key in pass): ${skippedDupKey}`);

  await client.end();
}

main().catch(async (err) => {
  console.error('backfill failed:', err);
  await client.end();
  process.exit(1);
});
