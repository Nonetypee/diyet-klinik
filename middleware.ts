import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Edge-uyumlu middleware: Sadece authConfig'i kullanır
 * (Prisma/bcrypt gibi Node-only modüller içermez).
 *
 * `authorized` callback'i auth.config.ts içinde tanımlandı.
 *
 * Matcher kapsamı:
 *   - "/admin"            → ana dashboard (path-empty case)
 *   - "/admin/:path*"     → tüm alt rotalar
 *   - "/login"            → giriş yapmışsa /admin'e yönlendir
 */
export const { auth: middleware } = NextAuth(authConfig);

export default middleware((_req) => {
  // authorized callback yönetiyor, ekstra logic gerekmez
  return;
});

export const config = {
  matcher: [
    /*
     * /admin ve tüm alt rotaları yakalar.
     * "/((?!api|_next/static|_next/image|favicon.ico).*)" gibi geniş bir pattern
     * yerine sadece korumalı yolları matchliyoruz — daha performanslı.
     */
    "/admin",
    "/admin/:path*",
    "/login",
  ],
};
