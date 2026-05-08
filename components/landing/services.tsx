import {
  Scale,
  Dumbbell,
  Apple,
  Heart,
  Activity,
  Leaf,
  Video,
  Sprout,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { DIETITIAN_SERVICES } from "@/lib/services-config";

// Lucide ismi → import edilen icon eşleşmesi
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Scale,
  Dumbbell,
  Apple,
  Heart,
  Activity,
  Leaf,
  Video,
  Sprout,
};

export function Services() {
  return (
    <section id="hizmetler" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
              Hizmetlerim
            </span>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Her hedef için, kişiye özel bir plan.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Kilo yönetiminden sporcu beslenmesine, hamilelik dönemine ve
              hastalık bazlı medikal beslenmeye uzanan kapsamlı bir uzmanlık.
            </p>
          </div>
          <Link
            href="#randevu"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800"
          >
            Randevu talebi oluştur
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DIETITIAN_SERVICES.map((s) => {
            const Icon = ICON_MAP[s.iconName] ?? Leaf;
            return (
              <div
                key={s.slug}
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {s.name}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
                  {s.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.shortBenefits.map((b) => (
                    <span
                      key={b}
                      className="inline-flex rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
