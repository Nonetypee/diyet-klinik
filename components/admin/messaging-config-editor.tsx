"use client";

import { useEffect, useState } from "react";
import {
  MessageSquareText,
  Loader2,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type Provider = "MOCK" | "WHATSAPP" | "NETGSM" | "MUTLUCELL";

interface MaskedConfig {
  primary: Provider;
  fallback: Provider | null;
  whatsapp: {
    phoneNumberId: string;
    apiVersion: string;
    accessTokenSet: boolean;
  };
  netgsm: {
    userCode: string;
    header: string;
    passwordSet: boolean;
  };
  mutlucell: {
    username: string;
    orgn: string;
    passwordSet: boolean;
  };
  lastTest: {
    at: string | null;
    status: string | null;
    channel: string | null;
    error: string | null;
  };
}

const PROVIDER_LABELS: Record<Provider, string> = {
  MOCK: "Mock (geliştirme — gerçek mesaj göndermez)",
  WHATSAPP: "WhatsApp Cloud API (önerilen, ~0.65 TL)",
  NETGSM: "Netgsm SMS (~1.50 TL)",
  MUTLUCELL: "Mutlucell SMS",
};

export function MessagingConfigEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<MaskedConfig | null>(null);

  // Form state
  const [primary, setPrimary] = useState<Provider>("MOCK");
  const [fallback, setFallback] = useState<Provider | "">("");

  // WhatsApp
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappApiVersion, setWhatsappApiVersion] = useState("v22.0");
  const [showWhatsappToken, setShowWhatsappToken] = useState(false);

  // Netgsm
  const [netgsmUser, setNetgsmUser] = useState("");
  const [netgsmPass, setNetgsmPass] = useState("");
  const [netgsmHeader, setNetgsmHeader] = useState("");
  const [showNetgsmPass, setShowNetgsmPass] = useState(false);

  // Mutlucell
  const [mutluUser, setMutluUser] = useState("");
  const [mutluPass, setMutluPass] = useState("");
  const [mutluOrgn, setMutluOrgn] = useState("");
  const [showMutluPass, setShowMutluPass] = useState(false);

  // Test
  const [testPhone, setTestPhone] = useState("");

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/messaging");
      if (res.status === 401) {
        toast({ variant: "error", title: "Oturum süresi doldu" });
        return;
      }
      const data = (await res.json()) as MaskedConfig;
      setConfig(data);
      setPrimary(data.primary);
      setFallback(data.fallback ?? "");
      setWhatsappPhoneId(data.whatsapp.phoneNumberId);
      setWhatsappApiVersion(data.whatsapp.apiVersion);
      setNetgsmUser(data.netgsm.userCode);
      setNetgsmHeader(data.netgsm.header);
      setMutluUser(data.mutlucell.username);
      setMutluOrgn(data.mutlucell.orgn);
      // Şifre alanlarını boş bırak — kullanıcı değiştirmek isterse doldurur
      setWhatsappToken("");
      setNetgsmPass("");
      setMutluPass("");
    } catch (e) {
      toast({
        variant: "error",
        title: "Yapılandırma yüklenemedi",
        description: e instanceof Error ? e.message : "Hata",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, string | undefined> = {
        primary,
        fallback: fallback || undefined,
        whatsappPhoneNumberId: whatsappPhoneId,
        whatsappApiVersion,
        netgsmUserCode: netgsmUser,
        netgsmHeader,
        mutlucellUsername: mutluUser,
        mutlucellOrgn: mutluOrgn,
      };
      // Sırrı SADECE kullanıcı yeniden girdiyse gönder
      if (whatsappToken) payload.whatsappAccessToken = whatsappToken;
      if (netgsmPass) payload.netgsmPassword = netgsmPass;
      if (mutluPass) payload.mutlucellPassword = mutluPass;

      const res = await fetch("/api/settings/messaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Kaydedilemedi");

      toast({
        variant: "success",
        title: "Yapılandırma kaydedildi",
        description: "Değişiklikler anında geçerli — sunucu yeniden başlatılmasına gerek yok.",
      });
      // Reload to reset password fields & get latest masking
      await loadConfig();
    } catch (e) {
      toast({
        variant: "error",
        title: "Kaydedilemedi",
        description: e instanceof Error ? e.message : "Hata",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (testPhone.length < 10) {
      toast({
        variant: "error",
        title: "Telefon numarası girin",
        description: "Test mesajı için geçerli bir cep telefonu gerekli.",
      });
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/settings/messaging/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testPhone }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          variant: "success",
          title: "Test mesajı gönderildi",
          description: `Kanal: ${data.channel ?? "MOCK"}${
            data.messageId ? ` · ID: ${data.messageId}` : ""
          }`,
        });
      } else {
        toast({
          variant: "error",
          title: "Test başarısız",
          description: data.error ?? "Bilinmeyen hata",
        });
      }
      // Yenile — son test sonucu DB'ye yazıldı
      await loadConfig();
    } catch (e) {
      toast({
        variant: "error",
        title: "Test gönderilemedi",
        description: e instanceof Error ? e.message : "Hata",
      });
    } finally {
      setTesting(false);
    }
  }

  if (loading && !config) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <MessageSquareText className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-900">
                Mesajlaşma Sağlayıcı Yapılandırması
              </h2>
              <p className="text-sm text-slate-600">
                Token ve şifreler veritabanında şifrelenerek (AES-256-GCM)
                saklanır. <strong>.env dosyasına dokunmaya gerek yok</strong> —
                buradaki değişiklikler anında geçerli olur.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadConfig}
              disabled={loading}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              />
              Yenile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Provider seçimi */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="text-sm font-semibold text-slate-900">
            Sağlayıcı Seçimi
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Birincil Sağlayıcı</Label>
              <Select
                value={primary}
                onValueChange={(v) => setPrimary(v as Provider)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PROVIDER_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Yedek (Fallback) Sağlayıcı</Label>
              <Select
                value={fallback || "none"}
                onValueChange={(v) =>
                  setFallback(v === "none" ? "" : (v as Provider))
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Yok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Yok</SelectItem>
                  {(Object.keys(PROVIDER_LABELS) as Provider[])
                    .filter((p) => p !== "MOCK")
                    .map((p) => (
                      <SelectItem key={p} value={p}>
                        {PROVIDER_LABELS[p]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-slate-500">
                Birincil başarısız olursa otomatik denenir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              WhatsApp Cloud API
            </h3>
            {config?.whatsapp.accessTokenSet ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Token ayarlı
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                <AlertCircle className="h-3 w-3" /> Token yok
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Phone Number ID</Label>
              <Input
                className="mt-1.5 font-mono"
                placeholder="örn: 123456789012345"
                value={whatsappPhoneId}
                onChange={(e) => setWhatsappPhoneId(e.target.value)}
              />
            </div>
            <div>
              <Label>API Version</Label>
              <Input
                className="mt-1.5"
                placeholder="v22.0"
                value={whatsappApiVersion}
                onChange={(e) => setWhatsappApiVersion(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Access Token</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showWhatsappToken ? "text" : "password"}
                  className="pr-10 font-mono"
                  placeholder={
                    config?.whatsapp.accessTokenSet
                      ? "Değiştirmek istemiyorsanız boş bırakın"
                      : "EAABs..."
                  }
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowWhatsappToken((s) => !s)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showWhatsappToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Meta Business Manager → WhatsApp → API Setup'tan alın.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Netgsm */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Netgsm SMS</h3>
            {config?.netgsm.passwordSet ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Şifre ayarlı
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                Yapılandırılmamış
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Kullanıcı Kodu</Label>
              <Input
                className="mt-1.5"
                placeholder="örn: 8501234567"
                value={netgsmUser}
                onChange={(e) => setNetgsmUser(e.target.value)}
              />
            </div>
            <div>
              <Label>Gönderici Başlığı</Label>
              <Input
                className="mt-1.5"
                placeholder="örn: BESLENME"
                value={netgsmHeader}
                onChange={(e) => setNetgsmHeader(e.target.value)}
              />
            </div>
            <div>
              <Label>Şifre</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showNetgsmPass ? "text" : "password"}
                  className="pr-10"
                  placeholder={
                    config?.netgsm.passwordSet
                      ? "Değiştirmek istemiyorsanız boş bırakın"
                      : "Netgsm API şifreniz"
                  }
                  value={netgsmPass}
                  onChange={(e) => setNetgsmPass(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNetgsmPass((s) => !s)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showNetgsmPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mutlucell */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Mutlucell SMS
            </h3>
            {config?.mutlucell.passwordSet ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Şifre ayarlı
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                Yapılandırılmamış
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Kullanıcı Adı</Label>
              <Input
                className="mt-1.5"
                value={mutluUser}
                onChange={(e) => setMutluUser(e.target.value)}
              />
            </div>
            <div>
              <Label>Gönderici (orgn)</Label>
              <Input
                className="mt-1.5"
                placeholder="örn: KLINIKAD"
                value={mutluOrgn}
                onChange={(e) => setMutluOrgn(e.target.value)}
              />
            </div>
            <div>
              <Label>Şifre</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showMutluPass ? "text" : "password"}
                  className="pr-10"
                  placeholder={
                    config?.mutlucell.passwordSet
                      ? "Değiştirmek istemiyorsanız boş bırakın"
                      : "Mutlucell şifreniz"
                  }
                  value={mutluPass}
                  onChange={(e) => setMutluPass(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowMutluPass((s) => !s)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showMutluPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save + Test */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Yapılandırmayı Kaydet
            </Button>
            <span className="text-xs text-slate-500">
              Sırrı boş bırakırsanız mevcut değer korunur.
            </span>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Test Mesajı Gönder
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Mevcut yapılandırma ile bir test mesajı gönderir. Önce
              yapılandırmanızı kaydetmeyi unutmayın.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[200px]">
                <Label>Test Telefonu (kendi numaranız)</Label>
                <Input
                  className="mt-1.5"
                  type="tel"
                  placeholder="0 5xx xxx xx xx"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || testPhone.length < 10}
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Test Mesajı Gönder
              </Button>
            </div>

            {config?.lastTest.at && (
              <div
                className={cn(
                  "mt-3 rounded-lg border p-3 text-xs",
                  config.lastTest.status === "OK"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-red-200 bg-red-50 text-red-900"
                )}
              >
                <div className="flex items-center gap-2">
                  {config.lastTest.status === "OK" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <strong>
                    Son test:{" "}
                    {config.lastTest.status === "OK" ? "Başarılı" : "Başarısız"}
                  </strong>
                  <span className="text-slate-500">
                    ({new Date(config.lastTest.at).toLocaleString("tr-TR")})
                  </span>
                </div>
                {config.lastTest.channel && (
                  <div className="mt-1">
                    Kanal:{" "}
                    <code className="font-mono">{config.lastTest.channel}</code>
                  </div>
                )}
                {config.lastTest.error && (
                  <div className="mt-1">Hata: {config.lastTest.error}</div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
