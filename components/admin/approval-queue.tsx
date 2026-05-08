"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Phone,
  User,
  MessageSquare,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { formatTRTime, formatTRDateOnly } from "@/lib/utils";

interface ApprovalRequest {
  id: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
  doctorName: string | null;
  requestedAt: string;
  note: string | null;
  createdAt: string;
}

export function ApprovalQueue({ items }: { items: ApprovalRequest[] }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function handleApiAction(
    id: string,
    action: "approve" | "reject",
    body?: object
  ) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/appointments/${id}/${action}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.status === 401) {
        toast({
          variant: "error",
          title: "Oturum süresi doldu",
          description: "Lütfen tekrar giriş yapın.",
        });
        router.push("/login?from=/admin/inbox");
        return false;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.details ?? data?.message ?? `İşlem başarısız (HTTP ${res.status})`;
        throw new Error(msg);
      }

      setList((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
      return true;
    } catch (err) {
      toast({
        variant: "error",
        title: action === "approve" ? "Onay verilemedi" : "Red işlemi yapılamadı",
        description: err instanceof Error ? err.message : "Beklenmeyen hata",
      });
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function onApprove(id: string) {
    const ok = await handleApiAction(id, "approve");
    if (ok) {
      toast({
        variant: "success",
        title: "Randevu onaylandı",
        description: "Danışana bilgilendirme mesajı gönderildi.",
      });
    }
  }

  async function onReject(id: string) {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      toast({
        variant: "error",
        title: "Red sebebi gerekli",
        description: "Lütfen en az 3 karakterlik bir açıklama yazınız.",
      });
      return;
    }
    const ok = await handleApiAction(id, "reject", { reason: trimmed });
    if (ok) {
      setRejectingId(null);
      setReason("");
      toast({
        variant: "info",
        title: "Randevu reddedildi",
        description: "Danışana bildirim gönderildi.",
      });
    }
  }

  if (list.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <Check className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">
            Tüm talepler işlendi
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Onay bekleyen randevu kalmadı. Harika iş!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {list.map((req) => {
        const isRejectingThis = rejectingId === req.id;
        const isBusyThis = busyId === req.id;
        const minutesAgo = Math.floor(
          (Date.now() - new Date(req.createdAt).getTime()) / 60000
        );

        return (
          <Card key={req.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* ÜST: Hasta bilgileri */}
              <div className="space-y-3 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {req.patientName}
                  </h3>
                  <Badge variant="warning">Onay bekliyor</Badge>
                  <span className="text-xs text-slate-500">
                    {minutesAgo < 60
                      ? `${minutesAgo} dk önce`
                      : `${Math.floor(minutesAgo / 60)} sa önce`}
                  </span>
                </div>

                <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <Field icon={Phone} label="Telefon" value={req.patientPhone} />
                  <Field
                    icon={User}
                    label="Diyetisyen"
                    value={req.doctorName ?? "Otomatik atanacak"}
                  />
                  <Field
                    icon={Calendar}
                    label="Tarih"
                    value={formatTRDateOnly(req.requestedAt)}
                  />
                  <Field
                    icon={Clock}
                    label="Saat"
                    value={formatTRTime(req.requestedAt)}
                  />
                </div>

                <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Hizmet: </span>
                  {req.serviceName}
                </div>

                {req.note && (
                  <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-slate-600">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>{req.note}</span>
                  </div>
                )}
              </div>

              {/* ALT: Aksiyon butonları — HER ZAMAN GÖRÜNÜR */}
              {!isRejectingThis ? (
                <div
                  className="flex gap-3 border-t border-slate-200 bg-slate-50/60 p-4"
                  data-testid="approval-actions"
                >
                  <button
                    type="button"
                    onClick={() => onApprove(req.id)}
                    disabled={isBusyThis}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {isBusyThis ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        İşleniyor…
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Onayla
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(req.id);
                      setReason("");
                    }}
                    disabled={isBusyThis}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Reddet
                  </button>
                </div>
              ) : (
                /* Red gerekçesi formu */
                <div className="border-t border-red-200 bg-red-50/60 p-4">
                  <label
                    htmlFor={`reason-${req.id}`}
                    className="text-sm font-medium text-slate-900"
                  >
                    Red sebebini danışana bildirin
                  </label>
                  <Textarea
                    id={`reason-${req.id}`}
                    rows={3}
                    placeholder="Örn: Talep ettiğiniz saat dolu. 14:30 müsait, uygunsa onaylayabilirim."
                    className="mt-2 bg-white"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={isBusyThis}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => onReject(req.id)}
                      disabled={isBusyThis || reason.trim().length < 3}
                    >
                      {isBusyThis ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      {isBusyThis ? "Gönderiliyor…" : "Red Bildirimi Gönder"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRejectingId(null);
                        setReason("");
                      }}
                      disabled={isBusyThis}
                    >
                      Vazgeç
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="text-slate-500">{label}:</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
