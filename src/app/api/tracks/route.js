import { NextResponse } from 'next/server';
import { listTracks, saveTrack } from '../../../lib/content-store';
import { requireAdminUser } from '../../../lib/admin-session';

export async function GET() {
  return NextResponse.json({ tracks: await listTracks() });
}

export async function POST(request) {
  try {
    await requireAdminUser(request);
    const payload = await request.json().catch(() => ({}));
    const track = await saveTrack(payload || {});

    return NextResponse.json({ track }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Unable to save track.' },
      { status: error.message === 'Unauthorized.' ? 401 : 400 },
    );
  }
}
