import { NextResponse } from 'next/server';
import { saveSiteSettings } from '../../../../lib/content-store';
import { requireAdminUser } from '../../../../lib/admin-session';

export async function PUT(request) {
  try {
    await requireAdminUser(request);
    const payload = await request.json().catch(() => ({}));
    const siteSettings = await saveSiteSettings(payload || {});

    return NextResponse.json({ siteSettings });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to save site settings.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}
