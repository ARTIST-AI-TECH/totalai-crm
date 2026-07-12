/**
 * FlowPro resolution service — the "brain" behind the /api/flowpro/* routes.
 *
 * Kept separate from the HTTP handlers so the resolution logic is unit-testable
 * and reusable (backfill script, future CRM UI). All matching runs locally
 * against the Simpro mirror tables, so it is immune to Simpro's search quirks.
 */
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  flowproSites,
  flowproCustomers,
  flowproSiteMap,
  flowproCustomerMap,
} from '@/lib/db/schema';
import {
  matchSite,
  addressKey,
  type SiteCandidateInput,
  type MatchOptions,
  type ScoredCandidate,
} from './address-matcher';

const TEAM_ID = 1; // Platinum Plumbing (single-tenant today; column kept for later)

export function emailDomain(email?: string | null): string {
  if (!email) return '';
  const at = email.indexOf('@');
  return at === -1 ? '' : email.slice(at + 1).trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Site resolution — L0 learned map, then L1 fuzzy match against the mirror.
// ---------------------------------------------------------------------------
export type ResolveDecision = 'hit' | 'match' | 'review' | 'no-match';

export interface ResolveSiteResult {
  decision: ResolveDecision;
  addressKey: string;
  source?: 'map' | 'fuzzy';
  siteId?: number | null;
  siteName?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  score?: number;
  candidates?: ScoredCandidate[];
  sitesInPool?: number;
  reason?: string;
}

export async function resolveSite(input: {
  rawAddress: string;
  pmEmail?: string;
  workOrderRef?: string;
  opts?: MatchOptions;
}): Promise<ResolveSiteResult> {
  const key = addressKey(input.rawAddress);
  if (!key) return { decision: 'no-match', addressKey: '', reason: 'unparseable-address' };

  // L0 — the permanent memory. O(1), no Simpro call.
  const mapped = await db
    .select()
    .from(flowproSiteMap)
    .where(and(eq(flowproSiteMap.teamId, TEAM_ID), eq(flowproSiteMap.addressKey, key)))
    .limit(1);
  if (mapped.length) {
    const m = mapped[0];
    return {
      decision: 'hit',
      source: 'map',
      addressKey: key,
      siteId: m.simproSiteId,
      siteName: m.simproSiteName,
      customerId: m.simproCustomerId,
      customerName: m.simproCustomerName,
      score: 1,
    };
  }

  // Resolve the work order's agency (from the learned map) to disambiguate
  // duplicate-address sites and confirm ties.
  let preferCustomerId: number | undefined;
  const domain = emailDomain(input.pmEmail);
  if (domain) {
    const cm = await db
      .select({ id: flowproCustomerMap.simproCustomerId })
      .from(flowproCustomerMap)
      .where(and(eq(flowproCustomerMap.teamId, TEAM_ID), eq(flowproCustomerMap.agencyKey, domain)))
      .limit(1);
    if (cm.length) preferCustomerId = cm[0].id;
  }

  // L1 — fuzzy match against the local mirror of Simpro sites.
  const rows = await db
    .select()
    .from(flowproSites)
    .where(and(eq(flowproSites.teamId, TEAM_ID), eq(flowproSites.archived, false)));

  const candidates: SiteCandidateInput[] = rows.map((r) => ({
    id: r.simproSiteId,
    name: r.name,
    address: { line: r.addressLine, city: r.city, state: r.state, postcode: r.postcode },
    customerIds: (r.customerIds as number[] | null) || [],
  }));

  const result = matchSite(input.rawAddress, candidates, { ...input.opts, preferCustomerId });
  const best = result.best;
  const customerId = best?.customerIds?.[0] ?? null;

  // Only surface a concrete site/customer on a confident match. For review or
  // no-match the top-level fields are null (the caller must use `candidates`,
  // not a weak best-guess) — prevents a no-match from advertising a bogus site.
  const isMatch = result.decision === 'match';
  const resolvedCustomerId = isMatch ? customerId : null;

  return {
    decision: result.decision, // 'match' | 'review' | 'no-match'
    source: 'fuzzy',
    addressKey: key,
    siteId: isMatch ? best?.id ?? null : null,
    siteName: isMatch ? best?.name ?? null : null,
    customerId: resolvedCustomerId,
    customerName: resolvedCustomerId ? await customerNameFor(resolvedCustomerId) : null,
    score: best?.score,
    candidates: result.candidates,
    sitesInPool: rows.length,
  };
}

async function customerNameFor(customerId: number): Promise<string | null> {
  const rows = await db
    .select({
      companyName: flowproCustomers.companyName,
      givenName: flowproCustomers.givenName,
      familyName: flowproCustomers.familyName,
    })
    .from(flowproCustomers)
    .where(and(eq(flowproCustomers.teamId, TEAM_ID), eq(flowproCustomers.simproCustomerId, customerId)))
    .limit(1);
  if (!rows.length) return null;
  const c = rows[0];
  return c.companyName || [c.givenName, c.familyName].filter(Boolean).join(' ') || null;
}

// ---------------------------------------------------------------------------
// Learn — the single write path. Called after n8n commits a job so the mapping
// becomes permanent (auto-match, human confirm, or freshly-created site).
// ---------------------------------------------------------------------------
export async function learnSite(input: {
  rawAddress?: string;
  addressKey?: string;
  siteId: number;
  siteName?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  source: 'auto_match' | 'human_confirm' | 'created' | 'backfill';
  confidence?: number | null;
  ref?: string | null;
  pmEmail?: string | null;
}): Promise<{ addressKey: string; learnedCustomer: boolean }> {
  const key = input.addressKey || addressKey(input.rawAddress);
  if (!key) throw new Error('learnSite: could not derive addressKey');
  if (!input.siteId) throw new Error('learnSite: siteId required');

  await db
    .insert(flowproSiteMap)
    .values({
      teamId: TEAM_ID,
      addressKey: key,
      simproSiteId: input.siteId,
      simproSiteName: input.siteName ?? null,
      simproCustomerId: input.customerId ?? null,
      simproCustomerName: input.customerName ?? null,
      source: input.source,
      confidence: input.confidence != null ? input.confidence.toFixed(3) : null,
      lastRef: input.ref ?? null,
      timesUsed: 1,
    })
    .onConflictDoUpdate({
      target: flowproSiteMap.addressKey,
      set: {
        simproSiteId: input.siteId,
        simproSiteName: input.siteName ?? null,
        simproCustomerId: input.customerId ?? null,
        simproCustomerName: input.customerName ?? null,
        source: input.source,
        lastRef: input.ref ?? null,
        timesUsed: sql`${flowproSiteMap.timesUsed} + 1`,
        updatedAt: new Date(),
      },
    });

  // Teach the agency->customer map too, so future new properties resolve.
  let learnedCustomer = false;
  const domain = emailDomain(input.pmEmail);
  if (domain && input.customerId) {
    await learnCustomer({
      agencyKey: domain,
      customerId: input.customerId,
      customerName: input.customerName ?? null,
      source:
        input.source === 'human_confirm'
          ? 'human_confirm'
          : input.source === 'backfill'
            ? 'backfill'
            : 'auto_match',
    });
    learnedCustomer = true;
  }

  return { addressKey: key, learnedCustomer };
}

export async function learnCustomer(input: {
  agencyKey: string;
  customerId: number;
  customerName?: string | null;
  source: 'auto_match' | 'human_confirm' | 'backfill';
}): Promise<void> {
  const agencyKey = input.agencyKey.trim().toLowerCase();
  if (!agencyKey || !input.customerId) return;
  await db
    .insert(flowproCustomerMap)
    .values({
      teamId: TEAM_ID,
      agencyKey,
      simproCustomerId: input.customerId,
      customerName: input.customerName ?? null,
      source: input.source,
      timesUsed: 1,
    })
    .onConflictDoUpdate({
      target: flowproCustomerMap.agencyKey,
      set: {
        simproCustomerId: input.customerId,
        customerName: input.customerName ?? null,
        source: input.source,
        timesUsed: sql`${flowproCustomerMap.timesUsed} + 1`,
        updatedAt: new Date(),
      },
    });
}

// ---------------------------------------------------------------------------
// Customer resolution — only needed when creating a brand-new site. C0 learned
// map -> C1 match against the customer mirror by PM email domain.
// ---------------------------------------------------------------------------
export interface ResolveCustomerResult {
  decision: 'hit' | 'review' | 'no-match';
  agencyKey: string;
  source?: 'map' | 'cache';
  customerId?: number | null;
  customerName?: string | null;
  candidates?: Array<{ customerId: number; customerName: string | null }>;
  reason?: string;
}

export async function resolveCustomer(input: {
  pmEmail?: string;
  pmName?: string;
  agencyName?: string;
}): Promise<ResolveCustomerResult> {
  const domain = emailDomain(input.pmEmail);
  if (!domain) return { decision: 'no-match', agencyKey: '', reason: 'no-pm-email-domain' };

  // C0 — learned agency map.
  const mapped = await db
    .select()
    .from(flowproCustomerMap)
    .where(and(eq(flowproCustomerMap.teamId, TEAM_ID), eq(flowproCustomerMap.agencyKey, domain)))
    .limit(1);
  if (mapped.length) {
    return {
      decision: 'hit',
      source: 'map',
      agencyKey: domain,
      customerId: mapped[0].simproCustomerId,
      customerName: mapped[0].customerName,
    };
  }

  // C1 — match against the customer mirror by observed contact email domains.
  const custs = await db
    .select()
    .from(flowproCustomers)
    .where(eq(flowproCustomers.teamId, TEAM_ID));

  const byDomain = custs.filter((c) => {
    const domains = (c.emailDomains as string[] | null) || [];
    return domains.map((d) => d.toLowerCase()).includes(domain);
  });

  const nameOf = (c: (typeof custs)[number]) =>
    c.companyName || [c.givenName, c.familyName].filter(Boolean).join(' ') || null;

  if (byDomain.length === 1) {
    return {
      decision: 'hit',
      source: 'cache',
      agencyKey: domain,
      customerId: byDomain[0].simproCustomerId,
      customerName: nameOf(byDomain[0]),
    };
  }
  if (byDomain.length > 1) {
    return {
      decision: 'review',
      agencyKey: domain,
      candidates: byDomain.slice(0, 5).map((c) => ({ customerId: c.simproCustomerId, customerName: nameOf(c) })),
    };
  }

  // No confident signal — hand a shortlist (fuzzy on the domain root) to a human.
  const root = domain.split('.')[0];
  const fuzzy = custs
    .filter((c) => {
      const nm = (nameOf(c) || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return root.length >= 3 && nm.includes(root.replace(/[^a-z0-9]/g, ''));
    })
    .slice(0, 5)
    .map((c) => ({ customerId: c.simproCustomerId, customerName: nameOf(c) }));

  return {
    decision: fuzzy.length ? 'review' : 'no-match',
    agencyKey: domain,
    candidates: fuzzy,
    reason: fuzzy.length ? undefined : 'no-customer-candidate',
  };
}

// ---------------------------------------------------------------------------
// Sync — n8n pushes the Simpro site/customer lists (paged) into the mirror.
// ---------------------------------------------------------------------------
interface SimproSitePayload {
  ID: number;
  Name?: string;
  Address?: { Address?: string; City?: string; State?: string; PostalCode?: string; Country?: string } | null;
  Customers?: Array<{ ID?: number } | number> | null;
  Archived?: boolean;
}

export async function syncSites(sites: SimproSitePayload[]): Promise<{ upserted: number }> {
  const rows = sites
    .filter((s) => s && typeof s.ID === 'number')
    .map((s) => {
      const a = s.Address || {};
      const nameForKey = s.Name || [a.Address, a.City, a.State, a.PostalCode].filter(Boolean).join(' ');
      const customerIds = Array.isArray(s.Customers)
        ? s.Customers.map((c) => (typeof c === 'object' && c ? c.ID : c)).filter((x): x is number => typeof x === 'number')
        : [];
      return {
        teamId: TEAM_ID,
        simproSiteId: s.ID,
        name: s.Name || nameForKey || `Site ${s.ID}`,
        addressLine: a.Address ?? null,
        city: a.City ?? null,
        state: a.State ?? null,
        postcode: a.PostalCode ?? null,
        country: a.Country ?? null,
        customerIds,
        archived: !!s.Archived,
        addressKey: addressKey(nameForKey),
        rawData: s as unknown,
        syncedAt: new Date(),
      };
    });
  if (!rows.length) return { upserted: 0 };

  const CHUNK = 250;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db
      .insert(flowproSites)
      .values(rows.slice(i, i + CHUNK))
      .onConflictDoUpdate({
        target: flowproSites.simproSiteId,
        set: {
          name: sql`excluded.name`,
          addressLine: sql`excluded.address_line`,
          city: sql`excluded.city`,
          state: sql`excluded.state`,
          postcode: sql`excluded.postcode`,
          country: sql`excluded.country`,
          customerIds: sql`excluded.customer_ids`,
          archived: sql`excluded.archived`,
          addressKey: sql`excluded.address_key`,
          rawData: sql`excluded.raw_data`,
          syncedAt: sql`excluded.synced_at`,
          updatedAt: new Date(),
        },
      });
  }
  return { upserted: rows.length };
}

interface SimproCustomerPayload {
  ID: number;
  Type?: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  emailDomains?: string[];
}

export async function syncCustomers(customers: SimproCustomerPayload[]): Promise<{ upserted: number }> {
  const rows = customers
    .filter((c) => c && typeof c.ID === 'number')
    .map((c) => ({
      teamId: TEAM_ID,
      simproCustomerId: c.ID,
      type: c.Type ?? null,
      companyName: c.CompanyName ?? null,
      givenName: c.GivenName ?? null,
      familyName: c.FamilyName ?? null,
      emailDomains: Array.isArray(c.emailDomains) ? c.emailDomains : [],
      rawData: c as unknown,
      syncedAt: new Date(),
    }));
  if (!rows.length) return { upserted: 0 };

  const CHUNK = 250;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db
      .insert(flowproCustomers)
      .values(rows.slice(i, i + CHUNK))
      .onConflictDoUpdate({
        target: flowproCustomers.simproCustomerId,
        set: {
          type: sql`excluded.type`,
          companyName: sql`excluded.company_name`,
          givenName: sql`excluded.given_name`,
          familyName: sql`excluded.family_name`,
          emailDomains: sql`excluded.email_domains`,
          rawData: sql`excluded.raw_data`,
          syncedAt: sql`excluded.synced_at`,
          updatedAt: new Date(),
        },
      });
  }
  return { upserted: rows.length };
}
