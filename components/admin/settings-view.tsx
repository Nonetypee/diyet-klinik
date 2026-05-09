"use client";

import { useState } from "react";
import {
  Building2,
  User,
  Clock,
  MessageSquareText,
  ListChecks,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { WorkingHoursEditor } from "@/components/admin/working-hours-editor";

interface ClinicData {
  name: string;
  tagline: string | null;
  phone: string;
  email: string;
  whatsapp: string | null;
  address: string;
  city: string;
  district: string;
  kvkkText: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

interface DieticianData {
  fullName: string;
  title: string;
  specialty: string;
  bio: string;
  yearsOfExperience: number | null;
  licenseNumber: string | null;
}

interface ServiceData {
  slug: string;
  name: string;
  durationMin: number;
  isActive: boolean;
  category: string;
}

type TabKey = "clinic" | "dietician" | "hours" | "services" | "messaging" | "kvkk";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "clinic",     label: "Klinik Bilgileri", icon: Building2 },
  { key: "dietician",  label: "Diyetisyen Profili", icon: User },
  { key: "hours",      label: "Çalışma Saatleri", icon: Clock },
  { key: "services",   label: "Hizmetler", icon: ListChecks },
  { key: "messaging",  label: "Mesajlaşma", icon: MessageSquareText },
  { key: "kvkk",       label: "KVKK Metni", icon: ShieldCheck },
];

const DAY_LABELS: Record<string, string> = {
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
  saturday: "Cumartesi",
  sunday: "Pazar",
};

interface MessagingStatus {
  primary: string;
  primaryConfigured: boolean;
  fallback: string | null;
  fallbackConfigured: boolean;
}

