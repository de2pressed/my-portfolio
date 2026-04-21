import { NextResponse } from 'next/server';
import { listSkills, saveSkill } from '../../../lib/content-store';
import { requireAdminUser } from '../../../lib/admin-session';

export async function GET() {
  return NextResponse.json({ skills: await listSkills() });
}

export async function POST(request) {
  try {
    await requireAdminUser(request);
    const payload = await request.json().catch(() => ({}));
    const skill = await saveSkill(payload || {});

    return NextResponse.json({ skill }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to save skill.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}
