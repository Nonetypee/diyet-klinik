import "server-only";
import { prisma } from "@/lib/db";
import type { LandingClinic, LandingDietician } from "@/lib/landing-data";

/**
 * Landing page için klinik + diyetisyen verilerini tek seferde çeker.
 * Yalnızca Server Component / API route'larından çağrılır.
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

export async function getLandingData(): Promise<{
  clinic: LandingClinic;
  dietician: LandingDietician;
}> {
  const slug = process.env.DEFAULT_CLINIC_SLUG ?? "diyet-klinik";

  try {
    const [clinic, dietician] = await Promise.all([
      prisma.clinic.findUnique({ where: { slug } }),
      prisma.dietician.findFirst({ where: { isActive: true } }),
    ]);

    let workingHours: LandingClinic["workingHours"] = {};
    if (clinic?.workingHours) {
      try {
        const parsed = JSON.parse(clinic.workingHours);
        if (parsed && typeof parsed === "object") workingHours = parsed;
      } catch {
        // ignore parse error
      }
    }

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
    };
  } catch (err) {
    console.warn("[landing-data] DB'den veri çekilemedi:", err);
    return { clinic: DEFAULT_CLINIC, dietician: DEFAULT_DIETICIAN };
  }
}
