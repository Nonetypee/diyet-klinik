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
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const handleApprove = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/appointments/${id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Onay işlemi başarısız");
      }
      setList((prev) => prev.filter((x) => x.id !== id));
      toast({
        variant: "success",
        title: "Randevu onaylandı",
        description: "Danışana bilgilendirme SMS'i gönderildi.",
      });
      router.refresh();
    } catch (e) {
      toast({
        variant: "error",
        title: "Onay verilemedi",
        description: e instanceof Error ? e.message : "Hata oluştu",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!reason.trim() || reason.trim().length < 3) {
      toast({
        variant: "error",
        title: "Red sebebi gerekli",
        description: "Lütfen kısa bir açıklama yazınız.",
      });
      return;
    }
    setBusy(id);
    try {
      const res = await fetch(`/api/appointments/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Red işlemi başarısız");
      }
      setList((prev) => prev.filter((x) => x.id !== id));
      setRejectingId(null);
      setReason("");
      toast({
        variant: "info",
        title: "Randevu reddedildi",
        description: "Danışana alternatif önerisi SMS olarak iletildi.",
      });
      router.refresh();
    } catch (e) {
      toast({
        variant: "error",
        title: "İşlem yapılamadı",
        description: e instanceof Error ? e.message : "Hata oluştu",
      });
    } finally {
      setBusy(null);
    }
  };

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
        const isRejecting = rejectingId === req.id;
        const isBusy = busy === req.id;
        const minutesAgo = Math.floor(
          (Date.now() - new Date(req.createdAt).getTime()) / 60000
        );

        return (
          <Card key={req.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="space-y-3">
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
                      label="Hekim"
                      value={req.doctorName ?? "Farketmez"}
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

                {/* Aksiyon butonları (desktop sağ) */}
                {!isRejecting && (
                  <div className="flex gap-2 sm:flex-col">
                    <Button
                      variant="success"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleApprove(req.id)}
                      disabled={isBusy}
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Onayla
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setRejectingId(req.id)}
                      disabled={isBusy}
                    >
                      <X className="h-4 w-4" />
                      Reddet
                    </Button>
                  </div>
                )}
              </div>

              {/* Red gerekçesi formu */}
              {isRejecting && (
                <div className="border-t border-slate-200 bg-slate-50 p-6">
                  <label className="text-sm font-medium text-slate-900">
                    Red sebebini hastaya bildirin
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="Örn: Talep ettiğiniz saat dolu. 14:30 müsait, uygunsa onaylayalım."
                    className="mt-2 bg-white"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(req.id)}
                      disabled={isBusy}
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Red Bildirimi Gönder
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRejectingId(null);
                        setReason("");
                      }}
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
