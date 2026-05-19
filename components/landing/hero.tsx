import Link from "next/link";
import {
  ShieldCheck,
  Sprout,
  Star,
  ArrowRight,
  BadgeCheck,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LandingClinic, LandingDietician } from "@/lib/landing-data";

interface Props {
  clinic: LandingClinic;
  dietician: LandingDietician;
}

export function Hero({ clinic, dietician }: Props) {
  const tagline =
    clinic.tagline ?? "Bilime dayalı, kişiye özel beslenme";

  const experienceBadge = dietician.yearsOfExperience
    ? `${dietician.yearsOfExperience}+ yıl klinik deneyim`
    : "Klinik deneyim";

  const fullDietName = `${dietician.title} ${dietician.fullName}`.trim();

  return (
    <section className="relative overflow-hidden bg-natural-mesh">
      {/* Doğal yumuşak gölgeler */}
      <div className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full bg-emerald-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-teal-100/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-12 lg:py-28">
        {/* Sol Kolon — Mesaj */}
        <div className="lg:col-span-7">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-emerald-800 shadow-sm">
            <Leaf className="h-3.5 w-3.5 text-emerald-600" />
            {tagline}
          </div>

          <h1 className="text-balance text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl lg:text-[68px] lg:leading-[1.05]">
            Sağlıklı yaşam,{" "}
            <span className="bg-gradient-to-r from-emerald-700 to-teal-500 bg-clip-text text-transparent">
              sürdürülebilir
            </span>
            <br />
            beslenme alışkanlığıyla başlar.
          </h1>

          <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-slate-600">
            Yo-yo diyetlerine veda. Yaşam tarzınıza, hedefinize ve
            laboratuvar değerlerinize göre kişiselleştirilmiş, bilim
            temelli bir beslenme planıyla kalıcı sonuçlara birlikte
            ulaşalım.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" variant="primary" className="h-12 px-6 text-base">
              <Link href="#randevu">
                Hemen Randevu Talep Et
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
              <Link href="#hizmetler">Hizmetlerimi İnceleyin</Link>
            </Button>
          </div>

          {/* Mikro güven sinyalleri */}
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>KVKK Uyumlu</span>
            </div>
            <div className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-emerald-600" />
              <span>{experienceBadge}</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
              <span>{dietician.specialty}</span>
            </div>
          </div>
        </div>

        {/* Sağ Kolon — Görsel Kart */}
        <div className="relative lg:col-span-5">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-1 shadow-2xl shadow-emerald-900/5">
            <div className="rounded-[20px] bg-gradient-to-br from-emerald-50/60 to-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-emerald-700">
                    Randevu Talebiniz
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    14 Mayıs Cuma · 14:30
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <BadgeCheck className="h-5 w-5 text-emerald-700" />
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
                  <span className="text-emerald-400">onaylanmıştır</span>.
                  14.05.2026 14:30. Bilgi: {clinic.phone}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="ml-1.5 font-medium text-slate-700">4.9 / 5.0</span>
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
            ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
            : "text-sm font-medium text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}
