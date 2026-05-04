import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { checkCredentials, createSessionToken, AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return Response.json({ error: "Email and password required" }, { status: 400 });
  }

  const result = checkCredentials(email, password);
  if (!result) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken(result.role, result.email);
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, authCookieOptions());

  return Response.json({ ok: true, role: result.role });
}
