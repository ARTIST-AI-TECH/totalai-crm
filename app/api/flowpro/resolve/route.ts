import { NextRequest } from 'next/server';
import { isAuthorized, unauthorized, badRequest, serverError } from '@/lib/flowpro/http';
import { resolveSite } from '@/lib/flowpro/service';

/**
 * POST /api/flowpro/resolve
 * Body: { rawAddress, pmEmail?, workOrderRef?, acceptAt?, reviewAt?, minGap? }
 * Returns: { decision: 'hit'|'match'|'review'|'no-match', siteId, customerId, candidates, addressKey, ... }
 * Read-only. n8n calls this before deciding how to create the job.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) return unauthorized();
    const body = await req.json().catch(() => ({}));
    if (!body.rawAddress || typeof body.rawAddress !== 'string') {
      return badRequest('rawAddress (string) is required');
    }

    const opts =
      body.acceptAt || body.reviewAt || body.minGap
        ? { acceptAt: body.acceptAt, reviewAt: body.reviewAt, minGap: body.minGap }
        : undefined;

    const result = await resolveSite({
      rawAddress: body.rawAddress,
      pmEmail: body.pmEmail,
      workOrderRef: body.workOrderRef,
      opts,
    });

    return Response.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return serverError(error);
  }
}
