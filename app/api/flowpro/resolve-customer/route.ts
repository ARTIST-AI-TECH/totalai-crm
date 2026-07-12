import { NextRequest } from 'next/server';
import { isAuthorized, unauthorized, badRequest, serverError } from '@/lib/flowpro/http';
import { resolveCustomer } from '@/lib/flowpro/service';

/**
 * POST /api/flowpro/resolve-customer
 * Body: { pmEmail, pmName?, agencyName? }
 * Returns: { decision: 'hit'|'review'|'no-match', customerId?, candidates?, agencyKey }
 * Only called when a brand-new site must be created and we need its owning agency.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) return unauthorized();
    const body = await req.json().catch(() => ({}));
    if (!body.pmEmail && !body.agencyName) {
      return badRequest('pmEmail or agencyName is required');
    }

    const result = await resolveCustomer({
      pmEmail: body.pmEmail,
      pmName: body.pmName,
      agencyName: body.agencyName,
    });

    return Response.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return serverError(error);
  }
}
