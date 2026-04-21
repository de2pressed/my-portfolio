import { NextResponse } from 'next/server';
import { deleteExperience, saveExperience } from '../../../../lib/content-store';
import { requireAdminUser } from '../../../../lib/admin-session';

export async function PUT(request, { params }) {
  try {
    await requireAdminUser(request);
    const payload = await request.json().catch(() => ({}));
    const experience = await saveExperience({ ...payload, id: params.id });
    return NextResponse.json({ experience });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to save experience entry.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdminUser(request);
    await deleteExperience(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to delete experience entry.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}
