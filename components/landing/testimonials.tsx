"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star, TrendingDown } from "lucide-react";

interface TestimonialItem {
  name: string;
  service: string | null;
  result: string | null;
  rating: number;
  comment: string;
}

// DB henüz boşsa veya admin hiç "öne çıkan" işaretlememişse bu fallback gösterilir
const FALLBACK_TESTIMONIALS: TestimonialItem[] = [
  {
    name: "Aslı M.",
    service: "Kilo Yönetimi",
    result: "12 kg kayıp - 5 ayda",
    rating: 5,
    comment:
      "Selin Hanım'ın programı sayesinde sadece kilo vermekle kalmadım, beslenme alışkanlıklarım kalıcı olarak değişti. En önemlisi yo-yo etkisi yaşamadım.",
  },
  {
    name: "Kerem T.",
    service: "Sporcu Beslenmesi",
    result: "8 kg kas kazanımı",
    rating: 5,
    comment:
      "Antrenmanlarım için doğru makro hesabını öğrendim. Performansım belirgin şekilde arttı, toparlanma sürem kısaldı.",
  },
];

export function Testimonials({
  items,
}: {
  items?: TestimonialItem[];
}) {
  const TESTIMONIALS =
    items && items.length > 0 ? items : FALLBACK_TESTIMONIALS;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const prev = () =>
    setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => setIndex((i) => (i + 1) % TESTIMONIALS.length);

  const current = TESTIMONIALS[index];

  return (
    <section id="yorumlar" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
            Danışan Yorumları
          </span>
          <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Beni tercih edenlerin sözleri
          </h2>
          <p className="mt-4 text-balance text-lg leading-relaxed text-slate-600">
            Gerçek danışanlarımın deneyimleri, hizmet kalitemi en iyi
            yansıtan ifadelerdir.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-4xl">
          <div className="relative rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white p-8 sm:p-12">
            <Quote className="absolute right-8 top-8 h-12 w-12 text-emerald-100" />

            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {Array.from({ length: current.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <TrendingDown className="h-3 w-3" />
                {current.result}
              </span>
            </div>

            <p className="mt-6 text-balance text-xl font-medium leading-relaxed text-slate-800 sm:text-2xl">
              {current.comment}
            </p>

            <div className="mt-8 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">
                  {current.name}
                </div>
                <div className="text-sm text-slate-600">{current.service}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={prev}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-700 transition-colors hover:bg-emerald-50"
                  aria-label="Önceki yorum"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={next}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-700 transition-colors hover:bg-emerald-50"
                  aria-label="Sonraki yorum"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-1.5">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-8 bg-emerald-600" : "w-1.5 bg-slate-300"
                  }`}
                  aria-label={`Yorum ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
