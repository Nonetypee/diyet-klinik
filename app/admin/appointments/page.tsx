import { AppointmentsList } from "@/components/admin/appointments-list";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_STATUSES = [
  "ALL",
  "PENDING",
  "APPROVED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
] as const;
type StatusFilter = (typeof VALID_STATUSES)[number];

export default async function AppointmentsPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await props.searchParams;
  const filter = (
    VALID_STATUSES.includes(sp.status as StatusFilter)
      ? sp.status
      : "ALL"
  ) as StatusFilter;

  // Tüm randevuları statüye göre çek
  const where = filter === "ALL" ? {} : { status: filter };

  const [appointments, counts] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: { service: true, dietician: true },
      orderBy: { requestedAt: "desc" },
      take: 200,
    }),
    Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "PENDING" } }),
      prisma.appointment.count({ where: { status: "APPROVED" } }),
      prisma.appointment.count({ where: { status: "COMPLETED" } }),
      prisma.appointment.count({ where: { status: "REJECTED" } }),
      prisma.appointment.count({ where: { status: "CANCELLED" } }),
    ]),
  ]);

  const [all, pending, approved, completed, rejected, cancelled] = counts;

  const items = appointments.map((a) => ({
    id: a.id,
    patientName: a.patientName,
    patientPhone: a.patientPhone,
    patientEmail: a.patientEmail,
    serviceName: a.service.name,
    dieticianName: a.dietician
      ? `${a.dietician.title} ${a.dietician.fullName}`
      : null,
    requestedAt: a.requestedAt.toISOString(),
    approvedAt: a.approvedAt?.toISOString() ?? null,
    status: a.status,
    note: a.patientNote,
    rejectionReason: a.rejectionReason,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Tüm Randevular
        </h1>
        <p className="mt-1 text-slate-600">
          Geçmiş ve gelecekteki tüm randevularınızı durum filtreleriyle görüntüleyin.
        </p>
      </div>

      <AppointmentsList
        items={items}
        currentFilter={filter}
        counts={{ all, pending, approved, completed, rejected, cancelled }}
      />
    </div>
  );
}
