"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  Palette,
  Plus,
  Trash2,
  HelpCircle,
  MessagesSquare,
  GripVertical,
  Type,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import type {
  FaqItem,
  HeroTrustSignal,
  HowStep,
  LandingContentValues,
  TrustPillar,
  TrustStat,
} from "@/lib/landing-defaults";

type Section =
  | "colors"
  | "hero"
  | "trust"
  | "services"
  | "how"
  | "booking"
  | "faq"
  | "cta";

const SECTIONS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: "colors", label: "Marka Renkleri", icon: Palette },
  { key: "hero", label: "Hero (Üst Bölüm)", icon: Type },
  { key: "trust", label: "Güven Kartları", icon: Layers },
  { key: "services", label: "Hizmetler Başlığı", icon: Layers },
  { key: "how", label: "Nasıl Çalışır", icon: Layers },
  { key: "booking", label: "Randevu Bölümü", icon: Layers },
  { key: "faq", label: "S.S.S.", icon: HelpCircle },
  { key: "cta", label: "Alt Çağrı (CTA)", icon: MessagesSquare },
];

interface Props {
  initial: LandingContentValues;
}

export function LandingContentEditor({ initial }: Props) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("colors");
  const [form, setForm] = useState<LandingContentValues>(initial);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof LandingContentValues>(
    key: K,
    value: LandingContentValues[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message ?? "Kaydedilemedi");
      }
      toast({
        variant: "success",
        title: "Kaydedildi",
        description: "Anasayfa içerikleri güncellendi.",
      });
      router.refresh();
    } catch (e) {
      toast({
        variant: "error",
        title: "Hata",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <Card>
        <CardContent className="p-2">
          <nav className="flex flex-col gap-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = s.key === section;
              return (
                <button
                  key={s.key}
                  onClick={() => setSection(s.key)}
                  className={
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                    (active
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-slate-700 hover:bg-slate-50")
                  }
                >
                  <Icon className="h-4 w-4" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </CardContent>
      </Card>

      <div>
        <Card>
          <CardContent className="space-y-6 p-6">
            {section === "colors" && (
              <ColorsSection form={form} update={update} />
            )}
            {section === "hero" && <HeroSection form={form} update={update} />}
            {section === "trust" && (
              <TrustSection form={form} update={update} />
            )}
            {section === "services" && (
              <ServicesSection form={form} update={update} />
            )}
            {section === "how" && <HowSection form={form} update={update} />}
            {section === "booking" && (
              <BookingSection form={form} update={update} />
            )}
            {section === "faq" && <FaqSection form={form} update={update} />}
            {section === "cta" && <CtaSection form={form} update={update} />}

            <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t border-slate-100 bg-white/95 px-6 py-3 backdrop-blur">
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
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =============================================================
// SECTIONS
// =============================================================

type UpdateFn = <K extends keyof LandingContentValues>(
  key: K,
  value: LandingContentValues[K]
) => void;

function ColorsSection({
  form,
  update,
}: {
  form: LandingContentValues;
  update: UpdateFn;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Marka Renkleri"
        description="Anasayfa boyunca kullanılan tüm vurgu renklerini buradan yönetin. Değişiklik anında uygulanır."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField
          label="Ana Renk (vurgu)"
          value={form.primaryColor}
          onChange={(v) => update("primaryColor", v)}
        />
        <ColorField
          label="Ana Renk (koyu varyant)"
          value={form.primaryColorDark}
          onChange={(v) => update("primaryColorDark", v)}
        />
        <ColorField
          label="İkinci Vurgu (gradient)"
          value={form.accentColor}
          onChange={(v) => update("accentColor", v)}
        />
        <ColorField
          label="Koyu Arka Plan (CTA)"
          value={form.darkBgColor}
          onChange={(v) => update("darkBgColor", v)}
        />
      </div>
      <PreviewBar form={form} />
    </div>
  );
}

function PreviewBar({ form }: { form: LandingContentValues }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Önizleme
      </div>
      <div className="flex flex-wrap gap-3">
        <Swatch label="Ana" color={form.primaryColor} />
        <Swatch label="Koyu" color={form.primaryColorDark} />
        <Swatch label="Aksan" color={form.accentColor} />
        <Swatch label="BG Koyu" color={form.darkBgColor} />
      </div>
      <div
        className="mt-3 rounded-lg p-4 text-white"
        style={{
          background: `linear-gradient(135deg, ${form.primaryColor}, ${form.accentColor})`,
        }}
      >
        Örnek vurgu metni
      </div>
    </div>
  );
}

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
      <div
        className="h-6 w-6 rounded-md border border-slate-200"
        style={{ backgroundColor: color }}
      />
      <div className="text-xs">
        <div className="font-medium text-slate-900">{label}</div>
        <div className="font-mono text-[10px] text-slate-500">{color}</div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-md border border-slate-200 bg-white p-1"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#047857"
          className="font-mono uppercase"
        />
      </div>
    </div>
  );
}

function HeroSection({
  form,
  update,
}: {
  form: LandingContentValues;
  update: UpdateFn;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Hero (Üst Bölüm)"
        description="Sitenin en üstündeki büyük başlık ve mesaj."
      />

      <Field label="Üst Rozet">
        <Input
          value={form.heroBadge}
          onChange={(e) => update("heroBadge", e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Başlık (1. parça)">
          <Input
            value={form.heroTitlePart1}
            onChange={(e) => update("heroTitlePart1", e.target.value)}
          />
        </Field>
        <Field label="Vurgu kelimesi (renkli)">
          <Input
            value={form.heroTitleAccent}
            onChange={(e) => update("heroTitleAccent", e.target.value)}
          />
        </Field>
        <Field label="Başlık (2. parça)">
          <Input
            value={form.heroTitlePart2}
            onChange={(e) => update("heroTitlePart2", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Alt Açıklama">
        <Textarea
          rows={3}
          value={form.heroSubtitle}
          onChange={(e) => update("heroSubtitle", e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Birincil Buton">
          <Input
            value={form.heroCtaPrimary}
            onChange={(e) => update("heroCtaPrimary", e.target.value)}
          />
        </Field>
        <Field label="İkincil Buton">
          <Input
            value={form.heroCtaSecondary}
            onChange={(e) => update("heroCtaSecondary", e.target.value)}
          />
        </Field>
      </div>

      <SubBlock title="Güven Sinyalleri (rozetler)">
        <Repeater<HeroTrustSignal>
          items={form.heroTrustSignals}
          onChange={(items) => update("heroTrustSignals", items)}
          newItem={() => ({ icon: "ShieldCheck", text: "" })}
          renderItem={(item, onUpdate) => (
            <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
              <Input
                value={item.icon}
                onChange={(e) => onUpdate({ ...item, icon: e.target.value })}
                placeholder="Icon (ShieldCheck)"
              />
              <Input
                value={item.text}
                onChange={(e) => onUpdate({ ...item, text: e.target.value })}
                placeholder="Metin"
              />
            </div>
          )}
          hint="İkon adları Lucide kütüphanesinden: ShieldCheck, Sprout, BadgeCheck, Leaf, Award, HeartPulse, Star"
        />
      </SubBlock>
    </div>
  );
}

function TrustSection({
  form,
  update,
}: {
  form: LandingContentValues;
  update: UpdateFn;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Güven Kartları"
        description="'Neden beni seçmelisiniz' bölümü ve istatistik şeridi."
      />
      <Field label="Üst Rozet">
        <Input
          value={form.trustBadge}
          onChange={(e) => update("trustBadge", e.target.value)}
        />
      </Field>
      <Field label="Başlık (satır kırmak için Enter)">
        <Textarea
          rows={2}
          value={form.trustTitle}
          onChange={(e) => update("trustTitle", e.target.value)}
        />
      </Field>
      <Field label="Alt Açıklama">
        <Textarea
          rows={3}
          value={form.trustSubtitle}
          onChange={(e) => update("trustSubtitle", e.target.value)}
        />
      </Field>

      <SubBlock title="Kartlar (6 önerilir)">
        <Repeater<TrustPillar>
          items={form.trustPillars}
          onChange={(items) => update("trustPillars", items)}
          newItem={() => ({ icon: "FlaskConical", title: "", description: "" })}
          renderItem={(item, onUpdate) => (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
                <Input
                  value={item.icon}
                  onChange={(e) => onUpdate({ ...item, icon: e.target.value })}
                  placeholder="Icon"
                />
                <Input
                  value={item.title}
                  onChange={(e) => onUpdate({ ...item, title: e.target.value })}
                  placeholder="Başlık"
                />
              </div>
              <Textarea
                rows={2}
                value={item.description}
                onChange={(e) =>
                  onUpdate({ ...item, description: e.target.value })
                }
                placeholder="Açıklama"
              />
            </div>
          )}
          hint="Lucide ikonları: FlaskConical, UserCheck, Repeat, Video, MessageCircle, ShieldCheck, Sparkles, HeartPulse, Award"
        />
      </SubBlock>

      <SubBlock title="İstatistik Şeridi (4 önerilir)">
        <Repeater<TrustStat>
          items={form.trustStats}
          onChange={(items) => update("trustStats", items)}
          newItem={() => ["", ""] as TrustStat}
          renderItem={(item, onUpdate) => (
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={item[0]}
                onChange={(e) =>
                  onUpdate([e.target.value, item[1]] as TrustStat)
                }
                placeholder="Değer (örn. 1.500+)"
              />
              <Input
                value={item[1]}
                onChange={(e) =>
                  onUpdate([item[0], e.target.value] as TrustStat)
                }
                placeholder="Etiket (örn. Memnun danışan)"
              />
            </div>
          )}
        />
      </SubBlock>
    </div>
  );
}

function ServicesSection({
  form,
  update,
}: {
  form: LandingContentValues;
  update: UpdateFn;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Hizmetler Bölümü"
        description="Hizmet kartlarının üstündeki başlık. (Hizmetlerin kendisi 'Ayarlar → Hizmetler' sekmesinden yönetilir.)"
      />
      <Field label="Üst Rozet">
        <Input
          value={form.servicesBadge}
          onChange={(e) => update("servicesBadge", e.target.value)}
        />
      </Field>
      <Field label="Başlık">
        <Input
          value={form.servicesTitle}
          onChange={(e) => update("servicesTitle", e.target.value)}
        />
      </Field>
      <Field label="Alt Açıklama">
        <Textarea
          rows={3}
          value={form.servicesSubtitle}
          onChange={(e) => update("servicesSubtitle", e.target.value)}
        />
      </Field>
    </div>
  );
}

function HowSection({
  form,
  update,
}: {
  form: LandingContentValues;
  update: UpdateFn;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Nasıl Çalışır"
        description="Adım adım sürecin gösterildiği 4 kart."
      />
      <Field label="Üst Rozet">
        <Input
          value={form.howBadge}
          onChange={(e) => update("howBadge", e.target.value)}
        />
      </Field>
      <Field label="Başlık">
        <Input
          value={form.howTitle}
          onChange={(e) => update("howTitle", e.target.value)}
        />
      </Field>
      <Field label="Alt Açıklama">
        <Textarea
          rows={2}
          value={form.howSubtitle}
          onChange={(e) => update("howSubtitle", e.target.value)}
        />
      </Field>

      <SubBlock title="Adımlar">
        <Repeater<HowStep>
          items={form.howSteps}
          onChange={(items) => update("howSteps", items)}
          newItem={() => ({
            number: String(form.howSteps.length + 1).padStart(2, "0"),
            icon: "FileText",
            title: "",
            description: "",
          })}
          renderItem={(item, onUpdate) => (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-[100px_160px_1fr]">
                <Input
                  value={item.number}
                  onChange={(e) =>
                    onUpdate({ ...item, number: e.target.value })
                  }
                  placeholder="01"
                />
                <Input
                  value={item.icon}
                  onChange={(e) => onUpdate({ ...item, icon: e.target.value })}
                  placeholder="Icon"
                />
                <Input
                  value={item.title}
                  onChange={(e) => onUpdate({ ...item, title: e.target.value })}
                  placeholder="Başlık"
                />
              </div>
              <Textarea
                rows={2}
                value={item.description}
                onChange={(e) =>
                  onUpdate({ ...item, description: e.target.value })
                }
                placeholder="Açıklama"
              />
            </div>
          )}
          hint="Lucide ikonları: FileText, ShieldCheck, MessageSquareText, CalendarCheck, ClipboardList, PhoneCall"
        />
      </SubBlock>
    </div>
  );
}

function BookingSection({
  form,
  update,
}: {
  form: LandingContentValues;
  update: UpdateFn;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Randevu Bölümü"
        description="Form üstündeki başlık ve açıklama."
      />
      <Field label="Üst Rozet">
        <Input
          value={form.bookingBadge}
          onChange={(e) => update("bookingBadge", e.target.value)}
        />
      </Field>
      <Field label="Başlık">
        <Input
          value={form.bookingTitle}
          onChange={(e) => update("bookingTitle", e.target.value)}
        />
      </Field>
      <Field label="Alt Açıklama">
        <Textarea
          rows={3}
          value={form.bookingSubtitle}
          onChange={(e) => update("bookingSubtitle", e.target.value)}
        />
      </Field>
    </div>
  );
}

function FaqSection({
  form,
  update,
}: {
  form: LandingContentValues;
  update: UpdateFn;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Sıkça Sorulan Sorular"
        description="İstediğin kadar soru-cevap ekleyebilirsin."
      />
      <Field label="Üst Rozet">
        <Input
          value={form.faqBadge}
          onChange={(e) => update("faqBadge", e.target.value)}
        />
      </Field>
      <Field label="Başlık">
        <Input
          value={form.faqTitle}
          onChange={(e) => update("faqTitle", e.target.value)}
        />
      </Field>

      <SubBlock title="Sorular">
        <Repeater<FaqItem>
          items={form.faqItems}
          onChange={(items) => update("faqItems", items)}
          newItem={() => ({ q: "", a: "" })}
          renderItem={(item, onUpdate) => (
            <div className="space-y-2">
              <Input
                value={item.q}
                onChange={(e) => onUpdate({ ...item, q: e.target.value })}
                placeholder="Soru"
              />
              <Textarea
                rows={3}
                value={item.a}
                onChange={(e) => onUpdate({ ...item, a: e.target.value })}
                placeholder="Cevap"
              />
            </div>
          )}
        />
      </SubBlock>
    </div>
  );
}

function CtaSection({
  form,
  update,
}: {
  form: LandingContentValues;
  update: UpdateFn;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Alt Çağrı (CTA)"
        description="Sayfanın altındaki koyu yeşil bant."
      />
      <Field label="Başlık (Enter ile satır kır)">
        <Textarea
          rows={2}
          value={form.ctaTitle}
          onChange={(e) => update("ctaTitle", e.target.value)}
        />
      </Field>
      <Field label="Alt Açıklama">
        <Textarea
          rows={3}
          value={form.ctaSubtitle}
          onChange={(e) => update("ctaSubtitle", e.target.value)}
        />
      </Field>
      <Field label="Birincil Buton">
        <Input
          value={form.ctaPrimary}
          onChange={(e) => update("ctaPrimary", e.target.value)}
        />
      </Field>
    </div>
  );
}

// =============================================================
// Repeater (ortak listeleri düzenleme bileşeni)
// =============================================================

function Repeater<T>({
  items,
  onChange,
  newItem,
  renderItem,
  hint,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  renderItem: (item: T, onUpdate: (next: T) => void) => React.ReactNode;
  hint?: string;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [taken] = next.splice(from, 1);
    next.splice(to, 0, taken);
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="relative rounded-xl border border-slate-200 bg-slate-50/40 p-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                title="Yukarı taşı"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <span className="text-center text-[10px] font-semibold text-slate-400">
                {i + 1}
              </span>
            </div>
            <div className="flex-1">
              {renderItem(item, (next) => {
                const copy = [...items];
                copy[i] = next;
                onChange(copy);
              })}
            </div>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-red-500 hover:text-red-700"
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {items.length > 1 && (
            <div className="mt-2 flex justify-end gap-1 text-xs">
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                className="rounded px-2 py-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              >
                ↑ Yukarı
              </button>
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === items.length - 1}
                className="rounded px-2 py-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              >
                ↓ Aşağı
              </button>
            </div>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, newItem()])}
      >
        <Plus className="h-4 w-4" />
        Yeni Ekle
      </Button>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// =============================================================
// Helpers
// =============================================================

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-3">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}

function SubBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-2 block text-sm font-semibold text-slate-900">
        {title}
      </Label>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
