import crypto from "node:crypto";

import { cookies } from "next/headers";

const AUTH_COOKIE = "portfolio_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type SessionPayload = {
  email: string;
  issuedAt: number;
};

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "portfolio-preview-secret";
}

function encode(payload: SessionPayload) {
  const serialized = JSON.stringify(payload);
  const base = Buffer.from(serialized).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(base)
    .digest("base64url");
  return `${base}.${signature}`;
}

function decode(raw: string | undefined) {
  if (!raw) {
    return null;
  }

  const [base, signature] = raw.split(".");
  if (!base || !signature) {
    return null;
  }

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(base)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(base, "base64url").toString("utf8")) as SessionPayload;

  if (Date.now() - payload.issuedAt > SESSION_TTL_MS) {
    return null;
  }

  return payload;
}

export function createAdminSession(email: string) {
  return encode({
    email,
    issuedAt: Date.now(),
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(AUTH_COOKIE)?.value;
  return decode(session);
}

export function getAdminCookieName() {
  return AUTH_COOKIE;
}
