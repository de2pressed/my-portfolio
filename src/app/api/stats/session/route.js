import { NextResponse } from 'next/server';
import { closeAnalyticsSession, recordAnalyticsSession } from '../../../../lib/content-store';

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));
  const {
    action = 'heartbeat',
    consentState = 'accepted',
    currentPath = '/',
    durationMs = 0,
    pageViews = 0,
    routes = [],
    sessionId,
  } = payload || {};

  if (!sessionId || consentState !== 'accepted') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (action === 'end') {
    await closeAnalyticsSession({
      durationMs,
      sessionId,
    });
  } else {
    await recordAnalyticsSession({
      action,
      consentState,
      currentPath,
      durationMs,
      pageViews,
      routes,
      sessionId,
      userAgent: request.headers.get('user-agent') || '',
    });
  }

  return NextResponse.json({ ok: true });
}
