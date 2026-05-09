import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ServicesManager } from "@/components/admin/services-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hizmetler Yönetimi" };

export default async function ServicesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?from=/admin/services");
  }

  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Hizmetler Yönetimi
        </h1>
        <p className="mt-1 text-slate-600">
          Landing page'de gösterilen ve randevu formunda seçilebilen hizmetleri
          buradan yönetin. Pasif hizmetler ne sitede ne de formda görünür.
        </p>
      </div>

      <ServicesManager
        initialServices={services.map((s) => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
          iconName: s.iconName,
          description: s.description,
          durationMin: s.durationMin,
          category: s.category,
          priceFromTRY: s.priceFromTRY,
          isActive: s.isActive,
          sortOrder: s.sortOrder,
        }))}
      />
    </div>
  );
}
