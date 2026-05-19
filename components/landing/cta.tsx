import Link from "next/link";
import { ArrowRight, Phone, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LandingClinic } from "@/lib/landing-data";
import {
  phoneToTelHref,
  summarizeWorkingHours,
} from "@/lib/landing-data";

interface Props {
  clinic: LandingClinic;
}

export function Cta({ clinic }: Props) {
  const hoursLabel = summarizeWorkingHours(clinic.workingHours);

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-emerald-900 px-8 py-16 text-center sm:px-16">
          {/* Doğal organic glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/30 via-transparent to-teal-500/20" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl" />

          <div className="relative">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
              <Leaf className="h-6 w-6 text-emerald-200" />
            </div>
            <h2 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Sağlıklı yaşam için
              <br />
              bekleyecek vaktiniz yok.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-relaxed text-emerald-100">
              Randevu sürecinizi 60 saniyede tamamlayın. Onayım SMS ile size
              ulaşacak, sürdürülebilir değişim yolculuğunuz başlayacak.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 bg-white px-7 text-base text-emerald-900 hover:bg-emerald-50"
              >
                <Link href="#randevu">
                  Randevu Talep Et
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-emerald-700/40 bg-transparent px-7 text-base text-white hover:bg-emerald-800/40"
              >
                <a href={`tel:${phoneToTelHref(clinic.phone)}`}>
                  <Phone className="mr-1.5 h-4 w-4" />
                  {clinic.phone}
                </a>
              </Button>
            </div>

            <p className="mt-8 text-sm text-emerald-200/80">
              {hoursLabel} · Telefon talepleriniz mesai içinde değerlendirilir
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
