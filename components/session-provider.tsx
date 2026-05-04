"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Role } from "@/lib/auth";

interface ClientSession {
  role: Role;
  email: string;
}

const SessionContext = createContext<ClientSession | null>(null);

export function SessionProvider({ session, children }: { session: ClientSession | null; children: ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): ClientSession | null {
  return useContext(SessionContext);
}

export function useIsDemo(): boolean {
  const session = useContext(SessionContext);
  return session?.role === "demo";
}
