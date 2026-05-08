"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Bell,
  Inbox,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = "PENDING_NEW" | "APPROVED" | "REJECTED";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  href: string;
  createdAt: string;
}

const TYPE_META: Record<
  NotificationType,
  { icon: React.ElementType; bg: string; text: string }
> = {
  PENDING_NEW: { icon: Inbox,        bg: "bg-amber-100",   text: "text-amber-700" },
  APPROVED:    { icon: CheckCircle2, bg: "bg-emerald-100", text: "text-emerald-700" },
  REJECTED:    { icon: XCircle,      bg: "bg-red-100",     text: "text-red-700" },
};

export function NotificationsBell({ pendingCount }: { pendingCount: number }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Dropdown dışına tıklayınca kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Açıldığında verileri çek
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data: Notification[]) => setNotifications(data))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-100 bg-white transition-colors hover:bg-emerald-50"
        aria-label="Bildirimler"
      >
        <Bell className="h-4 w-4 text-slate-700" />
        {pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-xl shadow-emerald-100/30 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Bildirimler</div>
              <div className="text-xs text-slate-500">
                {pendingCount > 0
                  ? `${pendingCount} onay bekliyor`
                  : "Tüm talepler değerlendirildi"}
              </div>
            </div>
            <Link
              href="/admin/inbox"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Tümünü gör
            </Link>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">
                  Yeni bildirim yok
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Yeni randevu talepleri burada görünür.
                </p>
              </div>
            )}

            {!loading && notifications.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {notifications.map((n) => {
                  const meta = TYPE_META[n.type];
                  return (
                    <li key={n.id}>
                      <Link
                        href={n.href as Route}
                        onClick={() => setOpen(false)}
                        className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-emerald-50/50"
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            meta.bg,
                            meta.text
                          )}
                        >
                          <meta.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900">
                            {n.title}
                          </div>
                          <div className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                            {n.description}
                          </div>
                          <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                            {timeAgo(n.createdAt)}
                          </div>
                        </div>
                        <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-emerald-600" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}
