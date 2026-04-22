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
import { handleApiError } from "@/lib/error-handler";
import { rateLimit } from "@/lib/rate-limit";
import { reviewSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const session = await getAdminSession();
  const { searchParams } = new URL(request.url);
  const includeHidden = searchParams.get("admin") === "1" && Boolean(session);
  const reviews = await listReviews(includeHidden);
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  // Check request size limit (1MB)
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
    return NextResponse.json(
      { error: "Request body too large. Maximum size is 1MB." },
      { status: 413 }
    );
  }

  // Rate limit: 100 requests per minute per IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimitResult = rateLimit(ip, 100, 60 * 1000);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const validationResult = reviewSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const review: ReviewEntry = {
      id: createId("review"),
      display_name: validatedData.display_name,
      email: validatedData.email,
      message: validatedData.message,
      created_at: new Date().toISOString(),
      is_visible: true,
    };

    const saved = await createReview(review);
    return NextResponse.json({ review: saved });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
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
