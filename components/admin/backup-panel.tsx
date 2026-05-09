"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  History,
  Lock,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface BackupInfo {
  filename: string;
  createdAt: string;
  sizeBytes: number;
  isPreRestore: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatTRDateTime(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} saat önce`;
  const day = Math.floor(hr / 24);
  return `${day} gün önce`;
}

export function BackupPanel() {
  const router = useRouter();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Restore modal state
  const [restoreTarget, setRestoreTarget] = useState<BackupInfo | null>(null);
  const [restorePassword, setRestorePassword] = useState("");
  const [restoring, setRestoring] = useState(false);

  async function loadBackups() {
    setLoading(true);
    try {
      const res = await fetch("/api/backup");
      if (res.status === 401) {
        toast({
          variant: "error",
          title: "Oturum süresi doldu",
        });
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setBackups(data);
      }
    } catch (e) {
      toast({
        variant: "error",
        title: "Yedekler yüklenemedi",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBackups();
  }, []);

  async function handleCreateBackup() {
    setCreating(true);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Oluşturulamadı");
      toast({
        variant: "success",
        title: "Yedek oluşturuldu",
        description: data.backup?.filename,
      });
      await loadBackups();
    } catch (e) {
      toast({
        variant: "error",
        title: "Yedek alınamadı",
        description: e instanceof Error ? e.message : "Hata",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(b: BackupInfo) {
    if (
      !confirm(
        `"${b.filename}" yedeğini silmek istediğinizden emin misiniz?\n\nSilinen yedek geri alınamaz.`
      )
    )
      return;

    setBusy(b.filename);
    try {
      const res = await fetch(
        `/api/backup/${encodeURIComponent(b.filename)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Silinemedi");
      toast({ variant: "info", title: "Yedek silindi" });
      setBackups((prev) => prev.filter((x) => x.filename !== b.filename));
    } catch (e) {
      toast({
        variant: "error",
        title: "Silinemedi",
        description: e instanceof Error ? e.message : "Hata",
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore() {
    if (!restoreTarget) return;
    if (restorePassword.length < 6) {
      toast({
        variant: "error",
        title: "Şifre eksik",
        description: "Devam etmek için mevcut şifrenizi girin.",
      });
      return;
    }

    setRestoring(true);
    try {
      const res = await fetch(
        `/api/backup/${encodeURIComponent(restoreTarget.filename)}/restore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: restorePassword }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Geri yüklenemedi");

      toast({
        variant: "success",
        title: "Veritabanı geri yüklendi",
        description: `Eski hali "${data.preRestoreSnapshot}" olarak saklandı.`,
      });
      setRestoreTarget(null);
      setRestorePassword("");

      // Sayfayı yenile — yeni veriler göstersin
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      toast({
        variant: "error",
        title: "Geri yükleme başarısız",
        description: e instanceof Error ? e.message : "Hata",
      });
    } finally {
      setRestoring(false);
    }
  }

  const regularBackups = backups.filter((b) => !b.isPreRestore);
  const preRestoreBackups = backups.filter((b) => b.isPreRestore);

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Database className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Veri Yedekleme & Geri Yükleme
              </h2>
              <p className="text-sm text-slate-600">
                Her gün gece yarısı otomatik yedek alınır (son 30 gün saklanır).
                Veri kaybı durumunda buradan geri yükleyebilirsiniz.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadBackups}
              disabled={loading}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              />
              Yenile
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateBackup}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Şimdi Yedek Al
            </Button>
          </div>
        </div>

        {/* Restore confirmation modal */}
        {restoreTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle className="h-5 w-5 text-amber-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Veritabanını geri yüklemek istediğinizden emin misiniz?
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    <strong className="text-slate-900">
                      {restoreTarget.filename}
                    </strong>{" "}
                    ({formatTRDateTime(restoreTarget.createdAt)}) yedeği ana
                    veritabanına yüklenecek. Mevcut DB önce{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                      pre-restore-...
                    </code>{" "}
                    olarak yedeklenir, böylece yanlış yedeği seçerseniz
                    geri dönebilirsiniz.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="restore-password"
                  className="text-sm font-medium text-slate-900"
                >
                  Onaylamak için şifrenizi girin
                </label>
                <Input
                  id="restore-password"
                  type="password"
                  className="mt-1.5"
                  placeholder="Mevcut admin şifresi"
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  onClick={handleRestore}
                  disabled={restoring || restorePassword.length < 6}
                >
                  {restoring ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Onayla & Geri Yükle
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRestoreTarget(null);
                    setRestorePassword("");
                  }}
                  disabled={restoring}
                >
                  Vazgeç
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading && backups.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Yedekler yükleniyor…
          </div>
        ) : backups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/40 p-8 text-center">
            <Database className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              Henüz yedek alınmamış
            </p>
            <p className="mt-1 text-xs text-slate-500">
              "Şimdi Yedek Al" ile manuel yedek oluşturabilir veya
              gece yarısını bekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <>
            {/* Düzenli yedekler */}
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                Yedekler ({regularBackups.length})
              </div>
              <div className="overflow-hidden rounded-lg border border-emerald-100">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-50/50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <th className="px-4 py-2.5">Dosya</th>
                      <th className="px-4 py-2.5">Tarih</th>
                      <th className="px-4 py-2.5">Boyut</th>
                      <th className="px-4 py-2.5">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    {regularBackups.map((b) => (
                      <tr key={b.filename} className="bg-white">
                        <td className="px-4 py-2.5">
                          <code className="font-mono text-xs text-slate-700">
                            {b.filename}
                          </code>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-700">
                          <div className="font-medium">
                            {formatTRDateTime(b.createdAt)}
                          </div>
                          <div className="text-slate-500">
                            {relativeTime(b.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-700">
                          {formatBytes(b.sizeBytes)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setRestoreTarget(b)}
                            >
                              <Download className="h-3 w-3" />
                              Geri Yükle
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(b)}
                              disabled={busy === b.filename}
                              className="text-red-700"
                            >
                              {busy === b.filename ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pre-restore snapshot'lar */}
            {preRestoreBackups.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <History className="h-3 w-3" />
                  Geri Yükleme Öncesi Snapshot'lar (
                  {preRestoreBackups.length})
                </div>
                <p className="mb-2 text-xs text-slate-500">
                  Her geri yükleme öncesi mevcut DB otomatik bu listeye eklenir.
                  Yanlış yedek seçildiyse buradan geri dönebilirsiniz.
                </p>
                <div className="overflow-hidden rounded-lg border border-amber-100">
                  <table className="w-full text-sm">
                    <thead className="bg-amber-50/50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        <th className="px-4 py-2.5">Snapshot</th>
                        <th className="px-4 py-2.5">Tarih</th>
                        <th className="px-4 py-2.5">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {preRestoreBackups.map((b) => (
                        <tr key={b.filename} className="bg-white">
                          <td className="px-4 py-2.5">
                            <Badge variant="warning">Pre-restore</Badge>
                            <code className="ml-2 font-mono text-xs text-slate-700">
                              {b.filename}
                            </code>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-700">
                            {formatTRDateTime(b.createdAt)}
                          </td>
                          <td className="px-4 py-2.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRestoreTarget(b)}
                            >
                              <Download className="h-3 w-3" />
                              Bu Snapshot'a Dön
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <strong className="text-slate-900">Konum:</strong>{" "}
          <code className="font-mono">prisma/backups/</code>{" "}
          klasörüne kaydedilir. Sunucu dosyalarınızı periyodik olarak harici
          bir konuma da yedeklemenizi öneririz (rsync, S3, Drive vs.).
        </div>
      </CardContent>
    </Card>
  );
}
