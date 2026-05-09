import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { TestimonialsManager } from "@/components/admin/testimonials-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Yorumlar Yönetimi" };

export default async function TestimonialsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?from=/admin/testimonials");
  }

  const items = await prisma.testimonial.findMany({
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Yorumlar Yönetimi
        </h1>
        <p className="mt-1 text-slate-600">
          Site ana sayfasında gösterilen danışan yorumlarını ekleyin, düzenleyin
          veya kaldırın. <strong>Öne Çıkan</strong> olarak işaretlediğiniz
          yorumlar landing page'de görünür.
        </p>
      </div>

      <TestimonialsManager
        initialItems={items.map((t) => ({
          id: t.id,
          patientName: t.patientName,
          rating: t.rating,
          comment: t.comment,
          service: t.service,
          result: t.result,
          isFeatured: t.isFeatured,
          isVerified: t.isVerified,
          createdAt: t.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
