import { NextResponse } from 'next/server';
import { getContentBundle } from '../../../lib/content-store';

export async function GET() {
  return NextResponse.json(await getContentBundle());
}
