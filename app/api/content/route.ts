import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-session";
import {
  createResource,
  deleteResource,
  getSettingValue,
  listResource,
  updateResource,
} from "@/lib/content-repository";
import { createId } from "@/lib/utils";
import { handleApiError } from "@/lib/error-handler";
import { rateLimit } from "@/lib/rate-limit";
import { contentPayloadSchema, contentResourceSchema } from "@/lib/validation";

function getResource(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource");

  if (!resource) {
    return null;
  }

  const validationResult = contentResourceSchema.safeParse(resource);
  if (!validationResult.success) {
    return null;
  }

  return validationResult.data;
}

async function requireAdmin() {
  const session = await getAdminSession();
  return Boolean(session);
}

export async function GET(request: Request) {
  const resource = getResource(request);
  if (!resource) {
    return NextResponse.json({ error: "Invalid resource." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);

  if (resource === "settings" && searchParams.get("key")) {
    const value = await getSettingValue(searchParams.get("key") ?? "");
    return NextResponse.json({ value });
  }

  const items = await listResource(resource);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check request size limit (1MB)
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
    return NextResponse.json(
      { error: "Request body too large. Maximum size is 1MB." },
      { status: 413 }
    );
  }

  // Rate limit: 1000 requests per minute for authenticated users
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimitResult = rateLimit(ip, 1000, 60 * 1000);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "1000",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
        },
      }
    );
  }

  const resource = getResource(request);
  if (!resource) {
    return NextResponse.json({ error: "Invalid resource." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validationResult = contentPayloadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const payload = validatedData.payload ?? {};
    const now = new Date().toISOString();

    const item = await createResource(resource, {
      ...payload,
      id: String(payload.id ?? createId(resource.slice(0, -1))),
      updated_at: resource === "site_content" || resource === "settings" ? now : undefined,
      created_at:
        resource === "skills" || resource === "experience" || resource === "projects"
          ? String(payload.created_at ?? now)
          : undefined,
    } as never);

    return NextResponse.json({ item });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check request size limit (1MB)
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
    return NextResponse.json(
      { error: "Request body too large. Maximum size is 1MB." },
      { status: 413 }
    );
  }

  // Rate limit: 1000 requests per minute for authenticated users
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimitResult = rateLimit(ip, 1000, 60 * 1000);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "1000",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
        },
      }
    );
  }

  const resource = getResource(request);
  if (!resource) {
    return NextResponse.json({ error: "Invalid resource." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validationResult = contentPayloadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    if (!validatedData.id) {
      return NextResponse.json({ error: "Missing id." }, { status: 400 });
    }

    const payload = validatedData.payload ?? {};
    const item = await updateResource(resource, validatedData.id, {
      ...payload,
      updated_at: resource === "site_content" || resource === "settings" ? new Date().toISOString() : undefined,
    } as never);

    return NextResponse.json({ item });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 1000 requests per minute for authenticated users
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimitResult = rateLimit(ip, 1000, 60 * 1000);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "1000",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
        },
      }
    );
  }

  const resource = getResource(request);
  if (!resource) {
    return NextResponse.json({ error: "Invalid resource." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  await deleteResource(resource, id);
  return NextResponse.json({ ok: true });
}
