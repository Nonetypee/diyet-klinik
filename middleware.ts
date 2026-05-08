import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Edge-uyumlu middleware: Sadece authConfig'i kullanır
 * (Prisma/bcrypt gibi Node-only modüller içermez).
 *
 * `authorized` callback'i auth.config.ts içinde tanımlandı.
 */
export const { auth: middleware } = NextAuth(authConfig);

export default middleware((_req) => {
  // authorized callback yönetiyor, ekstra logic gerekmez
  return;
});

export const config = {
  // /admin altındaki tüm rotalar + login sayfası
  matcher: ["/admin/:path*", "/login"],
};
