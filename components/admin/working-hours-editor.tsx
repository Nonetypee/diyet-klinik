"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toaster";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_LABELS: Record<(typeof DAY_KEYS)[number], string> = {
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
  saturday: "Cumartesi",
  sunday: "Pazar",
};

interface DayHours {
  open?: string;
  close?: string;
  closed?: boolean;
}

interface Props {
  initialHours: Record<string, DayHours>;
}

const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "18:00";

export function WorkingHoursEditor({ initialHours }: Props) {
  const router = useRouter();
  const [hours, setHours] = useState<Record<string, DayHours>>(() => {
    const result: Record<string, DayHours> = {};
    for (const day of DAY_KEYS) {
      const day_ = initialHours[day];
      result[day] = day_
        ? { ...day_ }
        : { open: DEFAULT_OPEN, close: DEFAULT_CLOSE, closed: false };
    }
    return result;
  });
  const [saving, setSaving] = useState(false);

  function updateDay(day: string, patch: Partial<DayHours>) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...patch },
    }));
  }

  function toggleClosed(day: string, closed: boolean) {
    if (closed) {
      updateDay(day, { closed: true });
    } else {
      // Açıyorsak open/close yoksa varsayılan ata
      const current = hours[day];
      updateDay(day, {
        closed: false,
        open: current.open ?? DEFAULT_OPEN,
        close: current.close ?? DEFAULT_CLOSE,
      });
    }
  }

  async function save() {
    setSaving(true);
    try {
      // Validation: kapalı değilse open + close zorunlu
      for (const day of DAY_KEYS) {
        const h = hours[day];
        if (!h.closed) {
          if (!h.open || !h.close) {
            toast({
              variant: "error",
              title: `${DAY_LABELS[day]} için saat eksik`,
              description: "Lütfen açılış ve kapanış saatlerini girin.",
            });
            setSaving(false);
            return;
          }
          if (h.close <= h.open) {
            toast({
              variant: "error",
              title: `${DAY_LABELS[day]} için saat hatalı`,
              description: "Kapanış saati açılışın sonrası olmalı.",
            });
            setSaving(false);
            return;
          }
        }
      }

      const res = await fetch("/api/settings/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hours),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message ?? "Kaydedilemedi");
      }

      toast({
        variant: "success",
        title: "Çalışma saatleri kaydedildi",
        description:
          "Yeni saatler randevu formunda hemen geçerli olacak.",
      });
      router.refresh();
    } catch (e) {
      toast({
        variant: "error",
        title: "Hata",
        description: e instanceof Error ? e.message : "Bilinmeyen hata",
      });
    } finally {
      setSaving(false);
    }
  }

  function copyToAllWeekdays() {
    const monday = hours.monday;
    if (monday.closed) return;
    const weekdays: (typeof DAY_KEYS)[number][] = [
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ];
    setHours((prev) => {
      const next = { ...prev };
      for (const d of weekdays) {
        next[d] = { ...monday };
      }
      return next;
    });
    toast({
      variant: "info",
      title: "Hafta içi günlere kopyalandı",
      description: "Pazartesi saatleri Sal-Cum'a uygulandı.",
    });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-emerald-100">
        <table className="w-full text-sm">
          <thead className="bg-emerald-50/50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
              <th className="px-4 py-3">Gün</th>
              <th className="px-4 py-3">Açık mı?</th>
              <th className="px-4 py-3">Açılış</th>
              <th className="px-4 py-3">Kapanış</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100">
            {DAY_KEYS.map((day) => {
              const h = hours[day];
              const isClosed = h.closed === true;
              return (
                <tr key={day} className="bg-white">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {DAY_LABELS[day]}
                  </td>
                  <td className="px-4 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={!isClosed}
                        onCheckedChange={(checked) =>
                          toggleClosed(day, checked !== true)
                        }
                      />
                      <span className="text-xs text-slate-600">
                        {isClosed ? "Kapalı" : "Açık"}
                      </span>
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="time"
                      value={h.open ?? ""}
                      disabled={isClosed}
                      onChange={(e) =>
                        updateDay(day, { open: e.target.value })
                      }
                      className="h-9 max-w-[140px]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="time"
                      value={h.close ?? ""}
                      disabled={isClosed}
                      onChange={(e) =>
                        updateDay(day, { close: e.target.value })
                      }
                      className="h-9 max-w-[140px]"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={copyToAllWeekdays}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:underline"
        >
          <Clock className="h-3.5 w-3.5" />
          Pazartesi'yi hafta içine kopyala
        </button>

        <Button
          type="button"
          variant="primary"
          onClick={save}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Çalışma Saatlerini Kaydet
        </Button>
      </div>
    </div>
  );
}
