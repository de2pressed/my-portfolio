import { NextResponse } from 'next/server';
import { recordAnalyticsEvent } from '../../../../lib/content-store';

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));
  const {
    consentState = 'accepted',
    currentPath = '/',
    durationMs = 0,
    eventType = 'interaction',
    payload: eventPayload = {},
    sessionId,
  } = payload || {};

  if (!sessionId || consentState !== 'accepted') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await recordAnalyticsEvent({
    currentPath,
    durationMs,
    eventType,
    payload: eventPayload,
    sessionId,
  });

  return NextResponse.json({ ok: true });
}
