"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED";

interface Event {
  id: string;
  patientName: string;
  serviceName: string;
  doctorName: string | null;
  requestedAt: string;
  durationMin: number;
  status: Status;
}

const STATUS_STYLES: Record<Status, { bg: string; border: string; text: string; dot: string; label: string }> = {
  PENDING:   { bg: "bg-amber-50",    border: "border-l-amber-500",    text: "text-amber-900",    dot: "bg-amber-500",    label: "Bekliyor" },
  APPROVED:  { bg: "bg-emerald-50",  border: "border-l-emerald-500",  text: "text-emerald-900",  dot: "bg-emerald-500",  label: "Onaylı"   },
  COMPLETED: { bg: "bg-slate-100",   border: "border-l-slate-500",    text: "text-slate-700",    dot: "bg-slate-500",    label: "Tamamlandı" },
  REJECTED:  { bg: "bg-red-50",      border: "border-l-red-500",      text: "text-red-900",      dot: "bg-red-500",      label: "Reddedildi" },
};

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 - 18:00
const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday=0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInWeek(d: Date, weekStart: Date) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 7);
  return d >= weekStart && d < end;
}

export function SmartCalendar({ events }: { events: Event[] }) {
  const [view, setView] = useState<"week" | "day">("week");
  const [cursor, setCursor] = useState(new Date());

  // Bu hafta hiç event yoksa, en yakın gelecekteki event'in haftasına atla
  useEffect(() => {
    if (events.length === 0) return;
    const currentWeek = startOfWeek(new Date());
    const eventsThisWeek = events.filter((e) =>
      isInWeek(new Date(e.requestedAt), currentWeek)
    );
    if (eventsThisWeek.length === 0) {
      // En yakın gelecekteki etkinliğe atla
      const now = Date.now();
      const future = events
        .map((e) => new Date(e.requestedAt))
        .filter((d) => d.getTime() >= now - 24 * 60 * 60 * 1000)
        .sort((a, b) => a.getTime() - b.getTime());
      if (future.length > 0) {
        setCursor(future[0]);
      }
    }
    // sadece ilk yüklemede çalışsın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  const dayEvents = useMemo(
    () =>
      events.filter((e) => isSameDay(new Date(e.requestedAt), cursor)),
    [events, cursor]
  );

  const weekEvents = useMemo(
    () => events.filter((e) => isInWeek(new Date(e.requestedAt), weekStart)),
    [events, weekStart]
  );

  // Status sayıları
  const counts = useMemo(() => {
    const c: Record<Status, number> = { PENDING: 0, APPROVED: 0, COMPLETED: 0, REJECTED: 0 };
    weekEvents.forEach((e) => {
      c[e.status] = (c[e.status] ?? 0) + 1;
    });
    return c;
  }, [weekEvents]);

  // Yaklaşan ilk event
  const nextUpcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => e.status === "APPROVED" || e.status === "PENDING")
      .map((e) => ({ ...e, ts: new Date(e.requestedAt).getTime() }))
      .filter((e) => e.ts >= now)
      .sort((a, b) => a.ts - b.ts)[0];
  }, [events]);

  const formatRange = () => {
    if (view === "day") {
      return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
      }).format(cursor);
    }
    const end = days[6];
    const startStr = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(weekStart);
    const endStr = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(end);
    return `${startStr} – ${endStr}`;
  };

  const navigate = (dir: -1 | 1) => {
    const d = new Date(cursor);
    if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCursor(d);
  };

  const jumpToNext = () => {
    if (nextUpcoming) {
      setCursor(new Date(nextUpcoming.requestedAt));
    }
  };

  return (
    <div className="space-y-4">
      {/* Yaklaşan event banner */}
      {nextUpcoming && !isInWeek(new Date(nextUpcoming.requestedAt), weekStart) && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                <Sparkles className="h-4 w-4 text-emerald-700" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Yaklaşan Randevu: {nextUpcoming.patientName}
                </div>
                <div className="text-xs text-slate-600">
                  {new Intl.DateTimeFormat("tr-TR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(nextUpcoming.requestedAt))}{" "}
                  · {nextUpcoming.serviceName}
                </div>
              </div>
            </div>
            <Button size="sm" variant="primary" onClick={jumpToNext}>
              O Haftaya Git
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
                Bugün
              </Button>
              <div className="flex items-center rounded-lg border border-slate-200">
                <button
                  onClick={() => navigate(-1)}
                  className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50"
                  aria-label="Önceki"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="border-l border-r border-slate-200 px-4 text-sm font-semibold text-slate-900">
                  {formatRange()}
                </div>
                <button
                  onClick={() => navigate(1)}
                  className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50"
                  aria-label="Sonraki"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Bu hafta sayıları */}
              <div className="hidden items-center gap-3 text-xs text-slate-600 sm:flex">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {counts.APPROVED} Onaylı
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  {counts.PENDING} Bekliyor
                </span>
              </div>

              {/* View Toggle */}
              <div className="flex rounded-lg border border-slate-200">
                <button
                  onClick={() => setView("day")}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium",
                    view === "day"
                      ? "bg-emerald-700 text-white"
                      : "text-slate-700 hover:bg-emerald-50"
                  )}
                >
                  Günlük
                </button>
                <button
                  onClick={() => setView("week")}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium",
                    view === "week"
                      ? "bg-emerald-700 text-white"
                      : "text-slate-700 hover:bg-emerald-50"
                  )}
                >
                  Haftalık
                </button>
              </div>
            </div>
          </div>

          {view === "week" ? (
            <WeekView
              days={days}
              hours={HOURS}
              events={events}
              onSelectDay={(d) => {
                setCursor(d);
                setView("day");
              }}
            />
          ) : (
            <DayView events={dayEvents} hours={HOURS} />
          )}

          {/* Hafta boş ise empty state */}
          {view === "week" && weekEvents.length === 0 && (
            <div className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-500">
              Bu hafta için randevu bulunmuyor.
              {nextUpcoming && (
                <button
                  onClick={jumpToNext}
                  className="ml-1 font-semibold text-emerald-700 hover:underline"
                >
                  Yaklaşan haftaya git →
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WeekView({
  days,
  hours,
  events,
  onSelectDay,
}: {
  days: Date[];
  hours: number[];
  events: Event[];
  onSelectDay: (d: Date) => void;
}) {
  const today = new Date();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[860px]">
        {/* Header */}
        <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-slate-50/50">
          <div></div>
          {days.map((d, i) => {
            const isToday = isSameDay(d, today);
            const eventsThisDay = events.filter((e) =>
              isSameDay(new Date(e.requestedAt), d)
            );
            return (
              <button
                key={i}
                onClick={() => onSelectDay(d)}
                className="flex flex-col items-center justify-center border-l border-slate-200 px-2 py-3 hover:bg-emerald-50/60"
              >
                <div className="text-xs font-medium uppercase text-slate-500">{DAY_NAMES[i]}</div>
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                    isToday ? "bg-emerald-700 text-white" : "text-slate-900"
                  )}
                >
                  {d.getDate()}
                </div>
                {eventsThisDay.length > 0 && (
                  <div className="mt-1 flex gap-0.5">
                    {eventsThisDay.slice(0, 3).map((e, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "h-1 w-1 rounded-full",
                          e.status === "APPROVED" && "bg-emerald-500",
                          e.status === "PENDING" && "bg-amber-500",
                          e.status === "COMPLETED" && "bg-slate-500",
                          e.status === "REJECTED" && "bg-red-500"
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="relative">
          {hours.map((h) => (
            <div
              key={h}
              className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b border-slate-100"
            >
              <div className="px-2 py-1 text-right text-[11px] font-medium text-slate-400">
                {`${String(h).padStart(2, "0")}:00`}
              </div>
              {days.map((day, di) => (
                <div
                  key={di}
                  className="relative h-16 border-l border-slate-100"
                >
                  {events
                    .filter((e) => {
                      const d = new Date(e.requestedAt);
                      return isSameDay(d, day) && d.getHours() === h;
                    })
                    .map((e) => {
                      const d = new Date(e.requestedAt);
                      const top = (d.getMinutes() / 60) * 100;
                      const height = (e.durationMin / 60) * 100;
                      const s = STATUS_STYLES[e.status];
                      return (
                        <div
                          key={e.id}
                          className={cn(
                            "absolute left-0.5 right-0.5 overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-[11px] shadow-sm",
                            s.bg,
                            s.border,
                            s.text
                          )}
                          style={{ top: `${top}%`, height: `${height}%` }}
                        >
                          <div className="line-clamp-1 font-semibold">{e.patientName}</div>
                          <div className="line-clamp-1 opacity-75">{e.serviceName}</div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DayView({ events, hours }: { events: Event[]; hours: number[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CalendarIcon className="h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-700">
          Bu güne ait randevu bulunmuyor
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[80px_1fr]">
      <div className="border-r border-slate-100">
        {hours.map((h) => (
          <div
            key={h}
            className="flex h-20 items-start justify-end border-b border-slate-100 px-3 pt-1.5 text-xs font-medium text-slate-400"
          >
            {`${String(h).padStart(2, "0")}:00`}
          </div>
        ))}
      </div>
      <div className="relative">
        {hours.map((h) => (
          <div key={h} className="h-20 border-b border-slate-100" />
        ))}
        {events.map((e) => {
          const d = new Date(e.requestedAt);
          const startMinutes = (d.getHours() - hours[0]) * 60 + d.getMinutes();
          const top = (startMinutes / 60) * 80;
          const height = (e.durationMin / 60) * 80;
          const s = STATUS_STYLES[e.status];
          return (
            <div
              key={e.id}
              className={cn(
                "absolute left-3 right-3 overflow-hidden rounded-lg border-l-4 px-3 py-2.5 shadow-sm",
                s.bg,
                s.border,
                s.text
              )}
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {e.patientName}
                  </div>
                  <div className="truncate text-xs opacity-80">
                    {e.serviceName} · {e.doctorName ?? "Diyetisyen atanacak"}
                  </div>
                </div>
                <Badge
                  variant={
                    e.status === "APPROVED"
                      ? "success"
                      : e.status === "PENDING"
                      ? "warning"
                      : "default"
                  }
                  className="text-[10px]"
                >
                  {s.label}
                </Badge>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] opacity-80">
                <Clock className="h-3 w-3" />
                {`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} · ${e.durationMin} dk`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
