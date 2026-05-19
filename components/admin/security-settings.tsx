"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldOff,
  Smartphone,
  KeyRound,
  Loader2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface UserData {
  username: string;
  fullName: string;
  totpEnabled: boolean;
  totpVerifiedAt: string | null;
  lastLoginAt: string | null;
  unusedBackupCodes: number;
  totalBackupCodes: number;
}

type SetupPhase = "idle" | "qr" | "verifying" | "showCodes";

export function SecuritySettings({ user }: { user: UserData }) {
  const [phase, setPhase] = useState<SetupPhase>("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [showRegenForm, setShowRegenForm] = useState(false);
  const [regenPassword, setRegenPassword] = useState("");

  async function startSetup() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Kurulum başlatılamadı");
      setQrDataUrl(data.qrDataUrl);
      setSecret(data.secret);
      setPhase("qr");
    } catch (e) {
      toast({
        variant: "error",
        title: "Hata",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    } finally {
      setLoading(false);
    }
  }

  async function verifySetup() {
    if (verifyCode.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Doğrulama başarısız");
      setBackupCodes(data.backupCodes);
      setPhase("showCodes");
      toast({
        variant: "success",
        title: "2FA aktive edildi",
        description: "Yedek kodlarınızı güvenli bir yerde saklayın.",
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "Doğrulama başarısız",
        description: e instanceof Error ? e.message : "Kod hatalı",
      });
    } finally {
      setLoading(false);
    }
  }

  async function disable2FA() {
    if (disablePassword.length < 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Devre dışı bırakılamadı");
      toast({
        variant: "info",
        title: "2FA devre dışı bırakıldı",
        description: "Tekrar etkinleştirmenizi öneririz.",
      });
      window.location.reload();
    } catch (e) {
      toast({
        variant: "error",
        title: "Hata",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    } finally {
      setLoading(false);
      setDisablePassword("");
    }
  }

  async function regenerateBackupCodes() {
    if (regenPassword.length < 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/backup-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: regenPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Yenilenemedi");
      setBackupCodes(data.backupCodes);
      setPhase("showCodes");
      setShowRegenForm(false);
      setRegenPassword("");
      toast({
        variant: "success",
        title: "Yedek kodlar yenilendi",
        description: "Eski kodlar artık geçersiz.",
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "Hata",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({
      variant: "success",
      title: "Panoya kopyalandı",
    });
  }

  function downloadBackupCodes() {
    const text = [
      "Diyet Klinik — 2FA Yedek Kodlar",
      `Kullanıcı: ${user.username}`,
      `Oluşturulma: ${new Date().toLocaleString("tr-TR")}`,
      "",
      "Bu kodları güvenli bir yerde saklayın. Her biri SADECE BİR KEZ kullanılabilir.",
      "Authenticator uygulamanıza erişiminizi kaybederseniz bu kodlardan birini kullanın.",
      "",
      ...backupCodes.map((c, i) => `${i + 1}. ${c}`),
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diyet-klinik-2fa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ------------------------------------------------------------------
  // Backup codes gösterimi (tek seferlik)
  // ------------------------------------------------------------------
  if (phase === "showCodes" && backupCodes.length > 0) {
    return (
      <Card className="border-amber-200">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-amber-900">
                Yedek Kodlarınızı Şimdi Kaydedin
              </div>
              <p className="mt-1 text-amber-800">
                Bu kodlar tek kullanımlıktır ve bir daha gösterilmeyecek.
                Authenticator uygulamanızı kaybederseniz bunlarla giriş
                yapabilirsiniz.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
            {backupCodes.map((code, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-semibold text-slate-900"
              >
                <span>{code}</span>
                <button
                  onClick={() => copyToClipboard(code)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Kopyala"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={downloadBackupCodes}
            >
              <Download className="h-4 w-4" />
              .txt olarak indir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(backupCodes.join("\n"))}
            >
              <Copy className="h-4 w-4" />
              Tümünü kopyala
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPhase("idle");
                setBackupCodes([]);
                window.location.reload();
              }}
              className="ml-auto"
            >
              Kaydettim, devam et
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ------------------------------------------------------------------
  // QR + verify aşaması
  // ------------------------------------------------------------------
  if ((phase === "qr" || phase === "verifying") && qrDataUrl && secret) {
    return (
      <Card>
        <CardContent className="space-y-5 p-6">
          <SectionHeader
            icon={Smartphone}
            title="Authenticator Uygulamasını Bağlayın"
            description="Google Authenticator, Authy, 1Password veya Microsoft Authenticator kullanabilirsiniz."
          />

          <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="2FA QR"
                className="h-56 w-56 rounded-lg border border-emerald-100 bg-white p-2"
              />
            </div>

            <div className="space-y-4">
              <ol className="space-y-2 text-sm text-slate-700">
                <li>
                  <strong className="font-semibold text-slate-900">1.</strong>{" "}
                  Authenticator uygulamanızı açın
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">2.</strong>{" "}
                  "Yeni hesap ekle" / "Add account" → QR tara
                </li>
                <li>
                  <strong className="font-semibold text-slate-900">3.</strong>{" "}
                  6 haneli kodu aşağıya girin
                </li>
              </ol>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-600">
                  QR taranamıyorsa elle gir:
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <code className="break-all font-mono text-xs text-slate-900">
                    {secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(secret)}
                    className="shrink-0 text-slate-500 hover:text-slate-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="verifyCode">Doğrulama Kodu</Label>
                <Input
                  id="verifyCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="mt-1.5 text-center font-mono text-lg tracking-widest"
                  placeholder="123456"
                  value={verifyCode}
                  onChange={(e) =>
                    setVerifyCode(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={verifySetup}
                  disabled={verifyCode.length !== 6 || loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Aktive Et
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPhase("idle");
                    setVerifyCode("");
                    setQrDataUrl(null);
                    setSecret(null);
                  }}
                >
                  İptal
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ------------------------------------------------------------------
  // Ana ekran (idle)
  // ------------------------------------------------------------------
  return (
    <div className="space-y-5">
      {/* 2FA Durum Kartı */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  user.totpEnabled
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                )}
              >
                {user.totpEnabled ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : (
                  <ShieldOff className="h-6 w-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    İki Faktörlü Doğrulama (TOTP)
                  </h2>
                  {user.totpEnabled ? (
                    <Badge variant="success">Aktif</Badge>
                  ) : (
                    <Badge variant="warning">Devre Dışı</Badge>
                  )}
                </div>
                <p className="mt-1 max-w-xl text-sm text-slate-600">
                  {user.totpEnabled
                    ? "Hesabınız iki faktörlü doğrulama ile korunuyor. Her giriş sırasında authenticator kodunuz istenir."
                    : "Şifrenizin yanı sıra telefonunuzdaki authenticator app'inden 6 haneli bir kod istenecektir. Hesabınızın çalınmasını engeller."}
                </p>
                {user.totpVerifiedAt && (
                  <p className="mt-2 text-xs text-slate-500">
                    Aktive edildi:{" "}
                    {new Date(user.totpVerifiedAt).toLocaleString("tr-TR")}
                  </p>
                )}
              </div>
            </div>

            {!user.totpEnabled ? (
              <Button
                variant="primary"
                onClick={startSetup}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                2FA'yı Etkinleştir
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowDisableForm((s) => !s)}
              >
                <ShieldOff className="h-4 w-4" />
                Devre Dışı Bırak
              </Button>
            )}
          </div>

          {showDisableForm && user.totpEnabled && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50/40 p-4">
              <div className="flex items-start gap-2.5 text-sm text-red-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  2FA'yı devre dışı bırakmak hesabınızı zayıflatır. Devam etmek
                  için şifrenizi girin.
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Input
                  type="password"
                  className="max-w-xs"
                  placeholder="Mevcut şifre"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={disable2FA}
                  disabled={disablePassword.length < 6 || loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Onayla & Devre Dışı Bırak
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDisableForm(false);
                    setDisablePassword("");
                  }}
                >
                  İptal
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yedek Kodlar Kartı */}
      {user.totpEnabled && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <SectionHeader
              icon={KeyRound}
              title="Yedek Kodlar"
              description="Telefonunuzu kaybederseniz hesabınıza erişmek için kullanabileceğiniz tek kullanımlık kodlar."
            />

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  user.unusedBackupCodes > 2
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                )}
              >
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">
                  {user.unusedBackupCodes} / {user.totalBackupCodes} kod
                  kullanılabilir
                </div>
                <div className="text-xs text-slate-600">
                  {user.unusedBackupCodes <= 2
                    ? "⚠ Az kod kaldı, yenilemeniz önerilir"
                    : "Sağlıklı durumda"}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRegenForm((s) => !s)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Yenile
              </Button>
            </div>

            {showRegenForm && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-4">
                <div className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <span>
                    Yeni 8 yedek kod üretilecek, eski kodlar geçersiz olacak.
                    Şifrenizi girin:
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Input
                    type="password"
                    className="max-w-xs"
                    placeholder="Mevcut şifre"
                    value={regenPassword}
                    onChange={(e) => setRegenPassword(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={regenerateBackupCodes}
                    disabled={regenPassword.length < 6 || loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Yeni Kod Üret
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowRegenForm(false);
                      setRegenPassword("");
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hesap Bilgisi */}
      <Card>
        <CardContent className="p-6">
          <SectionHeader
            icon={Lock}
            title="Hesap Bilgisi"
            description="Mevcut oturumunuza ait detaylar."
          />
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Kullanıcı Adı</dt>
              <dd className="font-medium text-slate-900">{user.username}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Ad Soyad</dt>
              <dd className="font-medium text-slate-900">{user.fullName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Son giriş</dt>
              <dd className="font-medium text-slate-900">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString("tr-TR")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Oturum süresi</dt>
              <dd className="font-medium text-slate-900">
                4 saat (otomatik yenilenir)
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
        <Icon className="h-5 w-5 text-emerald-700" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}
