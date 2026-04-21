import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-session";
import {
  createResource,
  deleteResource,
  getSettingValue,
  listResource,
  updateResource,
} from "@/lib/content-repository";
import type { ContentResource } from "@/lib/types";
import { createId } from "@/lib/utils";

const allowedResources: ContentResource[] = [
  "site_content",
  "skills",
  "experience",
  "projects",
  "settings",
];

function getResource(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") as ContentResource | null;

  if (!resource || !allowedResources.includes(resource)) {
    return null;
  }

  return resource;
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

  const resource = getResource(request);
  if (!resource) {
    return NextResponse.json({ error: "Invalid resource." }, { status: 400 });
  }

  const body = (await request.json()) as { payload?: Record<string, unknown> };
  const payload = body.payload ?? {};
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
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resource = getResource(request);
  if (!resource) {
    return NextResponse.json({ error: "Invalid resource." }, { status: 400 });
  }

  const body = (await request.json()) as { id?: string; payload?: Record<string, unknown> };
  if (!body.id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const item = await updateResource(resource, body.id, {
    ...(body.payload ?? {}),
    updated_at: resource === "site_content" || resource === "settings" ? new Date().toISOString() : undefined,
  } as never);

  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
