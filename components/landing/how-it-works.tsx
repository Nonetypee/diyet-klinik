import { FileText, ShieldCheck, MessageSquareText, CalendarCheck } from "lucide-react";
import type { LandingClinic } from "@/lib/landing-data";

interface Props {
  clinic: LandingClinic;
}

function buildSteps(clinic: LandingClinic) {
  const locationLabel = clinic.district
    ? `${clinic.district}'deki klinikte`
    : "klinikte";

  return [
  {
    number: "01",
    icon: FileText,
    title: "Talebinizi Oluşturun",
    description:
      "Hizmet, tarih ve saat seçerek randevu talebinizi 60 saniyeden kısa sürede gönderin.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Talebinizi İnceleyim",
    description:
      "Takvimi kontrol eder, uygunluğu doğrularım. KVKK çerçevesinde randevunuzu onaylarım.",
  },
  {
    number: "03",
    icon: MessageSquareText,
    title: "SMS ile Bilgilenin",
    description:
      "Onaylanan randevunuz cep telefonunuza otomatik SMS ile bildirilir. Hatırlatma da gelir.",
  },
  {
    number: "04",
    icon: CalendarCheck,
    title: "Görüşmeye Katılın",
    description: `Online video bağlantısıyla ya da ${locationLabel} yüz yüze görüşmeye başlayalım.`,
  },
  ];
}

export function HowItWorks({ clinic }: Props) {
  const STEPS = buildSteps(clinic);
  return (
    <section
      id="nasil-calisir"
      className="border-t border-slate-100 bg-slate-50/40 py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
            Nasıl Çalışır?
          </span>
          <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Onay-öncelikli, şeffaf bir akış
          </h2>
          <p className="mt-4 text-balance text-lg leading-relaxed text-slate-600">
            Otomatik onay yerine her randevu titizlikle kontrol edilir.
            Hata payı yoktur, çakışma yaşanmaz.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, idx) => (
            <div
              key={step.number}
              className="relative rounded-2xl border border-slate-200 bg-white p-7"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-widest text-emerald-700">
                  {step.number}
                </span>
                <step.icon className="h-5 w-5 text-slate-400" strokeWidth={2} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.description}
              </p>

              {idx < STEPS.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-emerald-100 lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
