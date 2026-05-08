import { GraduationCap, Award, BookOpen, Users } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: GraduationCap,
    title: "Eğitim",
    description:
      "Hacettepe Üniversitesi Beslenme ve Diyetetik Bölümü mezunu. Klinik beslenme yüksek lisansı.",
  },
  {
    icon: Award,
    title: "Sertifikalar",
    description:
      "Sporcu Beslenmesi, İnsülin Direnci & Diyabet, Obezite ve Mikrobiyota uzmanlık programları.",
  },
  {
    icon: BookOpen,
    title: "Yayınlar",
    description:
      "Türkiye Diyetisyenler Derneği (TDD) üyesi. Bilimsel makaleler ve halka açık seminerler.",
  },
  {
    icon: Users,
    title: "Deneyim",
    description:
      "9 yıllık klinik tecrübe boyunca 1.500'ün üzerinde danışana eşlik ettim.",
  },
];

export function AboutDietician() {
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
                    SA
                  </div>
                  <div className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
                    Dyt. Selin Akar
                  </div>
                  <div className="mt-1 text-sm font-medium text-emerald-800">
                    Klinik Beslenme & Diyetetik Uzmanı
                  </div>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {["Kilo Yönetimi", "Sporcu Beslenmesi", "Mikrobiyota"].map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100"
                      >
                        {t}
                      </span>
                    ))}
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
              Merhaba, ben Dyt. Selin Akar.
            </h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-slate-600">
              <p>
                9 yıldır klinik beslenme alanında çalışıyorum. Yo-yo
                diyetlerinin kimseye fayda sağlamadığına, sürdürülebilir
                değişimin ise herkes için mümkün olduğuna inanıyorum.
              </p>
              <p>
                Her danışanım için bilimsel literatürü, kişisel hedefleri ve
                yaşam tarzını birlikte değerlendirerek bir plan
                hazırlıyorum. Sürecin sonunda kilo verdiğinizden çok,{" "}
                <strong className="font-semibold text-slate-900">
                  beslenmeyi yeniden öğrendiğinizi
                </strong>{" "}
                hissetmenizi istiyorum.
              </p>
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
