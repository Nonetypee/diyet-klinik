import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  /** SQLite dosyası ve şema sunucu paketine dahil edilsin (serverless/hosted deploy). */
  outputFileTracingIncludes: {
    "/api/**/*": ["./prisma/**/*"],
    "/admin/**/*": ["./prisma/**/*"],
    "/login": ["./prisma/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  typedRoutes: true,
};

export default nextConfig;
