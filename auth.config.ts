import type { NextAuthConfig } from "next-auth";

/**
 * Auth.js v5 — paylaşılan yapılandırma
 *
 * Bu dosya middleware tarafından da kullanıldığı için
 * Edge runtime ile uyumlu olmak zorunda — Prisma ve bcrypt
 * gibi Node-only bağımlılıkları içermez. Bunlar `auth.ts`'de.
 *
 * Session süresi:
 *   - Varsayılan: 4 saat (admin paneli için makul güvenlik)
 *   - "Remember me" işaretliyse: 7 gün
 *
 * Bu süreler boyunca kullanıcı /admin'e doğrudan girebilir
 * (yeni şifre/2FA istemez). Yani "kısa süre önce giriş yaptım"
 * durumunda redirect yaşanmaması beklenen davranıştır, bug değil.
 */

const FOUR_HOURS = 60 * 60 * 4;
const SEVEN_DAYS = 60 * 60 * 24 * 7;

/**
 * NEXTAUTH_URL/AUTH_URL localhost iken Auth.js isteği rewrite eder; nextUrl.origin
 * o zaman yanlış olur. Redirect'ler gerçek ziyaretçi host'unu proxy header'larından alır.
 */
function publicOriginFromRequest(request: Request): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return new URL(request.url).origin;
  }
  let proto = request.headers.get("x-forwarded-proto");
  if (!proto) {
    proto =
      host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https";
  }
  proto = proto.replace(/:$/, "");
  return `${proto}://${host}`;
}

export const authConfig = {
  /**
   * AWS Amplify / reverse proxy arkasında üretimde zorunlu.
   * AUTH_URL veya VERCEL tanımlı değilse Auth.js varsayılanı trustHost=false olur ve
   * "UntrustedHost" ile oturum / credentials akışı kırılır.
   */
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: FOUR_HOURS,
    updateAge: 60 * 30, // 30 dk'da bir cookie'yi yenile (kullanım varsa)
  },
  jwt: {
    maxAge: FOUR_HOURS,
  },
  providers: [], // Asıl provider'lar auth.ts'de
  callbacks: {
    authorized({ auth, request }) {
      const nextUrl = request.nextUrl;
      const origin = publicOriginFromRequest(request);
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isLoginPage = nextUrl.pathname === "/login";

      if (isLoginPage) {
        // Zaten giriş yapmışsa dashboard'a yönlendir
        if (isLoggedIn) {
          return Response.redirect(new URL("/admin", origin));
        }
        return true;
      }

      if (isAdminRoute) {
        if (!isLoggedIn) {
          // İstenen URL'i `from` parametresi olarak iletelim ki giriş sonrası
          // o sayfaya dönülsün.
          const loginUrl = new URL("/login", origin);
          loginUrl.searchParams.set("from", nextUrl.pathname + nextUrl.search);
          return Response.redirect(loginUrl);
        }
        return true;
      }

      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role?: string }).role ?? "SECRETARY";
      }
      // session.update() çağrıldığında token'ı güncelle (2FA sonrası vb.)
      if (trigger === "update" && session) {
        return { ...token, ...session };
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

// Diğer dosyalardan referans için
export const SESSION_DURATION = {
  default: FOUR_HOURS,
  rememberMe: SEVEN_DAYS,
} as const;
