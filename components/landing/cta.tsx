import Link from "next/link";
import { ArrowRight, Phone, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  LandingClinic,
  LandingContentValues,
} from "@/lib/landing-data";
import {
  phoneToTelHref,
  summarizeWorkingHours,
} from "@/lib/landing-data";

interface Props {
  clinic: LandingClinic;
  content: LandingContentValues;
}

export function Cta({ clinic, content }: Props) {
  const hoursLabel = summarizeWorkingHours(clinic.workingHours);

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-16"
          style={{ backgroundColor: "var(--brand-bg-dark)" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--brand) 30%, transparent), transparent 50%, color-mix(in srgb, var(--brand-accent) 20%, transparent))",
            }}
          />
          <div
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--brand-accent) 15%, transparent)",
            }}
          />
          <div
            className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full blur-3xl"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--brand-accent) 15%, transparent)",
            }}
          />

          <div className="relative">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
              <Leaf className="h-6 w-6 text-emerald-200" />
            </div>
            <h2 className="whitespace-pre-line text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {content.ctaTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-relaxed text-emerald-100">
              {content.ctaSubtitle}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 bg-white px-7 text-base hover:bg-emerald-50"
                style={{ color: "var(--brand-bg-dark)" }}
              >
                <Link href="#randevu">
                  {content.ctaPrimary}
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
