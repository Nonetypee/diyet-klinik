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
import { prisma } from "@/lib/db";

// Her istekte güncel yorumları çek (admin yeni yorum ekleyince anında yansısın)
export const dynamic = "force-dynamic";
export const revalidate = 60; // 60 sn cache fallback

async function getFeaturedTestimonials() {
  try {
    const items = await prisma.testimonial.findMany({
      where: { isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    return items.map((t) => ({
      name: t.patientName,
      service: t.service,
      result: t.result,
      rating: t.rating,
      comment: t.comment,
    }));
  } catch (err) {
    console.warn("[home] Testimonials çekilemedi:", err);
    return [];
  }
}

async function getActiveServices() {
  try {
    const items = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return items;
  } catch (err) {
    console.warn("[home] Services çekilemedi:", err);
    return [];
  }
}

export default async function HomePage() {
  const [testimonials, services] = await Promise.all([
    getFeaturedTestimonials(),
    getActiveServices(),
  ]);

  // Services bileşeni için hafif tip
  const servicesForLanding = services.map((s) => ({
    slug: s.slug,
    name: s.name,
    iconName: s.iconName,
    description: s.description,
  }));

  // Form için sadece slug + name + duration
  const servicesForForm = services.map((s) => ({
    slug: s.slug,
    name: s.name,
    durationMin: s.durationMin,
  }));

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <TrustBuilder />
      <Services items={servicesForLanding} />
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
              Onaylandığında bilgilendirileceksiniz.
            </p>
          </div>
          <AppointmentForm services={servicesForForm} />
        </div>
      </section>
      <Testimonials items={testimonials} />
      <Faq />
      <Cta />
      <Footer />
    </main>
  );
}
