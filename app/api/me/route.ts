import { cookies } from "next/headers";
import { readSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = await readSessionToken(token);
  if (!session) return Response.json({ session: null });
  return Response.json({ session: { role: session.role, email: session.email } });
}
