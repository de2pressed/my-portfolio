import { NextResponse } from 'next/server';
import { listExperience, saveExperience } from '../../../lib/content-store';
import { requireAdminUser } from '../../../lib/admin-session';

export async function GET() {
  return NextResponse.json({ experience: await listExperience() });
}

export async function POST(request) {
  try {
    await requireAdminUser(request);
    const payload = await request.json().catch(() => ({}));
    const experience = await saveExperience(payload || {});

    return NextResponse.json({ experience }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to save experience entry.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}
