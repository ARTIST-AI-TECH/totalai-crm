/**
 * Shared helpers for the /api/flowpro/* routes.
 * Reuses the existing n8n<->CRM shared secret so there's no new credential.
 */
import { NextRequest } from 'next/server';

const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'dev-secret-change-in-production';

/** Returns true when the request carries the valid shared secret. */
export function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('x-crm-webhook-secret');
  return !!header && header === WEBHOOK_SECRET;
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export function badRequest(message: string) {
  return Response.json({ error: 'Bad request', message }, { status: 400 });
}

export function serverError(error: unknown) {
  console.error('❌ flowpro route error:', error);
  return Response.json(
    { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
    { status: 500 }
  );
}
