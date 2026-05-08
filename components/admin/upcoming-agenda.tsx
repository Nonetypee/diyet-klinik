"use client";

import { CalendarClock, Clock, Phone, CheckCircle2, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AgendaEvent {
  id: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
  doctorName: string | null;
  requestedAt: string;
  durationMin: number;
  status: "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED";
}

const STATUS_META = {
  PENDING: {
    label: "Bekliyor",
    icon: Inbox,
    bg: "bg-amber-50",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Onaylı",
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  COMPLETED: {
    label: "Tamamlandı",
    icon: CheckCircle2,
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-500",
  },
  REJECTED: {
    label: "Reddedildi",
    icon: Inbox,
    bg: "bg-red-50",
    text: "text-red-800",
    dot: "bg-red-500",
  },
};

const TR_DAY_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const TR_TIME_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});

function relativeLabel(d: Date): string {
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();

  if (sameDay) {
    if (diffMin < 0) return "Bugün (geçti)";
    if (diffMin < 60) return `Bugün · ${diffMin} dk sonra`;
    return "Bugün";
  }
  if (isTomorrow) return "Yarın";
  return TR_DAY_FORMAT.format(d);
}

export function UpcomingAgenda({ events }: { events: AgendaEvent[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <CalendarClock className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Yaklaşan randevu yok
            </div>
            <div className="text-xs text-slate-600">
              Onaylanan veya bekleyen yeni randevular burada listelenecek.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="h-4 w-4 text-emerald-700" />
            <h2 className="text-sm font-semibold text-slate-900">
              Yaklaşan Randevular
            </h2>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {events.length}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            En yakın {events.length} randevu
          </span>
        </div>

        <ul className="divide-y divide-slate-100">
          {events.map((e) => {
            const status = STATUS_META[e.status];
            const Icon = status.icon;
            const date = new Date(e.requestedAt);

            return (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 hover:bg-emerald-50/30"
              >
                {/* Tarih */}
                <div className="min-w-[110px]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {relativeLabel(date)}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-slate-900">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {TR_TIME_FORMAT.format(date)}
                  </div>
                </div>

                {/* İçerik */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {e.patientName}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        status.bg,
                        status.text
                      )}
                    >
                      <Icon className="h-2.5 w-2.5" />
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-600">
                    {e.serviceName} · {e.durationMin} dk
                    {e.doctorName ? ` · ${e.doctorName}` : ""}
                  </div>
                </div>

                {/* Telefon */}
                <a
                  href={`tel:${e.patientPhone.replace(/\s/g, "")}`}
                  className="hidden items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 sm:inline-flex"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {e.patientPhone}
                </a>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
