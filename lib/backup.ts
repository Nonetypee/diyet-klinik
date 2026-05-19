import "server-only";
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Yedekleme & Geri Yükleme
 *
 * SQLite'da DB tek bir dosyadır (varsayılan: prisma/dev.db).
 * Yedek = bu dosyanın bir kopyasını `prisma/backups/` altına alır.
 *
 * - createBackup() : anlık yedek oluştur
 * - listBackups()  : mevcut yedekleri listele
 * - restoreBackup(): belirtilen yedekten ana DB'yi geri yükle
 *                    (önce mevcut DB "pre-restore" snapshot'a kopyalanır)
 * - deleteBackup(): tek yedek sil
 * - cleanupOldBackups(keepCount): en eski yedekleri siler
 */

const BACKUP_DIR = path.join(process.cwd(), "prisma", "backups");

/**
 * Prisma'nın kullandığı SQLite dosya yolunu DATABASE_URL'den çözümler.
 * (Sabit prisma/dev.db yalnızca geliştirmede doğru olur; üretimde mutlak yol kullanılır.)
 */
function resolveSqliteDatabasePath(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    return path.join(process.cwd(), "prisma", "dev.db");
  }
  if (!url.startsWith("file:")) {
    throw new Error(
      "Yedekleme yalnızca SQLite ile çalışır (DATABASE_URL file:... olmalı)."
    );
  }

  let filePath = url.slice("file:".length);
  if (filePath.startsWith("//")) {
    filePath = filePath.slice(2);
  }

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  const relative = filePath.replace(/^\.\//, "");
  return path.join(process.cwd(), "prisma", relative);
}

function getDbPath(): string {
  return resolveSqliteDatabasePath();
}
const BACKUP_PREFIX = "backup-";
const PRE_RESTORE_PREFIX = "pre-restore-";
const MAX_BACKUPS_TO_KEEP = 30; // Son 30 günü tut

export interface BackupInfo {
  filename: string;
  /** Backup oluşturulma zamanı (ISO) */
  createdAt: string;
  /** Bytes cinsinden boyut */
  sizeBytes: number;
  /** Pre-restore snapshot mı? (otomatik mi yoksa manuel mi) */
  isPreRestore: boolean;
}

async function ensureBackupDir(): Promise<void> {
  if (!existsSync(BACKUP_DIR)) {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

function timestampForFilename(d = new Date()): string {
  // 2026-05-09T00-15-32Z (dosya adına uygun)
  return d.toISOString().replace(/:/g, "-").replace(/\.\d+/, "");
}

function parseBackupTimestamp(filename: string): Date | null {
  const match = filename.match(
    /^(?:backup|pre-restore)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\.db$/
  );
  if (!match) return null;
  const iso = match[1].replace(/T(\d{2})-(\d{2})-(\d{2})Z/, "T$1:$2:$3.000Z");
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Anlık yedek oluştur. Dosya adı: backup-2026-05-09T00-00-00Z.db
 */
export async function createBackup(
  options: { prefix?: "backup" | "pre-restore" } = {}
): Promise<BackupInfo> {
  await ensureBackupDir();

  const dbPath = getDbPath();

  if (!existsSync(dbPath)) {
    throw new Error(
      `DB dosyası bulunamadı: ${dbPath}. .env içindeki DATABASE_URL ve npx prisma db push çıktısını kontrol edin.`
    );
  }

  const prefix =
    options.prefix === "pre-restore" ? PRE_RESTORE_PREFIX : BACKUP_PREFIX;
  const filename = `${prefix}${timestampForFilename()}.db`;
  const filepath = path.join(BACKUP_DIR, filename);

  await fs.copyFile(dbPath, filepath);

  const stat = await fs.stat(filepath);
  return {
    filename,
    createdAt: stat.mtime.toISOString(),
    sizeBytes: stat.size,
    isPreRestore: prefix === PRE_RESTORE_PREFIX,
  };
}

/**
 * Tüm yedekleri listeler — yeniden eskiye doğru.
 */
export async function listBackups(): Promise<BackupInfo[]> {
  await ensureBackupDir();
  const files = await fs.readdir(BACKUP_DIR);

  const items: BackupInfo[] = [];
  for (const f of files) {
    if (!f.endsWith(".db")) continue;
    const filepath = path.join(BACKUP_DIR, f);
    try {
      const stat = await fs.stat(filepath);
      const timestamp = parseBackupTimestamp(f);
      items.push({
        filename: f,
        createdAt: (timestamp ?? stat.mtime).toISOString(),
        sizeBytes: stat.size,
        isPreRestore: f.startsWith(PRE_RESTORE_PREFIX),
      });
    } catch {
      // skip unreadable
    }
  }

  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * Yedekten geri yükle.
 *
 * Önce mevcut DB'yi "pre-restore-{timestamp}.db" olarak yedekler ki
 * yanlışlıkla geri dönüş yapılırsa bu snapshot ile eski haline alınabilsin.
 */
export async function restoreBackup(filename: string): Promise<{
  restoredFrom: string;
  preRestoreSnapshot: string;
}> {
  await ensureBackupDir();

  if (!/^[a-zA-Z0-9.\-_]+\.db$/.test(filename)) {
    throw new Error("Geçersiz dosya adı");
  }
  const sourcePath = path.join(BACKUP_DIR, filename);
  if (!existsSync(sourcePath)) {
    throw new Error(`Yedek bulunamadı: ${filename}`);
  }

  const dbPath = getDbPath();

  // 1. Mevcut DB'yi pre-restore olarak yedekle (geri-dönüş yolu)
  let preRestoreSnapshot = "";
  if (existsSync(dbPath)) {
    const snap = await createBackup({ prefix: "pre-restore" });
    preRestoreSnapshot = snap.filename;
  }

  // 2. Yedeği ana DB konumuna kopyala
  await fs.copyFile(sourcePath, dbPath);

  return {
    restoredFrom: filename,
    preRestoreSnapshot,
  };
}

export async function deleteBackup(filename: string): Promise<void> {
  if (!/^[a-zA-Z0-9.\-_]+\.db$/.test(filename)) {
    throw new Error("Geçersiz dosya adı");
  }
  const filepath = path.join(BACKUP_DIR, filename);
  if (!existsSync(filepath)) {
    throw new Error("Yedek bulunamadı");
  }
  await fs.unlink(filepath);
}

/**
 * En eski yedekleri silerek son N adedi tutar.
 * Pre-restore snapshot'lar son 5 ile sınırlandırılır (onlar otomatik
 * restore sonrası oluşur, çoğalmasın).
 */
export async function cleanupOldBackups(): Promise<{
  deletedCount: number;
}> {
  const all = await listBackups();
  const regular = all.filter((b) => !b.isPreRestore);
  const preRestore = all.filter((b) => b.isPreRestore);

  let deletedCount = 0;

  // Normal yedekler — son 30
  if (regular.length > MAX_BACKUPS_TO_KEEP) {
    const toDelete = regular.slice(MAX_BACKUPS_TO_KEEP);
    for (const b of toDelete) {
      await deleteBackup(b.filename).catch(() => {});
      deletedCount++;
    }
  }

  // Pre-restore — son 5
  if (preRestore.length > 5) {
    const toDelete = preRestore.slice(5);
    for (const b of toDelete) {
      await deleteBackup(b.filename).catch(() => {});
      deletedCount++;
    }
  }

  return { deletedCount };
}

/**
 * Bugün için bir yedek var mı? (scheduler tarafından kullanılır)
 */
export async function hasBackupForToday(): Promise<boolean> {
  const all = await listBackups();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return all.some(
    (b) => !b.isPreRestore && b.filename.includes(todayKey)
  );
}
