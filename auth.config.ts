import type { NextAuthConfig } from "next-auth";

/**
 * Auth.js v5 — paylaşılan yapılandırma
 *
 * Bu dosya middleware tarafından da kullanıldığı için
 * Edge runtime ile uyumlu olmak zorunda — Prisma ve bcrypt
 * gibi Node-only bağımlılıkları içermez. Bunlar `auth.ts`'de.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 12, // 12 saat
  },
  providers: [], // Asıl provider'lar auth.ts'de
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isLoginPage = nextUrl.pathname === "/login";

      if (isLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/admin", nextUrl));
        }
        return true;
      }

      if (isAdminRoute) {
        if (!isLoggedIn) return false;
        return true;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role?: string }).role ?? "SECRETARY";
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
