/**
 * Next.js Instrumentation Hook
 *
 * Sunucu açıldığında bir kere çalışır. Burada arka plan zamanlayıcıları
 * başlatıyoruz.
 *
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBackupScheduler } = await import("./lib/scheduler");
    startBackupScheduler();
  }
}
