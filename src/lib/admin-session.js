import { createReadonlyAuthClient } from './supabase';

const adminEmail = String(process.env.SUPABASE_ADMIN_EMAIL || '').trim().toLowerCase();

export async function getAdminUser(request) {
  const client = createReadonlyAuthClient(request);

  if (!client) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    return null;
  }

  if (adminEmail && String(user.email || '').trim().toLowerCase() !== adminEmail) {
    return null;
  }

  return user;
}

export async function requireAdminUser(request) {
  const user = await getAdminUser(request);

  if (!user) {
    throw new Error('Unauthorized.');
  }

  return user;
}
