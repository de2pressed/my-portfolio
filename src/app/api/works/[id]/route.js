import { NextResponse } from 'next/server';
import { deleteWork, saveWork } from '../../../../lib/content-store';
import { requireAdminUser } from '../../../../lib/admin-session';

export async function PUT(request, { params }) {
  try {
    await requireAdminUser(request);
    const payload = await request.json().catch(() => ({}));
    const work = await saveWork({ ...payload, id: params.id });
    return NextResponse.json({ work });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to save work.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdminUser(request);
    await deleteWork(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to delete work.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}
