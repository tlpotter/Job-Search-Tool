import { cookies } from "next/headers";
import { readSessionToken, AUTH_COOKIE_NAME, type Session } from "./auth";

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return readSessionToken(token);
}

export async function requireOwner(): Promise<Session | Response> {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner") {
    return Response.json({ error: "Demo accounts are read-only" }, { status: 403 });
  }
  return session;
}

export async function requireAuth(): Promise<Session | Response> {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return session;
}
