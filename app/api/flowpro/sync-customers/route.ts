import { NextRequest } from 'next/server';
import { isAuthorized, unauthorized, badRequest, serverError } from '@/lib/flowpro/http';
import { syncCustomers } from '@/lib/flowpro/service';

/**
 * POST /api/flowpro/sync-customers
 * Body: { customers: [{ ID, Type, CompanyName, GivenName, FamilyName, emailDomains?:[] }] }
 * Called by a scheduled n8n workflow to keep the local Simpro customer mirror
 * fresh (used to resolve the agency for brand-new sites). Upserts on customer ID.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const customers = Array.isArray(body) ? body : body.customers;
    if (!Array.isArray(customers)) {
      return badRequest('body.customers (array) is required');
    }

    const result = await syncCustomers(customers);
    return Response.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return serverError(error);
  }
}
