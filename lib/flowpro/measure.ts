/**
 * Measure how much the resolver recovers on a batch of real addresses.
 * Run:  npx tsx lib/flowpro/measure.ts <addresses-file>
 *
 * File format: one work order per line, either
 *     46 Emerald Blvd, Aldinga Beach SA 5173
 *   or with the PM email after a pipe (helps the customer path):
 *     46 Emerald Blvd, Aldinga Beach | karlee@ocre.com.au
 * Blank lines and lines starting with # are ignored.
 *
 * Paste the addresses from your [NoJobSiteFound] FlowProIssues emails to see
 * exactly what % now resolve BEFORE flipping the workflow.
 */
import { readFileSync } from 'fs';
import { isNull, isNotNull, and, eq } from 'drizzle-orm';
import { resolveSite, type ResolveDecision } from './service';
import { matchSite, normalizeAddress, type SiteCandidateInput } from './address-matcher';
import { db, client } from '@/lib/db/drizzle';
import { workOrders, flowproSites, flowproCustomerMap } from '@/lib/db/schema';

type Item = { rawAddress: string; pmEmail?: string };

/**
 * Ground-truth validation: for every work order with a KNOWN-correct Simpro
 * site, run the fuzzy matcher (no memory shortcut) and check it independently
 * picks the right site. This measures real-world accuracy AND surface any
 * dangerous wrong-matches, using data we already have.
 */
async function validate() {
  const useAgency = process.argv[3] !== '--no-agency';
  const [wos, siteRows, custMap] = await Promise.all([
    db
      .select({ address: workOrders.propertyAddress, siteId: workOrders.simproSiteId, externalId: workOrders.externalId, pmEmail: workOrders.pmEmail })
      .from(workOrders)
      .where(and(eq(workOrders.teamId, 1), isNotNull(workOrders.simproSiteId))),
    db.select().from(flowproSites).where(and(eq(flowproSites.teamId, 1), eq(flowproSites.archived, false))),
    db.select({ agencyKey: flowproCustomerMap.agencyKey, id: flowproCustomerMap.simproCustomerId }).from(flowproCustomerMap).where(eq(flowproCustomerMap.teamId, 1)),
  ]);

  const candidates: SiteCandidateInput[] = siteRows.map((r) => ({
    id: r.simproSiteId,
    name: r.name,
    address: { line: r.addressLine, city: r.city, state: r.state, postcode: r.postcode },
    customerIds: (r.customerIds as number[] | null) || [],
  }));
  const domainToCustomer = new Map(custMap.map((c) => [c.agencyKey, c.id]));
  const byId = new Map(candidates.map((c) => [c.id, c]));

  console.log(`Validating ${wos.length} work orders (known site) against ${candidates.length} mirror sites` +
    (useAgency ? ' [agency-aware]' : ' [address-only]') + '…\n');

  let correct = 0, wrong = 0, review = 0, noMatch = 0, siteMissing = 0;
  const wrongRows: string[] = [];
  const inMirror = new Set(candidates.map((c) => c.id));

  for (const wo of wos) {
    if (!wo.address || !wo.siteId) continue;
    if (!inMirror.has(wo.siteId)) { siteMissing++; continue; } // archived/absent from mirror — can't match
    let preferCustomerId: number | undefined;
    if (useAgency && wo.pmEmail) {
      const at = wo.pmEmail.indexOf('@');
      const domain = at === -1 ? '' : wo.pmEmail.slice(at + 1).toLowerCase();
      preferCustomerId = domain ? domainToCustomer.get(domain) : undefined;
    }
    const r = matchSite(wo.address, candidates, { preferCustomerId });
    if (r.decision === 'match') {
      if (r.best?.id === wo.siteId) correct++;
      else {
        wrong++;
        const truth = byId.get(wo.siteId);
        const matched = byId.get(r.best!.id);
        const desc = (c?: SiteCandidateInput) =>
          c ? `name="${c.name}" canon="${normalizeAddress(c.name).canonical}" custs=[${(c.customerIds || []).join(',')}]` : 'NOT IN MIRROR';
        const truthInPool = r.candidates.find((c) => c.id === wo.siteId);
        wrongRows.push(
          `  WRONG ${wo.externalId}: "${wo.address}"  (agency=>cust ${preferCustomerId ?? '—'})\n` +
          `      matched #${r.best?.id}: ${desc(matched)}\n` +
          `      truth   #${wo.siteId}: ${desc(truth)}  ${truthInPool ? `[in top-5 @${truthInPool.score}]` : '[NOT in top candidates]'}`
        );
      }
    } else if (r.decision === 'review') review++;
    else noMatch++;
  }

  const n = correct + wrong + review + noMatch;
  console.log('='.repeat(64));
  console.log(`Work orders validated:   ${n}   (skipped ${siteMissing}: site not in active mirror)`);
  console.log(`  ✅ correct auto-match: ${correct}  (${pct(correct, n)})`);
  console.log(`  ❌ WRONG auto-match:   ${wrong}  (${pct(wrong, n)})   <- must be ~0`);
  console.log(`  🖐  review (ambiguous): ${review}  (${pct(review, n)})`);
  console.log(`  🆕 no-match:           ${noMatch}  (${pct(noMatch, n)})`);
  console.log('-'.repeat(64));
  console.log(`Fuzzy would auto-resolve correctly: ${correct}/${n} (${pct(correct, n)}), 0-risk target on WRONG.`);
  if (wrongRows.length) {
    console.log('\nWrong matches to inspect (tune thresholds if any):');
    console.log(wrongRows.slice(0, 20).join('\n'));
  }
  await client.end();
}

