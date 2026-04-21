import { NextResponse } from 'next/server';
import { getStats } from '../../../lib/content-store';
import { requireAdminUser } from '../../../lib/admin-session';

export async function GET(request) {
  try {
    await requireAdminUser(request);
    return NextResponse.json({ stats: await getStats() });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to load stats.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}
