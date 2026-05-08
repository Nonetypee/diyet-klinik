import { prisma } from "@/lib/db";
import { SettingsView } from "@/components/admin/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const slug = process.env.DEFAULT_CLINIC_SLUG ?? "diyet-klinik";

  const [clinic, dietician, services] = await Promise.all([
    prisma.clinic.findUnique({ where: { slug } }),
    prisma.dietician.findFirst({ where: { isActive: true } }),
    prisma.service.findMany({
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  // Mesajlaşma sağlayıcı durumu (WhatsApp ya da SMS)
  const messagingProvider = (
    process.env.MESSAGING_PROVIDER ??
    process.env.SMS_PROVIDER ??
    "MOCK"
  ).toUpperCase();

  const fallbackProvider = (
    process.env.MESSAGING_FALLBACK_PROVIDER ?? ""
  ).toUpperCase();

  const isProviderConfigured = (p: string) => {
    if (p === "MOCK") return true;
    if (p === "WHATSAPP")
      return (
        !!process.env.WHATSAPP_PHONE_NUMBER_ID &&
        !!process.env.WHATSAPP_ACCESS_TOKEN
      );
    if (p === "NETGSM")
      return (
        !!process.env.NETGSM_USERCODE &&
        !!process.env.NETGSM_PASSWORD &&
        !!process.env.NETGSM_HEADER
      );
    if (p === "MUTLUCELL")
      return (
        !!process.env.MUTLUCELL_USERNAME &&
        !!process.env.MUTLUCELL_PASSWORD &&
        !!process.env.MUTLUCELL_ORGN
      );
    return false;
  };

  const messagingConfigured = isProviderConfigured(messagingProvider);
  const fallbackConfigured = fallbackProvider
    ? isProviderConfigured(fallbackProvider)
    : false;

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
          Klinik bilgileriniz, çalışma saatleriniz, SMS sağlayıcısı ve KVKK
          metni.
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
        messagingStatus={{
          primary: messagingProvider,
          primaryConfigured: messagingConfigured,
          fallback: fallbackProvider || null,
          fallbackConfigured,
        }}
      />
    </div>
  );
}