async function loadItems(): Promise<Item[]> {
  const file = process.argv[2];
  if (file && file !== '--failed') {
    // From a file: one address per line, optional " | pmEmail"
    return readFileSync(file, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => {
        const [rawAddress, pmEmail] = l.split('|').map((s) => s.trim());
        return { rawAddress, pmEmail };
      });
  }
  // Default: the work orders that FAILED site lookup (no Simpro site) — the
  // exact population that has been landing in FlowProIssues.
  const rows = await db
    .select({ propertyAddress: workOrders.propertyAddress, pmEmail: workOrders.pmEmail })
    .from(workOrders)
    .where(and(eq(workOrders.teamId, 1), isNull(workOrders.simproSiteId)));
  console.log(`Measuring ${rows.length} historically-failed work orders (simpro_site_id IS NULL).`);
  return rows
    .filter((r) => r.propertyAddress)
    .map((r) => ({ rawAddress: r.propertyAddress, pmEmail: r.pmEmail ?? undefined }));
}

async function main() {
  if (process.argv[2] === '--validate') return validate();

  const items = await loadItems();
  if (!items.length) {
    console.log('No addresses to measure. Pass a file: npx tsx lib/flowpro/measure.ts <file>');
    await client.end();
    return;
  }

  const tally: Record<ResolveDecision, number> = { hit: 0, match: 0, review: 0, 'no-match': 0 };
  const rows: string[] = [];

  for (const { rawAddress, pmEmail } of items) {
    const r = await resolveSite({ rawAddress, pmEmail });
    tally[r.decision]++;
    const site = r.siteName ? `${r.siteName} (#${r.siteId})` : '—';
    rows.push(
      `${pad(r.decision, 9)} ${pad(String(r.score ?? ''), 6)} ${truncate(rawAddress, 42)} -> ${truncate(site, 40)}`
    );
  }

  const n = items.length;
  const resolved = tally.hit + tally.match;
  console.log('\n' + rows.join('\n'));
  console.log('\n' + '='.repeat(60));
  console.log(`Total addresses:      ${n}`);
  console.log(`  hit   (memory):     ${tally.hit}`);
  console.log(`  match (fuzzy):      ${tally.match}`);
  console.log(`  review (ambiguous): ${tally.review}`);
  console.log(`  no-match (new):     ${tally['no-match']}`);
  console.log('-'.repeat(60));
  console.log(`AUTO-RESOLVED:        ${resolved}/${n}  (${pct(resolved, n)})   <- would NOT hit FlowProIssues`);
  console.log(`Needs a human:        ${tally.review + tally['no-match']}/${n}  (${pct(tally.review + tally['no-match'], n)})`);

  await client.end();
}

const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n);
const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0) + '%';

main().catch(async (err) => {
  console.error('measure failed:', err);
  await client.end();
  process.exit(1);
});
