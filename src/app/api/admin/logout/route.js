import { NextResponse } from 'next/server';
import { createAuthRouteClient } from '../../../../lib/supabase';

export async function POST(request) {
  const response = NextResponse.json({ ok: true });
  const client = createAuthRouteClient(request, response);

  if (!client) {
    return response;
  }

  await client.auth.signOut();
  return response;
}
