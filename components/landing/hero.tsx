import Link from "next/link";
import {
  ShieldCheck,
  Sprout,
  Star,
  ArrowRight,
  BadgeCheck,
  Leaf,
  Award,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  LandingClinic,
  LandingDietician,
  LandingContentValues,
} from "@/lib/landing-data";

interface Props {
  clinic: LandingClinic;
  dietician: LandingDietician;
  content: LandingContentValues;
}

const TRUST_ICON_MAP: Record<string, LucideIcon> = {
  ShieldCheck,
  Sprout,
  BadgeCheck,
  Leaf,
  Award,
  HeartPulse,
  Star,
};

export function Hero({ clinic, dietician, content }: Props) {
  const fullDietName = `${dietician.title} ${dietician.fullName}`.trim();
  const gradientStyle = {
    backgroundImage: `linear-gradient(90deg, var(--brand), var(--brand-accent))`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  return (
    <section className="relative overflow-hidden bg-natural-mesh">
      <div className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full bg-emerald-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-teal-100/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-12 lg:py-28">
        {/* Sol Kolon — Mesaj */}
        <div className="lg:col-span-7">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-[color:var(--brand-dark)] shadow-sm">
            <Leaf className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
            {content.heroBadge}
          </div>

          <h1 className="text-balance text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl lg:text-[68px] lg:leading-[1.05]">
            {content.heroTitlePart1}{" "}
            <span style={gradientStyle}>{content.heroTitleAccent}</span>
            <br />
            {content.heroTitlePart2}
          </h1>

          <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-slate-600">
            {content.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              variant="primary"
              className="h-12 px-6 text-base"
              style={{ backgroundColor: "var(--brand)" }}
            >
              <Link href="#randevu">
                {content.heroCtaPrimary}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
              <Link href="#hizmetler">{content.heroCtaSecondary}</Link>
            </Button>
          </div>

          {/* Güven sinyalleri (admin panelden düzenlenir) */}
          {content.heroTrustSignals.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-600">
              {content.heroTrustSignals.map((signal, idx) => {
                const Icon = TRUST_ICON_MAP[signal.icon] ?? ShieldCheck;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <Icon
                      className="h-5 w-5"
                      style={{ color: "var(--brand)" }}
                    />
                    <span>{signal.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sağ Kolon — Görsel Kart */}
        <div className="relative lg:col-span-5">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-1 shadow-2xl shadow-emerald-900/5">
            <div className="rounded-[20px] bg-gradient-to-br from-emerald-50/60 to-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--brand)" }}
                  >
                    Randevu Talebiniz
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    14 Mayıs Cuma · 14:30
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <BadgeCheck
                    className="h-5 w-5"
                    style={{ color: "var(--brand)" }}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t border-emerald-100/70 pt-5">
                <Row label="Diyetisyen" value={fullDietName} />
                <Row label="Görüşme" value="Kilo Yönetimi (60 dk)" />
                <Row
                  label="Tür"
                  value={
                    clinic.district
                      ? `Yüz Yüze · ${clinic.district}`
                      : "Yüz Yüze"
                  }
                />
                <Row label="Durum" value="Onaylandı" highlight />
              </div>

              <div className="mt-6 rounded-xl bg-slate-900 p-4 text-sm">
                <div className="font-medium text-white">SMS Bildirimi</div>
                <div className="mt-1 text-slate-300">
                  Sayın Danışan, randevunuz{" "}
                  <span style={{ color: "var(--brand-accent)" }}>
                    onaylanmıştır
                  </span>
                  . 14.05.2026 14:30. Bilgi: {clinic.phone}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                  <span className="ml-1.5 font-medium text-slate-700">
                    4.9 / 5.0
                  </span>
                </div>
                <span>1.500+ memnun danışan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span
        className={
          highlight
            ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold"
            : "text-sm font-medium text-slate-900"
        }
        style={highlight ? { color: "var(--brand-dark)" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
