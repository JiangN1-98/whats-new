import { randomUUID } from 'node:crypto';
export const dynamic = 'force-dynamic';
// Only this read-only route exists in M0. No open proxy or business logic.
export async function GET() {
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000/api/v1';
  try {
    const upstream = await fetch(`${base.replace(/\/$/, '')}/health/live`, { cache: 'no-store', signal: AbortSignal.timeout(3000) });
    return new Response(upstream.body, { status: upstream.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'x-request-id': upstream.headers.get('x-request-id') ?? '' } });
  } catch {
    const requestId = randomUUID();
    return Response.json({ error: { code: 'API_UNAVAILABLE', message: 'API is unavailable', requestId } }, { status: 503, headers: { 'Cache-Control': 'no-store', 'x-request-id': requestId } });
  }
}
