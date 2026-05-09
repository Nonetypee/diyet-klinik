import "server-only";
import { createBackup, hasBackupForToday, cleanupOldBackups } from "./backup";

/**
 * Arka plan zamanlayıcı.
 *
 * Her saat başı kontrol eder; bugün için yedek yoksa yeni yedek oluşturur.
 * Bu yaklaşım `cron`'a bağımlı olmadan çalışır — Next.js dev sunucusu
 * yeniden başlatılsa bile gün içinde tekrar tekrar kontrol edilir.
 *
 * Ayrıca her gün 03:00'te eski yedekleri (30+) temizler.
 */

const ONE_HOUR_MS = 60 * 60 * 1000;
const SCHEDULER_INTERVAL_MS = ONE_HOUR_MS;

// Module-level singleton — birden fazla başlatmayı engellemek için
let started = false;
let intervalId: NodeJS.Timeout | null = null;

async function runDailyCheck(): Promise<void> {
  try {
    const hasToday = await hasBackupForToday();
    if (!hasToday) {
      const snap = await createBackup();
      console.log(
        `[scheduler] Günlük yedek alındı: ${snap.filename} (${snap.sizeBytes} bytes)`
      );
    }

    // 03:00 civarı eski yedekleri temizle
    const hour = new Date().getHours();
    if (hour === 3) {
      const result = await cleanupOldBackups();
      if (result.deletedCount > 0) {
        console.log(
          `[scheduler] ${result.deletedCount} eski yedek temizlendi`
        );
      }
    }
  } catch (err) {
    console.error("[scheduler] Yedekleme kontrolü başarısız:", err);
  }
}

export function startBackupScheduler(): void {
  if (started) {
    console.log("[scheduler] Zaten çalışıyor, tekrar başlatılmadı");
    return;
  }
  started = true;

  console.log("[scheduler] Yedekleme zamanlayıcı başlatıldı (saatlik kontrol)");

  // Sunucu açıldıktan ~30 saniye sonra ilk kontrol (DB hazır olsun)
  setTimeout(() => {
    runDailyCheck();
  }, 30 * 1000);

  // Saatlik tekrar
  intervalId = setInterval(runDailyCheck, SCHEDULER_INTERVAL_MS);
}

export function stopBackupScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    started = false;
    console.log("[scheduler] Durduruldu");
  }
}
