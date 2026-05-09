"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SlotInfo {
  time: string;
  available: boolean;
  reason?: "BOOKED" | "PAST" | "OUTSIDE_HOURS";
}

interface AvailabilityResponse {
  date: string;
  dayKey: string;
  isOpen: boolean;
  workingHours: { open: string; close: string } | null;
  message?: string;
  slots: SlotInfo[];
}

interface Props {
  serviceSlug: string | null;
  selectedDate: string | null; // "YYYY-MM-DD"
  selectedTime: string | null; // "HH:MM"
  onChange: (date: string | null, time: string | null) => void;
}

const DAY_NAMES_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function DateSlotPicker({
  serviceSlug,
  selectedDate,
  selectedTime,
  onChange,
}: Props) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + 3); // 3 ay ileriye kadar
    return d;
  }, [today]);

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tarih seçildiğinde availability fetch et
  useEffect(() => {
    if (!selectedDate || !serviceSlug) {
      setAvailability(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(
      `/api/availability?date=${encodeURIComponent(
        selectedDate
      )}&serviceSlug=${encodeURIComponent(serviceSlug)}`
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message ?? "Müsaitlik alınamadı");
        return data as AvailabilityResponse;
      })
      .then((data) => {
        if (!cancelled) setAvailability(data);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Bir hata oluştu");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, serviceSlug]);

  // Takvim grid'i
  const monthDays = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const startDayOfWeek = (first.getDay() + 6) % 7; // Monday = 0
    const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);

    // 6 hafta x 7 gün = 42 hücre (her zaman)
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i));
    }
    while (cells.length < 42) cells.push(null);
    return cells;
  }, [viewMonth]);

  const canGoBack = startOfMonth(today).getTime() < viewMonth.getTime();
  const canGoForward = startOfMonth(maxDate).getTime() >= viewMonth.getTime();

  const handlePickDate = (d: Date) => {
    if (d < today || d > maxDate) return;
    onChange(toIsoDate(d), null); // saati sıfırla
  };

  if (!serviceSlug) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
        Önce bir hizmet seçin, ardından tarih ve saat görünecek.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5">
      {/* Takvim header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            const prev = new Date(viewMonth);
            prev.setMonth(prev.getMonth() - 1);
            setViewMonth(prev);
          }}
          disabled={!canGoBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Önceki ay"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-semibold text-slate-900">
          {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </div>
        <button
          type="button"
          onClick={() => {
            const next = new Date(viewMonth);
            next.setMonth(next.getMonth() + 1);
            setViewMonth(next);
          }}
          disabled={!canGoForward}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Sonraki ay"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Takvim grid */}
      <div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {DAY_NAMES_SHORT.map((name) => (
            <div key={name} className="py-1">
              {name}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthDays.map((d, i) => {
            if (!d) return <div key={i} />;
            const iso = toIsoDate(d);
            const isPast = d < today;
            const isFuture = d > maxDate;
            const isSelected = selectedDate === iso;
            const isToday = isSameDay(d, today);
            const disabled = isPast || isFuture;

            return (
              <button
                key={i}
                type="button"
                onClick={() => handlePickDate(d)}
                disabled={disabled}
                className={cn(
                  "flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                  disabled && "cursor-not-allowed text-slate-300",
                  !disabled && !isSelected && "text-slate-700 hover:bg-emerald-50",
                  isSelected && "bg-emerald-700 text-white",
                  isToday && !isSelected && "ring-1 ring-emerald-300"
                )}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot bölümü */}
      <div className="border-t border-slate-100 pt-4">
        {!selectedDate ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarIcon className="h-4 w-4" />
            Tarih seçtikten sonra müsait saatler görünecek.
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Müsait saatler yükleniyor…
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : availability && !availability.isOpen ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{availability.message ?? "Bu gün kliniğimiz kapalıdır."}</span>
          </div>
        ) : availability && availability.slots.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-4">
            Bu gün için müsait saat bulunmuyor.
          </div>
        ) : availability ? (
          <div>
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">
                Müsait saatler{" "}
                {availability.workingHours && (
                  <span className="text-slate-500">
                    (Mesai {availability.workingHours.open} -{" "}
                    {availability.workingHours.close})
                  </span>
                )}
              </span>
              <span className="text-slate-500">
                {availability.slots.filter((s) => s.available).length} müsait
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {availability.slots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => onChange(selectedDate, slot.time)}
                    title={
                      !slot.available
                        ? slot.reason === "BOOKED"
                          ? "Bu saat dolu"
                          : slot.reason === "PAST"
                            ? "Geçmiş saat"
                            : "Mesai dışı"
                        : "Seç"
                    }
                    className={cn(
                      "flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                      slot.available && !isSelected &&
                        "border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50",
                      slot.available && isSelected &&
                        "bg-emerald-700 text-white shadow-sm",
                      !slot.available &&
                        "cursor-not-allowed border border-slate-100 bg-slate-50 text-slate-300 line-through"
                    )}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm border border-emerald-200 bg-white" />
                Müsait
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-700" />
                Seçili
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-100" />
                Dolu / Geçmiş
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
