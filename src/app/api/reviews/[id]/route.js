import { NextResponse } from 'next/server';
import { deleteReview } from '../../../../lib/content-store';
import { requireAdminUser } from '../../../../lib/admin-session';

export async function DELETE(request, { params }) {
  try {
    await requireAdminUser(request);
    await deleteReview(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to delete review.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}
