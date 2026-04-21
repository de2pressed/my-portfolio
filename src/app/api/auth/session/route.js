import { NextResponse } from 'next/server';
import { createReadonlyAuthClient } from '../../../../lib/supabase';

const adminEmail = String(process.env.SUPABASE_ADMIN_EMAIL || '').trim().toLowerCase();

export async function GET(request) {
  const client = createReadonlyAuthClient(request);

  if (!client) {
    return NextResponse.json({ authenticated: false });
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  const authenticated =
    Boolean(user) &&
    (!adminEmail || String(user.email || '').trim().toLowerCase() === adminEmail);

  return NextResponse.json({
    authenticated,
    user: authenticated
      ? {
          email: user.email || '',
          id: user.id,
        }
      : null,
  });
}
