"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * Client tarafında useSession() ve signIn/signOut için sarmalayıcı.
 * Sadece /admin alt ağacında kullanılır — landing page için gerekli değil.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
