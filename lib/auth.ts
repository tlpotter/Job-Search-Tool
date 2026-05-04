export type Role = "owner" | "demo";

export interface Session {
  role: Role;
  email: string;
  iat: number;
}

const COOKIE_NAME = "auth";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET env var is required and must be at least 16 chars");
  }
  return s;
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function b64urlEncode(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
}

async function hmac(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return bufToHex(sig);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ab = hexToBuf(a);
  const bb = hexToBuf(b);
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

export async function createSessionToken(role: Role, email: string): Promise<string> {
  const payload: Session = { role, email, iat: Date.now() };
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = await hmac(body, getSecret());
  return `${body}.${sig}`;
}

export async function readSessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx === -1) return null;
  const body = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  let expected: string;
  try {
    expected = await hmac(body, getSecret());
  } catch {
    return null;
  }
  if (!timingSafeEqualHex(sig, expected)) return null;
  try {
    const data = JSON.parse(b64urlDecode(body));
    if (data.role !== "owner" && data.role !== "demo") return null;
    if (typeof data.email !== "string") return null;
    if (typeof data.iat !== "number") return null;
    if (Date.now() - data.iat > MAX_AGE_SECONDS * 1000) return null;
    return data as Session;
  } catch {
    return null;
  }
}

export function checkCredentials(email: string, password: string): { role: Role; email: string } | null {
  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPassword = process.env.OWNER_PASSWORD;
  const demoEmail = process.env.DEMO_EMAIL;
  const demoPassword = process.env.DEMO_PASSWORD;

  const submittedEmail = email.trim().toLowerCase();

  if (
    ownerEmail &&
    ownerPassword &&
    submittedEmail === ownerEmail.toLowerCase() &&
    constantTimeStringEqual(password, ownerPassword)
  ) {
    return { role: "owner", email: ownerEmail };
  }

  if (
    demoEmail &&
    demoPassword &&
    submittedEmail === demoEmail.toLowerCase() &&
    constantTimeStringEqual(password, demoPassword)
  ) {
    return { role: "demo", email: demoEmail };
  }

  return null;
}

function constantTimeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
