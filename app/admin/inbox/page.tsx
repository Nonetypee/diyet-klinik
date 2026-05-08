import { AppointmentsList } from "@/components/admin/appointments-list";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminInboxPage() {
  const [appointments, counts] = await Promise.all([
    prisma.appointment.findMany({
      where: { status: "PENDING" },
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
          Onay Bekleyenler
        </h1>
        <p className="mt-1 text-slate-600">
          Bekleyen randevu taleplerini inceleyip onaylayın veya reddedin.
        </p>
      </div>

      <AppointmentsList
        items={items}
        currentFilter="PENDING"
        counts={{ all, pending, approved, completed, rejected, cancelled }}
      />
    </div>
  );
}
