import { SmartCalendar } from "@/components/admin/smart-calendar";
import { UpcomingAgenda } from "@/components/admin/upcoming-agenda";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  // Geniş aralık çek: -14 gün → +60 gün
  const start = new Date();
  start.setDate(start.getDate() - 14);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() + 60);

  const appointments = await prisma.appointment.findMany({
    where: {
      requestedAt: { gte: start, lte: end },
      status: { in: ["PENDING", "APPROVED", "COMPLETED"] },
    },
    include: { service: true, dietician: true },
    orderBy: { requestedAt: "asc" },
  });

  const events = appointments.map((a) => ({
    id: a.id,
    patientName: a.patientName,
    patientPhone: a.patientPhone,
    serviceName: a.service.name,
    doctorName: a.dietician
      ? `${a.dietician.title} ${a.dietician.fullName}`
      : null,
    requestedAt: a.requestedAt.toISOString(),
    durationMin: a.service.durationMin,
    status: a.status as "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED",
  }));

  // Sadece bugün ve sonrasındaki onaylı/bekleyen — agenda için
  const now = Date.now();
  const upcoming = events
    .filter(
      (e) =>
        new Date(e.requestedAt).getTime() >= now - 4 * 60 * 60 * 1000 && // son 4 saat de gözüksün
        (e.status === "APPROVED" || e.status === "PENDING")
    )
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Takvim
        </h1>
        <p className="mt-1 text-slate-600">
          Onaylı ve onay bekleyen tüm randevularınızı tek bakışta görün.
        </p>
      </div>

      {/* Üstte yaklaşan randevular listesi — her zaman görünür */}
      <UpcomingAgenda events={upcoming} />

      <SmartCalendar
        events={events.map(({ patientPhone, ...rest }) => rest)}
      />
    </div>
  );
}
