import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-session";
import {
  createReview,
  deleteReview,
  listReviews,
  updateReview,
} from "@/lib/content-repository";
import type { ReviewEntry } from "@/lib/types";
import { createId } from "@/lib/utils";

export async function GET(request: Request) {
  const session = await getAdminSession();
  const { searchParams } = new URL(request.url);
  const includeHidden = searchParams.get("admin") === "1" && Boolean(session);
  const reviews = await listReviews(includeHidden);
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    display_name?: string;
    email?: string;
    message?: string;
  };

  if (!body.display_name || !body.email || !body.message) {
    return NextResponse.json({ error: "Display name, email, and message are required." }, { status: 400 });
  }

  const review: ReviewEntry = {
    id: createId("review"),
    display_name: body.display_name.trim(),
    email: body.email.trim(),
    message: body.message.trim(),
    created_at: new Date().toISOString(),
    is_visible: true,
  };

  const saved = await createReview(review);
  return NextResponse.json({ review: saved });
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ReviewEntry> & { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const review = await updateReview(body.id, {
    is_visible: body.is_visible,
  });

  return NextResponse.json({ review });
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  await deleteReview(id);
  return NextResponse.json({ ok: true });
}
