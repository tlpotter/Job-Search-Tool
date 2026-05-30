import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { getSession } from "@/lib/auth-server";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  weight: ["300", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UX Job Crawler",
  description: "Senior & Staff UX / Product Designer roles",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const clientSession = session ? { role: session.role, email: session.email } : null;

  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider session={clientSession}>{children}</SessionProvider>
      </body>
    </html>
  );
}
