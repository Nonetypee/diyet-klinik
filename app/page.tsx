import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { TrustBuilder } from "@/components/landing/trust-builder";
import { Services } from "@/components/landing/services";
import { AboutDietician } from "@/components/landing/about-dietician";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { Faq } from "@/components/landing/faq";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { AppointmentForm } from "@/components/landing/appointment-form";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <TrustBuilder />
      <Services />
      <AboutDietician />
      <HowItWorks />
      <section
        id="randevu"
        className="border-y border-slate-100 bg-emerald-50/30 py-24"
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
              Randevu Talebi
            </span>
            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Sağlıklı yaşam için ilk adımı atın
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-slate-600">
              Formu doldurun, en kısa sürede randevunuzu değerlendireyim.
              Onaylandığında SMS ile bilgilendirileceksiniz.
            </p>
          </div>
          <AppointmentForm />
        </div>
      </section>
      <Testimonials />
      <Faq />
      <Cta />
      <Footer />
    </main>
  );
}
