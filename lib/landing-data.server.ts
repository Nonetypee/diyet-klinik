import "server-only";
import { prisma } from "@/lib/db";
import type { LandingClinic, LandingDietician } from "@/lib/landing-data";
import {
  DEFAULT_LANDING_CONTENT,
  type FaqItem,
  type HeroTrustSignal,
  type HowStep,
  type LandingContentValues,
  type TrustPillar,
  type TrustStat,
} from "@/lib/landing-defaults";

/**
 * Landing page için klinik + diyetisyen + anasayfa içeriklerini tek seferde
 * çeker. Yalnızca Server Component / API route'larından çağrılır.
 *
 * Veri yoksa (henüz seed çalıştırılmamışsa) makul varsayılanlar döner —
 * site yine açılır.
 */

const DEFAULT_CLINIC: LandingClinic = {
  name: "Diyet Klinik",
  tagline: "Bilime dayalı, kişiye özel beslenme",
  phone: "0212 000 00 00",
  whatsapp: null,
  email: "info@diyetklinik.com",
  address: "Adres bilgisi henüz girilmedi",
  city: "İstanbul",
  district: "",
  workingHours: {},
};

const DEFAULT_DIETICIAN: LandingDietician = {
  fullName: "Diyetisyen",
  title: "Dyt.",
  specialty: "Klinik Beslenme & Diyetetik",
  bio: "Biyografi henüz girilmedi.",
  yearsOfExperience: null,
  licenseNumber: null,
};

function safeJsonArray<T>(json: string | undefined | null, fallback: T[]): T[] {
  if (!json) return fallback;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export async function getLandingData(): Promise<{
  clinic: LandingClinic;
  dietician: LandingDietician;
  content: LandingContentValues;
}> {
  const slug = process.env.DEFAULT_CLINIC_SLUG ?? "diyet-klinik";

  try {
    const [clinic, dietician, content] = await Promise.all([
      prisma.clinic.findUnique({ where: { slug } }),
      prisma.dietician.findFirst({ where: { isActive: true } }),
      prisma.landingContent.findUnique({ where: { id: "singleton" } }),
    ]);

    let workingHours: LandingClinic["workingHours"] = {};
    if (clinic?.workingHours) {
      try {
        const parsed = JSON.parse(clinic.workingHours);
        if (parsed && typeof parsed === "object") workingHours = parsed;
      } catch {
        // ignore
      }
    }

    const mappedContent: LandingContentValues = content
      ? {
          primaryColor: content.primaryColor,
          primaryColorDark: content.primaryColorDark,
          accentColor: content.accentColor,
          darkBgColor: content.darkBgColor,
          heroBadge: content.heroBadge,
          heroTitlePart1: content.heroTitlePart1,
          heroTitleAccent: content.heroTitleAccent,
          heroTitlePart2: content.heroTitlePart2,
          heroSubtitle: content.heroSubtitle,
          heroCtaPrimary: content.heroCtaPrimary,
          heroCtaSecondary: content.heroCtaSecondary,
          heroTrustSignals: safeJsonArray<HeroTrustSignal>(
            content.heroTrustSignals,
            DEFAULT_LANDING_CONTENT.heroTrustSignals
          ),
          trustBadge: content.trustBadge,
          trustTitle: content.trustTitle,
          trustSubtitle: content.trustSubtitle,
          trustPillars: safeJsonArray<TrustPillar>(
            content.trustPillars,
            DEFAULT_LANDING_CONTENT.trustPillars
          ),
          trustStats: safeJsonArray<TrustStat>(
            content.trustStats,
            DEFAULT_LANDING_CONTENT.trustStats
          ),
          servicesBadge: content.servicesBadge,
          servicesTitle: content.servicesTitle,
          servicesSubtitle: content.servicesSubtitle,
          howBadge: content.howBadge,
          howTitle: content.howTitle,
          howSubtitle: content.howSubtitle,
          howSteps: safeJsonArray<HowStep>(
            content.howSteps,
            DEFAULT_LANDING_CONTENT.howSteps
          ),
          bookingBadge: content.bookingBadge,
          bookingTitle: content.bookingTitle,
          bookingSubtitle: content.bookingSubtitle,
          faqBadge: content.faqBadge,
          faqTitle: content.faqTitle,
          faqItems: safeJsonArray<FaqItem>(
            content.faqItems,
            DEFAULT_LANDING_CONTENT.faqItems
          ),
          ctaTitle: content.ctaTitle,
          ctaSubtitle: content.ctaSubtitle,
          ctaPrimary: content.ctaPrimary,
        }
      : DEFAULT_LANDING_CONTENT;

    return {
      clinic: clinic
        ? {
            name: clinic.name,
            tagline: clinic.tagline,
            phone: clinic.phone,
            whatsapp: clinic.whatsapp,
            email: clinic.email,
            address: clinic.address,
            city: clinic.city,
            district: clinic.district,
            workingHours,
          }
        : DEFAULT_CLINIC,
      dietician: dietician
        ? {
            fullName: dietician.fullName,
            title: dietician.title,
            specialty: dietician.specialty,
            bio: dietician.bio,
            yearsOfExperience: dietician.yearsOfExperience,
            licenseNumber: dietician.licenseNumber,
          }
        : DEFAULT_DIETICIAN,
      content: mappedContent,
    };
  } catch (err) {
    console.warn("[landing-data] DB'den veri çekilemedi:", err);
    return {
      clinic: DEFAULT_CLINIC,
      dietician: DEFAULT_DIETICIAN,
      content: DEFAULT_LANDING_CONTENT,
    };
  }
}
