import { NextResponse } from "next/server";

import { createAdminSession, getAdminCookieName } from "@/lib/admin-session";
import { getSupabaseAuthClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    const client = getSupabaseAuthClient();

    if (!client) {
      return NextResponse.json({ error: "Supabase is not available." }, { status: 500 });
    }

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
  } else {
    const demoEmail = (process.env.DEMO_ADMIN_EMAIL || "jayantdahiya1204@gmail.com").toLowerCase();
    const demoPassword = process.env.DEMO_ADMIN_PASSWORD || "portfolio-preview";

    if (email !== demoEmail || password !== demoPassword) {
      return NextResponse.json(
        { error: "Invalid credentials for local preview mode." },
        { status: 401 },
      );
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: getAdminCookieName(),
    value: createAdminSession(email),
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
