"use client";

import Link from "next/link";
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  Inbox,
  CheckCircle2,
  XCircle,
  CircleSlash,
  CheckCheck,
  MessageSquare,
  ListFilter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatTRDateOnly, formatTRTime } from "@/lib/utils";

type Status = "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED" | "CANCELLED";

interface Item {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  serviceName: string;
  dieticianName: string | null;
  requestedAt: string;
  approvedAt: string | null;
  status: string;
  note: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

const STATUS_META: Record<
  Status,
  {
    label: string;
    color: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ElementType;
  }
> = {
  PENDING: {
    label: "Onay Bekliyor",
    color: "amber",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-l-amber-500",
    icon: Inbox,
  },
  APPROVED: {
    label: "Onaylandı",
    color: "emerald",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-l-emerald-500",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: "Tamamlandı",
    color: "slate",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-l-slate-500",
    icon: CheckCheck,
  },
  REJECTED: {
    label: "Reddedildi",
    color: "red",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-l-red-500",
    icon: XCircle,
  },
  CANCELLED: {
    label: "İptal",
    color: "slate",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-l-slate-400",
    icon: CircleSlash,
  },
};

interface Props {
  items: Item[];
  currentFilter: string;
  counts: {
    all: number;
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
    cancelled: number;
  };
}

const TABS: { value: string; label: string; key: keyof Props["counts"] }[] = [
  { value: "ALL",       label: "Tümü",         key: "all" },
  { value: "PENDING",   label: "Bekliyor",     key: "pending" },
  { value: "APPROVED",  label: "Onaylı",       key: "approved" },
  { value: "COMPLETED", label: "Tamamlandı",   key: "completed" },
  { value: "REJECTED",  label: "Reddedilen",   key: "rejected" },
  { value: "CANCELLED", label: "İptal",        key: "cancelled" },
];

export function AppointmentsList({ items, currentFilter, counts }: Props) {
  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-slate-500">
            <ListFilter className="h-3.5 w-3.5" />
            Filtre:
          </div>
          {TABS.map((tab) => {
            const isActive = currentFilter === tab.value;
            const count = counts[tab.key];
            return (
              <Link
                key={tab.value}
                href={tab.value === "ALL" ? "/admin/appointments" : `/admin/appointments?status=${tab.value}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-700 text-white"
                    : "text-slate-700 hover:bg-emerald-50"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Empty state */}
      {items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <Inbox className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              Bu filtrede randevu bulunmuyor
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Farklı bir durum seçerek tekrar deneyin.
            </p>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="space-y-3">
        {items.map((item) => {
          const status = (STATUS_META[item.status as Status] ?? STATUS_META.PENDING);
          const Icon = status.icon;

          return (
            <Card
              key={item.id}
              className={cn("overflow-hidden border-l-4", status.border)}
            >
              <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">
                      {item.patientName}
                    </h3>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                        status.bg,
                        status.text
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatTRDateOnly(item.requestedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {formatTRTime(item.requestedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {item.patientPhone}
                    </span>
                    {item.patientEmail && (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {item.patientEmail}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline">{item.serviceName}</Badge>
                    {item.dieticianName && (
                      <span className="text-xs text-slate-500">
                        {item.dieticianName}
                      </span>
                    )}
                  </div>

                  {item.note && (
                    <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{item.note}</span>
                    </div>
                  )}

                  {item.rejectionReason && (
                    <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
                      <strong className="font-semibold">Red sebebi: </strong>
                      {item.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="text-right text-xs text-slate-500">
                  {item.approvedAt && (
                    <div>
                      Onay: {formatTRDateOnly(item.approvedAt)}{" "}
                      {formatTRTime(item.approvedAt)}
                    </div>
                  )}
                  <div>
                    Talep: {formatTRDateOnly(item.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