export function SettingsView({
  clinic,
  dietician,
  services,
  workingHours,
  messagingStatus,
}: {
  clinic: ClinicData | null;
  dietician: DieticianData | null;
  services: ServiceData[];
  workingHours: Record<string, { open?: string; close?: string; closed?: boolean }>;
  messagingStatus: MessagingStatus;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("clinic");
  const [clinicForm, setClinicForm] = useState<ClinicData | null>(clinic);
  const [dieticianForm, setDieticianForm] = useState<DieticianData | null>(
    dietician
  );
  const [saving, setSaving] = useState(false);

  const handleSaveClinic = async () => {
    if (!clinicForm) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinicForm),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      toast({
        variant: "success",
        title: "Kaydedildi",
        description: "Klinik bilgileri güncellendi.",
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "Hata",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDietician = async () => {
    if (!dieticianForm) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/dietician", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dieticianForm),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      toast({
        variant: "success",
        title: "Kaydedildi",
        description: "Diyetisyen profili güncellendi.",
      });
    } catch (e) {
      toast({
        variant: "error",
        title: "Hata",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Tabs (sol nav) */}
      <Card>
        <CardContent className="p-2">
          <nav className="flex flex-col gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Tab content */}
      <div>
        {activeTab === "clinic" && clinicForm && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <SectionHeader
                icon={Building2}
                title="Klinik Bilgileri"
                description="İletişim bilgileri ve adres."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Klinik Adı" required>
                  <Input
                    value={clinicForm.name}
                    onChange={(e) =>
                      setClinicForm({ ...clinicForm, name: e.target.value })
                    }
                  />
                </Field>
                <Field label="Slogan">
                  <Input
                    value={clinicForm.tagline ?? ""}
                    onChange={(e) =>
                      setClinicForm({ ...clinicForm, tagline: e.target.value })
                    }
                  />
                </Field>
                <Field label="Telefon" required>
                  <Input
                    value={clinicForm.phone}
                    onChange={(e) =>
                      setClinicForm({ ...clinicForm, phone: e.target.value })
                    }
                  />
                </Field>
                <Field label="E-posta" required>
                  <Input
                    type="email"
                    value={clinicForm.email}
                    onChange={(e) =>
                      setClinicForm({ ...clinicForm, email: e.target.value })
                    }
                  />
                </Field>
                <Field label="WhatsApp">
                  <Input
                    value={clinicForm.whatsapp ?? ""}
                    onChange={(e) =>
                      setClinicForm({
                        ...clinicForm,
                        whatsapp: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Şehir / İlçe">
                  <div className="flex gap-2">
                    <Input
                      value={clinicForm.city}
                      onChange={(e) =>
                        setClinicForm({ ...clinicForm, city: e.target.value })
                      }
                      placeholder="İstanbul"
                    />
                    <Input
                      value={clinicForm.district}
                      onChange={(e) =>
                        setClinicForm({
                          ...clinicForm,
                          district: e.target.value,
                        })
                      }
                      placeholder="Kadıköy"
                    />
                  </div>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Adres">
                    <Textarea
                      rows={2}
                      value={clinicForm.address}
                      onChange={(e) =>
                        setClinicForm({
                          ...clinicForm,
                          address: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="SEO Açıklaması">
                    <Textarea
                      rows={2}
                      value={clinicForm.metaDescription ?? ""}
                      onChange={(e) =>
                        setClinicForm({
                          ...clinicForm,
                          metaDescription: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="primary" onClick={handleSaveClinic} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "dietician" && dieticianForm && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <SectionHeader
                icon={User}
                title="Diyetisyen Profili"
                description="Site üzerinde 'Hakkımda' bölümünde gösterilen bilgiler."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ad Soyad" required>
                  <Input
                    value={dieticianForm.fullName}
                    onChange={(e) =>
                      setDieticianForm({
                        ...dieticianForm,
                        fullName: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Ünvan" required>
                  <Input
                    value={dieticianForm.title}
                    onChange={(e) =>
                      setDieticianForm({
                        ...dieticianForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="Dyt."
                  />
                </Field>
                <Field label="Uzmanlık Alanı" required>
                  <Input
                    value={dieticianForm.specialty}
                    onChange={(e) =>
                      setDieticianForm({
                        ...dieticianForm,
                        specialty: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Lisans Numarası">
                  <Input
                    value={dieticianForm.licenseNumber ?? ""}
                    onChange={(e) =>
                      setDieticianForm({
                        ...dieticianForm,
                        licenseNumber: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Deneyim (yıl)">
                  <Input
                    type="number"
                    value={dieticianForm.yearsOfExperience ?? ""}
                    onChange={(e) =>
                      setDieticianForm({
                        ...dieticianForm,
                        yearsOfExperience: e.target.value
                          ? parseInt(e.target.value, 10)
                          : null,
                      })
                    }
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Biyografi">
                    <Textarea
                      rows={5}
                      value={dieticianForm.bio}
                      onChange={(e) =>
                        setDieticianForm({
                          ...dieticianForm,
                          bio: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="primary" onClick={handleSaveDietician} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "hours" && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <SectionHeader
                icon={Clock}
                title="Çalışma Saatleri"
                description="Saatleri değiştirdiğinizde randevu formunda dolu/kapalı saatler otomatik güncellenir."
              />
              <WorkingHoursEditor initialHours={workingHours} />
            </CardContent>
          </Card>
        )}

        {activeTab === "services" && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <SectionHeader
                icon={ListChecks}
                title="Hizmetler"
                description="Aktif hizmet kataloğunuz."
              />
              <div className="overflow-hidden rounded-lg border border-emerald-100">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-50/50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <th className="px-4 py-2.5">Hizmet</th>
                      <th className="px-4 py-2.5">Slug</th>
                      <th className="px-4 py-2.5">Kategori</th>
                      <th className="px-4 py-2.5">Süre</th>
                      <th className="px-4 py-2.5">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    {services.map((s) => (
                      <tr key={s.slug} className="bg-white">
                        <td className="px-4 py-2.5 font-medium text-slate-900">
                          {s.name}
                        </td>
                        <td className="px-4 py-2.5">
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                            {s.slug}
                          </code>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {s.category}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">
                          {s.durationMin} dk
                        </td>
                        <td className="px-4 py-2.5">
                          {s.isActive ? (
                            <Badge variant="success">Aktif</Badge>
                          ) : (
                            <Badge variant="default">Pasif</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "messaging" && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <SectionHeader
                icon={MessageSquareText}
                title="Mesajlaşma Sağlayıcısı"
                description="Onay/red bildirimleri için WhatsApp ve SMS yapılandırması."
              />

              {/* Maliyet karşılaştırma şeridi */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-emerald-700">
                    WhatsApp Cloud API
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-emerald-900">
                    ~0.65 TL
                  </div>
                  <div className="text-xs text-emerald-800">
                    Mesaj başına · Türkiye conversation
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-600">
                    Geleneksel SMS (Netgsm)
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                    ~1.50 TL
                  </div>
                  <div className="text-xs text-slate-600">
                    Mesaj başına · 160 karakter limiti
                  </div>
                </div>
              </div>

              {/* Birincil sağlayıcı */}
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4",
                  messagingStatus.primaryConfigured
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                )}
              >
                {messagingStatus.primaryConfigured ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">
                    Birincil: {messagingStatus.primary}
                  </div>
                  <div className="text-xs text-slate-600">
                    {messagingStatus.primaryConfigured
                      ? messagingStatus.primary === "MOCK"
                        ? "Geliştirme modu — gerçek mesaj gönderilmez, konsola log basılır."
                        : messagingStatus.primary === "WHATSAPP"
                          ? "WhatsApp Cloud API yapılandırması tamam. Template mesajlar gönderilebilir."
                          : "Yapılandırma tamam, mesaj gönderimi aktif."
                      : "Eksik yapılandırma — .env dosyasındaki ilgili değişkenleri doldurun."}
                  </div>
                </div>
              </div>

              {/* Yedek sağlayıcı */}
              {messagingStatus.fallback && (
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4",
                    messagingStatus.fallbackConfigured
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-amber-200 bg-amber-50"
                  )}
                >
                  {messagingStatus.fallbackConfigured ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">
                      Yedek (Fallback): {messagingStatus.fallback}
                    </div>
                    <div className="text-xs text-slate-600">
                      {messagingStatus.fallbackConfigured
                        ? "Birincil başarısız olursa otomatik bu sağlayıcı denenir."
                        : "Yapılandırma eksik — yedek devreye girmeyecek."}
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp Template uyarısı */}
              {messagingStatus.primary === "WHATSAPP" && (
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                    <div className="text-xs text-blue-900">
                      <strong className="font-semibold">
                        WhatsApp Template Onayı Gerekli
                      </strong>
                      <p className="mt-1 leading-relaxed">
                        Meta Business Manager üzerinden aşağıdaki template'leri{" "}
                        onaylatmanız gerekir:
                      </p>
                      <ul className="mt-2 space-y-1 font-mono">
                        <li>
                          •{" "}
                          <code className="rounded bg-white px-1.5 py-0.5">
                            appointment_approved
                          </code>{" "}
                          (kategori: UTILITY, dil: tr)
                        </li>
                        <li>
                          •{" "}
                          <code className="rounded bg-white px-1.5 py-0.5">
                            appointment_rejected
                          </code>{" "}
                          (kategori: UTILITY, dil: tr)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
                <div className="font-semibold text-slate-900">
                  Sağlayıcı yapılandırması (.env):
                </div>
                <pre className="mt-2 overflow-x-auto rounded bg-white p-3 text-[11px] leading-relaxed text-slate-700">
{`# Birincil — WhatsApp önerilir (düşük maliyet)
MESSAGING_PROVIDER=WHATSAPP
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...

# Yedek — WhatsApp başarısız olursa SMS dene
MESSAGING_FALLBACK_PROVIDER=NETGSM
NETGSM_USERCODE=...
NETGSM_PASSWORD=...
NETGSM_HEADER=BESLENME`}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "kvkk" && clinicForm && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <SectionHeader
                icon={ShieldCheck}
                title="KVKK Aydınlatma Metni"
                description="Form ve footer'da gösterilen 6698 sayılı kanun metniniz."
              />
              <Textarea
                rows={10}
                value={clinicForm.kvkkText}
                onChange={(e) =>
                  setClinicForm({ ...clinicForm, kvkkText: e.target.value })
                }
                className="text-sm"
              />
              <div className="flex justify-end">
                <Button variant="primary" onClick={handleSaveClinic} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  KVKK Metnini Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
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
    <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
        <Icon className="h-5 w-5 text-emerald-700" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}
