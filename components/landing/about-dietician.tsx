import { GraduationCap, Award, BookOpen, Users } from "lucide-react";
import type { LandingDietician } from "@/lib/landing-data";

interface Props {
  dietician: LandingDietician;
}

export function AboutDietician({ dietician }: Props) {
  const fullName = `${dietician.title} ${dietician.fullName}`.trim();
  const initials = dietician.fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const experienceText = dietician.yearsOfExperience
    ? `${dietician.yearsOfExperience} yıllık klinik tecrübe.`
    : "Klinik beslenme alanında deneyim.";

  const HIGHLIGHTS = [
    {
      icon: GraduationCap,
      title: "Uzmanlık",
      description: dietician.specialty,
    },
    {
      icon: Award,
      title: "Lisans No",
      description: dietician.licenseNumber
        ? `T.C. Sağlık Bakanlığı: ${dietician.licenseNumber}`
        : "Lisans bilgisi ayarlardan eklenebilir.",
    },
    {
      icon: BookOpen,
      title: "Yaklaşım",
      description:
        "Kanıta dayalı klinik beslenme protokolleri, kişiye özel takip.",
    },
    {
      icon: Users,
      title: "Deneyim",
      description: experienceText,
    },
  ];

  // Bio'yu paragraflara ayır
  const bioParagraphs = dietician.bio
    .split(/\n{2,}|(?:\r?\n)+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section
      id="hakkimda"
      className="border-t border-slate-100 bg-emerald-50/30 py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-start gap-12 lg:grid-cols-12">
          {/* Sol — Foto Kart */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-100 via-emerald-50 to-white">
                <div className="flex h-full w-full flex-col items-center justify-center p-10 text-center">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white text-4xl font-semibold tracking-tight text-emerald-800 shadow-sm ring-4 ring-emerald-100/60">
                    {initials || "—"}
                  </div>
                  <div className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
                    {fullName}
                  </div>
                  <div className="mt-1 text-sm font-medium text-emerald-800">
                    {dietician.specialty}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ — İçerik */}
          <div className="lg:col-span-7">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
              Hakkımda
            </span>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Merhaba, ben {fullName}.
            </h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-slate-600">
              {bioParagraphs.length > 0 ? (
                bioParagraphs.map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p>{dietician.bio}</p>
              )}
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {HIGHLIGHTS.map((h) => (
                <div
                  key={h.title}
                  className="rounded-2xl border border-emerald-100 bg-white p-5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                      <h.icon className="h-4 w-4 text-emerald-700" />
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {h.title}
                    </div>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                    {h.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
