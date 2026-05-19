import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SettingsView } from "@/components/admin/settings-view";
import { getLandingData } from "@/lib/landing-data.server";
import { auth } from "@/auth";
import {
  canEditLanding,
  canManageSettings,
  normalizeRole,
} from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?from=/admin/settings");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const role = normalizeRole(user?.role);
  if (!canManageSettings(role)) {
    redirect("/admin");
  }

  const slug = process.env.DEFAULT_CLINIC_SLUG ?? "diyet-klinik";

  const [clinic, dietician, services, landingData] = await Promise.all([
    prisma.clinic.findUnique({ where: { slug } }),
    prisma.dietician.findFirst({ where: { isActive: true } }),
    prisma.service.findMany({
      orderBy: { sortOrder: "asc" },
    }),
    getLandingData(),
  ]);

  // Çalışma saatleri parse
  let workingHours: Record<string, { open?: string; close?: string; closed?: boolean }> = {};
  if (clinic?.workingHours) {
    try {
      workingHours = JSON.parse(clinic.workingHours);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Ayarlar
        </h1>
        <p className="mt-1 text-slate-600">
          Klinik bilgileriniz, çalışma saatleriniz, mesajlaşma sağlayıcısı ve
          KVKK metni. Tüm değişiklikler anında uygulanır.
        </p>
      </div>

      <SettingsView
        clinic={
          clinic
            ? {
                name: clinic.name,
                tagline: clinic.tagline,
                phone: clinic.phone,
                email: clinic.email,
                whatsapp: clinic.whatsapp,
                address: clinic.address,
                city: clinic.city,
                district: clinic.district,
                kvkkText: clinic.kvkkText,
                metaTitle: clinic.metaTitle,
                metaDescription: clinic.metaDescription,
              }
            : null
        }
        dietician={
          dietician
            ? {
                fullName: dietician.fullName,
                title: dietician.title,
                specialty: dietician.specialty,
                bio: dietician.bio,
                yearsOfExperience: dietician.yearsOfExperience,
                licenseNumber: dietician.licenseNumber,
              }
            : null
        }
        services={services.map((s) => ({
          slug: s.slug,
          name: s.name,
          durationMin: s.durationMin,
          isActive: s.isActive,
          category: s.category,
        }))}
        workingHours={workingHours}
        landingContent={landingData.content}
        canEditLanding={canEditLanding(role)}
      />
    </div>
  );
}
