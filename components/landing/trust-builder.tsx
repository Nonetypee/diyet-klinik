import {
  FlaskConical,
  UserCheck,
  Repeat,
  Video,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  HeartPulse,
  Award,
  type LucideIcon,
} from "lucide-react";
import type {
  LandingDietician,
  LandingContentValues,
} from "@/lib/landing-data";

const PILLAR_ICON_MAP: Record<string, LucideIcon> = {
  FlaskConical,
  UserCheck,
  Repeat,
  Video,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  HeartPulse,
  Award,
};

interface Props {
  dietician: LandingDietician;
  content: LandingContentValues;
}

export function TrustBuilder({ dietician, content }: Props) {
  // Trust stats DB'de [["1.500+", "Memnun"], ...] — admin değiştirmemişse
  // 2. sütundaki "9 yıl klinik deneyim" satırını runtime'da deneyim yılıyla güncelleyelim
  const stats = content.trustStats.map((row, idx) => {
    if (idx === 1 && dietician.yearsOfExperience && row[1].includes("deneyim")) {
      return [`${dietician.yearsOfExperience} yıl`, row[1]] as const;
    }
    return row;
  });

  return (
    <section
      id="neden-biz"
      className="border-y border-slate-100 bg-white py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium ring-1 ring-emerald-100"
            style={{ color: "var(--brand)" }}
          >
            {content.trustBadge}
          </span>
          <h2 className="mt-5 whitespace-pre-line text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {content.trustTitle}
          </h2>
          <p className="mt-5 text-balance text-lg leading-relaxed text-slate-600">
            {content.trustSubtitle}
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {content.trustPillars.map((p, idx) => {
            const Icon = PILLAR_ICON_MAP[p.icon] ?? ShieldCheck;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-slate-200 bg-white p-7 transition-all hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-100/40"
              >
                <div
                  className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 transition-colors group-hover:bg-emerald-100"
                  style={{ color: "var(--brand)" }}
                >
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* İstatistik şeridi */}
        {stats.length > 0 && (
          <div
            className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-emerald-100 lg:grid-cols-4"
            style={{ borderColor: "var(--brand)", opacity: 1 }}
          >
            {stats.map(([n, l], i) => (
              <div key={i} className="bg-white px-6 py-8 text-center">
                <div
                  className="text-4xl font-semibold tracking-tight"
                  style={{ color: "var(--brand-dark)" }}
                >
                  {n}
                </div>
                <div className="mt-1.5 text-sm text-slate-600">{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
