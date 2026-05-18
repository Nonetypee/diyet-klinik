import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Production'da küçük güvenlik kazanımı: "X-Powered-By: Next.js" header'ı kaldır
  poweredByHeader: false,

  // Üretimde gzip/brotli sıkıştırma (Nginx zaten yapar ama defansif)
  compress: true,

  // Production source map'leri kapalı — küçük bundle, biraz daha hızlı build
  productionBrowserSourceMaps: false,

  outputFileTracingRoot: path.join(__dirname),
  /** SQLite dosyası ve şema sunucu paketine dahil edilsin (serverless/hosted deploy). */
  outputFileTracingIncludes: {
    "/api/**/*": ["./prisma/**/*"],
    "/admin/**/*": ["./prisma/**/*"],
    "/login": ["./prisma/**/*"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  typedRoutes: true,
};

export default nextConfig;
