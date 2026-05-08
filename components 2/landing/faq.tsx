"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Online danışmanlık nasıl yürütülüyor?",
    a: "Görüşme öncesi e-posta ile gönderilen Zoom/Google Meet bağlantısı üzerinden 45-60 dakikalık seans yapılır. Beslenme planı, takip dosyaları ve dijital tarif kitabı PDF olarak iletilir.",
  },
  {
    q: "İlk görüşmede neler konuşulur?",
    a: "İlk görüşme yaklaşık 60 dakikadır. Beslenme alışkanlıklarınız, sağlık geçmişiniz, laboratuvar değerleriniz, hedefleriniz ve yaşam tarzınız detaylı şekilde değerlendirilir. Kişiye özel plan, bu görüşmenin ardından 24-48 saat içinde hazırlanır.",
  },
  {
    q: "Diyet listesi ne kadar süre sonra hazır olur?",
    a: "İlk görüşmenin ardından en geç 48 saat içinde özel beslenme planınız e-posta ile iletilir. Plan; alışveriş listesi, yemek tarifleri ve değişim listesini içerir.",
  },
  {
    q: "Kaç seans gerekir?",
    a: "Hedefe göre değişir. Genellikle ilk ay haftalık takip, sonrasında 2 haftada bir seans yeterli olur. Ortalama bir kilo verme süreci 3-6 ay arasındadır. Ancak bu sürede beslenme alışkanlığınız kalıcı şekilde değişir.",
  },
  {
    q: "Yo-yo etkisi yaşar mıyım?",
    a: "Hayır. Programlarımız aşırı kısıtlayıcı diyetler değil, sürdürülebilir yaşam değişikliği üzerine kuruludur. Hedefe ulaştıktan sonra 'koruma fazı' ile birlikte beslenmenize sahip çıkmayı öğrenirsiniz.",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Evet. Tüm danışan bilgileri 6698 sayılı KVKK çerçevesinde şifrelenerek saklanır. Verileriniz hiçbir üçüncü tarafla paylaşılmaz, sadece danışmanlık süreciniz için kullanılır.",
  },
  {
    q: "Ödeme nasıl yapılır?",
    a: "Online görüşmelerde havale/EFT veya kredi kartı kabul edilir. Yüz yüze görüşmelerde nakit veya kart ile ödeme yapabilirsiniz. Paket programlar için taksit imkanı mevcuttur.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="sss" className="border-t border-slate-100 bg-emerald-50/20 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
            Sıkça Sorulan Sorular
          </span>
          <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Aklınıza takılanlar
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((item, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-emerald-100 bg-white"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
              >
                <span className="text-base font-semibold text-slate-900">
                  {item.q}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-slate-400 transition-transform",
                    open === i && "rotate-180 text-emerald-600"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-base leading-relaxed text-slate-600">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
