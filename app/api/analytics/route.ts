import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-session";
import { getAnalyticsSummary, storeAnalyticsEvent } from "@/lib/content-repository";
import type { AnalyticsEvent } from "@/lib/types";
import { createId } from "@/lib/utils";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getAnalyticsSummary();
  return NextResponse.json({ summary });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AnalyticsEvent>;
  if (!body.event_type || !body.visitor_id) {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
  }

  const event: AnalyticsEvent = {
    id: createId("event"),
    event_type: body.event_type,
    visitor_id: body.visitor_id,
    metadata: body.metadata ?? {},
    created_at: new Date().toISOString(),
  };

  await storeAnalyticsEvent(event);
  return NextResponse.json({ ok: true });
}
