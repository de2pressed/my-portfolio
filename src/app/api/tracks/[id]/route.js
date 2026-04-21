import { NextResponse } from 'next/server';
import { deleteTrack, saveTrack } from '../../../../lib/content-store';
import { requireAdminUser } from '../../../../lib/admin-session';

export async function PUT(request, { params }) {
  try {
    await requireAdminUser(request);
    const payload = await request.json().catch(() => ({}));
    const track = await saveTrack({ ...payload, id: params.id });
    return NextResponse.json({ track });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to save track.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdminUser(request);
    await deleteTrack(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to delete track.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}
