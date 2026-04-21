import { NextResponse } from 'next/server';
import { listWorks, saveWork } from '../../../lib/content-store';
import { requireAdminUser } from '../../../lib/admin-session';

export async function GET() {
  return NextResponse.json({ works: await listWorks() });
}

export async function POST(request) {
  try {
    await requireAdminUser(request);
    const payload = await request.json().catch(() => ({}));
    const work = await saveWork(payload || {});

    return NextResponse.json({ work }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to save work.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}
