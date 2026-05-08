import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Admin paneli için son aktiviteler — onay bekleyen, son onaylanan
 * ve son reddedilen randevular.
 */
export async function GET() {
  try {
    const [pending, approved, rejected] = await Promise.all([
      prisma.appointment.findMany({
        where: { status: "PENDING" },
        include: { service: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.appointment.findMany({
        where: {
          status: "APPROVED",
          approvedAt: {
            gte: new Date(Date.now() - 48 * 60 * 60 * 1000), // son 48 saat
          },
        },
        include: { service: true },
        orderBy: { approvedAt: "desc" },
        take: 5,
      }),
      prisma.appointment.findMany({
        where: {
          status: "REJECTED",
          updatedAt: {
            gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
          },
        },
        include: { service: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    type Notif = {
      id: string;
      type: "PENDING_NEW" | "APPROVED" | "REJECTED";
      title: string;
      description: string;
      href: string;
      createdAt: string;
    };

    const items: Notif[] = [
      ...pending.map((a) => ({
        id: `p-${a.id}`,
        type: "PENDING_NEW" as const,
        title: `Yeni Randevu Talebi: ${a.patientName}`,
        description: `${a.service.name} · ${formatRelativeDate(a.requestedAt)}`,
        href: "/admin/inbox",
        createdAt: a.createdAt.toISOString(),
      })),
      ...approved.map((a) => ({
        id: `a-${a.id}`,
        type: "APPROVED" as const,
        title: `Randevu Onaylandı: ${a.patientName}`,
        description: `${a.service.name} · ${formatRelativeDate(a.requestedAt)}`,
        href: "/admin/calendar",
        createdAt: (a.approvedAt ?? a.updatedAt).toISOString(),
      })),
      ...rejected.map((a) => ({
        id: `r-${a.id}`,
        type: "REJECTED" as const,
        title: `Randevu Reddedildi: ${a.patientName}`,
        description: `${a.service.name} · ${a.rejectionReason ?? ""}`,
        href: `/admin/appointments?status=REJECTED`,
        createdAt: a.updatedAt.toISOString(),
      })),
    ];

    // En yeniler önce
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(items.slice(0, 15));
  } catch (err) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json([], { status: 500 });
  }
}

function formatRelativeDate(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
