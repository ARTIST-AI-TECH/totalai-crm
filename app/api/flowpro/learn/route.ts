import { NextRequest } from 'next/server';
import { isAuthorized, unauthorized, badRequest, serverError } from '@/lib/flowpro/http';
import { learnSite } from '@/lib/flowpro/service';

/**
 * POST /api/flowpro/learn
 * Body: { rawAddress|addressKey, siteId, siteName?, customerId?, customerName?,
 *         source: 'auto_match'|'human_confirm'|'created'|'backfill',
 *         confidence?, ref?, pmEmail? }
 * The single write path — call after a job is committed so the address (and, if
 * pmEmail is given, the agency) is remembered permanently.
 */
/**
 * Simpro / n8n sometimes hand IDs across as strings (e.g. the ID of a freshly
 * created site). A learn call must never be dropped over a type — coerce
 * numeric strings, reject only genuine garbage.
 */
function toId(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return parseInt(v.trim(), 10);
  return null;
}

function toConfidence(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) return unauthorized();
    const body = await req.json().catch(() => ({}));

    const siteId = toId(body.siteId);
    if (!siteId) {
      return badRequest('siteId (number) is required');
    }
    if (!body.rawAddress && !body.addressKey) {
      return badRequest('rawAddress or addressKey is required');
    }
    // `source` is the trust label (human_confirm vs auto_match vs created) —
    // normalize the shape, but never silently default an unknown value: a bad
    // label means a sender bug that must surface, not be absorbed into the map.
    const validSources = ['auto_match', 'human_confirm', 'created', 'backfill'];
    const source = typeof body.source === 'string' ? body.source.trim().toLowerCase() : '';
    if (!validSources.includes(source)) {
      return badRequest(`source must be one of ${validSources.join(', ')}`);
    }

    const result = await learnSite({
      rawAddress: body.rawAddress,
      addressKey: body.addressKey,
      siteId,
      siteName: body.siteName,
      customerId: toId(body.customerId),
      customerName: body.customerName,
      source: source as 'auto_match' | 'human_confirm' | 'created' | 'backfill',
      confidence: toConfidence(body.confidence),
      ref: body.ref,
      pmEmail: body.pmEmail,
    });

    return Response.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return serverError(error);
  }
}
