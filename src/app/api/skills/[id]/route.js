import { NextResponse } from 'next/server';
import { deleteSkill, saveSkill } from '../../../../lib/content-store';
import { requireAdminUser } from '../../../../lib/admin-session';

export async function PUT(request, { params }) {
  try {
    await requireAdminUser(request);
    const payload = await request.json().catch(() => ({}));
    const skill = await saveSkill({ ...payload, id: params.id });
    return NextResponse.json({ skill });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to save skill.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdminUser(request);
    await deleteSkill(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to delete skill.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}
