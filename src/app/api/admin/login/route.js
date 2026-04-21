import { NextResponse } from 'next/server';
import { createAuthRouteClient } from '../../../../lib/supabase';

const adminEmail = String(process.env.SUPABASE_ADMIN_EMAIL || '').trim().toLowerCase();

export async function POST(request) {
  const response = NextResponse.json({ ok: true });
  const client = createAuthRouteClient(request, response);

  if (!client) {
    return NextResponse.json(
      { message: 'Supabase auth is not configured.' },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => ({}));
  const password = String(payload.password || '').trim();
  const email =
    String(payload.email || process.env.SUPABASE_ADMIN_EMAIL || '').trim();

  if (!email || !password) {
    return NextResponse.json(
      { message: 'Email and password are required.' },
      { status: 400 },
    );
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error || !data?.user) {
    return NextResponse.json(
      { message: error?.message || 'Invalid admin credentials.' },
      { status: 401 },
    );
  }

  if (adminEmail && String(data.user.email || '').trim().toLowerCase() !== adminEmail) {
    await client.auth.signOut();
    return NextResponse.json(
      { message: 'This account is not permitted to access the admin surface.' },
      { status: 403 },
    );
  }

  return response;
}
