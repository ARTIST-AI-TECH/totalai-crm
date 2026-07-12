import { NextRequest } from 'next/server';
import { isAuthorized, unauthorized, badRequest, serverError } from '@/lib/flowpro/http';
import { syncSites } from '@/lib/flowpro/service';

/**
 * POST /api/flowpro/sync-sites
 * Body: { sites: [{ ID, Name, Address:{Address,City,State,PostalCode,Country}, Customers:[{ID}], Archived }] }
 * Called by a scheduled n8n workflow (paged, e.g. 250/call) to keep the local
 * Simpro site mirror fresh. Upserts on Simpro site ID.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const sites = Array.isArray(body) ? body : body.sites;
    if (!Array.isArray(sites)) {
      return badRequest('body.sites (array) is required');
    }

    const result = await syncSites(sites);
    return Response.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return serverError(error);
  }
}
