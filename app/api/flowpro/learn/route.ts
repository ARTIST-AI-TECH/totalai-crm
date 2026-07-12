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
export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) return unauthorized();
    const body = await req.json().catch(() => ({}));

    if (!body.siteId || typeof body.siteId !== 'number') {
      return badRequest('siteId (number) is required');
    }
    if (!body.rawAddress && !body.addressKey) {
      return badRequest('rawAddress or addressKey is required');
    }
    const validSources = ['auto_match', 'human_confirm', 'created', 'backfill'];
    if (!validSources.includes(body.source)) {
      return badRequest(`source must be one of ${validSources.join(', ')}`);
    }

    const result = await learnSite({
      rawAddress: body.rawAddress,
      addressKey: body.addressKey,
      siteId: body.siteId,
      siteName: body.siteName,
      customerId: body.customerId,
      customerName: body.customerName,
      source: body.source,
      confidence: body.confidence,
      ref: body.ref,
      pmEmail: body.pmEmail,
    });

    return Response.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return serverError(error);
  }
}
