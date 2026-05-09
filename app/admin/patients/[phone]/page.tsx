import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  ShieldCheck,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle2,
  Inbox,
  XCircle,
  CheckCheck,
  AlertCircle,
  FileText,
  MessageCircleMore,
  Send,
} from "lucide-react";
import { auth } from "@/auth";
import { getPatientFile } from "@/lib/patients";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/admin/print-button";
import { formatTRDate, formatTRDateOnly } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "Bekliyor",
    bg: "bg-amber-50",
    text: "text-amber-800",
    icon: Inbox,
  },
  APPROVED: {
    label: "Onaylı",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: "Tamamlandı",
    bg: "bg-slate-100",
    text: "text-slate-700",
    icon: CheckCheck,
  },
  REJECTED: {
    label: "Reddedildi",
    bg: "bg-red-50",
    text: "text-red-800",
    icon: XCircle,
  },
  CANCELLED: {
    label: "İptal",
    bg: "bg-slate-100",
    text: "text-slate-600",
    icon: XCircle,
  },
  NO_SHOW: {
    label: "Gelmedi",
    bg: "bg-slate-100",
    text: "text-slate-600",
    icon: AlertCircle,
  },
};

const SMS_STATUS_META: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  SENT:      { label: "Gönderildi",  bg: "bg-emerald-50", text: "text-emerald-800" },
  DELIVERED: { label: "Ulaştı",      bg: "bg-emerald-50", text: "text-emerald-800" },
  FAILED:    { label: "Başarısız",   bg: "bg-red-50",     text: "text-red-800"     },
  QUEUED:    { label: "Kuyrukta",    bg: "bg-slate-100",  text: "text-slate-700"   },
};

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?from=/admin/patients");
  }

  const { phone } = await params;
  const phoneKey = decodeURIComponent(phone);
  const file = await getPatientFile(phoneKey);

  if (!file) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/patients"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tüm Hastalar
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {file.latestName}
          </h1>
          <p className="mt-1 text-slate-600">
            Hasta dosyası — randevu, mesaj ve onay kayıtları.
          </p>
        </div>
        {/* Tarayıcının native print fonksiyonu — hukuki kayıt için PDF olarak kaydedilebilir */}
        <PrintButton />
      </div>

      {/* Üst bilgi kartı */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              icon={Phone}
              label="Telefon"
              value={file.phoneDisplay}
              monospace
            />
            <InfoItem
              icon={Mail}
              label="E-posta"
              value={file.latestEmail ?? "—"}
            />
            <InfoItem
              icon={Calendar}
              label="İlk Talep"
              value={formatTRDateOnly(file.firstSeenAt)}
            />
            <InfoItem
              icon={Clock}
              label="Son Aktivite"
              value={formatTRDateOnly(file.lastSeenAt)}
            />
          </div>

          {file.allNames.length > 1 && (
            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/60 p-3 text-xs text-amber-900">
              <strong>Farklı isimler kullanıldı:</strong>{" "}
              {file.allNames.join(", ")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Randevu Geçmişi */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <FileText className="h-5 w-5 text-emerald-700" />
          Randevu Geçmişi
          <span className="text-sm font-normal text-slate-500">
            ({file.appointments.length} kayıt)
          </span>
        </h2>

        <div className="space-y-3">
          {file.appointments.map((a) => {
            const status = STATUS_META[a.status] ?? STATUS_META.PENDING;
            const StatusIcon = status.icon;
            return (
              <Card key={a.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {a.serviceName}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                            status.bg,
                            status.text
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                        {a.kvkkConsent && (
                          <Badge variant="primary">
                            <ShieldCheck className="h-3 w-3" />
                            KVKK Onayı
                          </Badge>
                        )}
                      </div>

                      <div className="grid gap-2 text-sm sm:grid-cols-3">
                        <div>
                          <div className="text-xs text-slate-500">
                            Ad (talep anında)
                          </div>
                          <div className="font-medium text-slate-900">
                            {a.patientName}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">
                            Talep Tarihi
                          </div>
                          <div className="font-medium text-slate-900">
                            {formatTRDate(a.createdAt)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">
                            Randevu Tarihi
                          </div>
                          <div className="font-medium text-slate-900">
                            {formatTRDate(a.requestedAt)}
                          </div>
                        </div>
                        {a.approvedAt && (
                          <div>
                            <div className="text-xs text-slate-500">
                              Onay Zamanı
                            </div>
                            <div className="font-medium text-emerald-700">
                              {formatTRDate(a.approvedAt)}
                            </div>
                          </div>
                        )}
                        {a.kvkkConsentAt && (
                          <div>
                            <div className="text-xs text-slate-500">
                              KVKK Onay Anı
                            </div>
                            <div className="font-medium text-slate-900">
                              {formatTRDate(a.kvkkConsentAt)}
                            </div>
                          </div>
                        )}
                        {a.dieticianName && (
                          <div>
                            <div className="text-xs text-slate-500">
                              Diyetisyen
                            </div>
                            <div className="font-medium text-slate-900">
                              {a.dieticianName}
                            </div>
                          </div>
                        )}
                        {a.source && (
                          <div>
                            <div className="text-xs text-slate-500">Kanal</div>
                            <div className="font-medium text-slate-900">
                              {a.source}
                            </div>
                          </div>
                        )}
                        {a.ipAddress && (
                          <div>
                            <div className="text-xs text-slate-500">IP</div>
                            <code className="font-mono text-xs text-slate-700">
                              {a.ipAddress}
                            </code>
                          </div>
                        )}
                      </div>

                      {a.patientNote && (
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          <strong className="text-slate-900">Not: </strong>
                          {a.patientNote}
                        </div>
                      )}

                      {a.rejectionReason && (
                        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
                          <strong>Red Sebebi: </strong>
                          {a.rejectionReason}
                        </div>
                      )}

                      {a.messageCount > 0 && (
                        <div className="text-xs text-slate-500">
                          <MessageSquare className="mr-1 inline h-3 w-3" />
                          Bu randevu için {a.messageCount} mesaj gönderildi
                          (aşağıda)
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Mesaj Geçmişi */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <MessageCircleMore className="h-5 w-5 text-emerald-700" />
          Mesaj Geçmişi (WhatsApp / SMS)
          <span className="text-sm font-normal text-slate-500">
            ({file.messages.length} kayıt)
          </span>
        </h2>

        {file.messages.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              Henüz hiçbir mesaj gönderilmemiş.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {file.messages.map((m) => {
              const smsStatus =
                SMS_STATUS_META[m.status] ?? SMS_STATUS_META.QUEUED;
              const channelLabel =
                m.provider === "WHATSAPP" ? "WhatsApp" : m.provider;

              return (
                <Card key={m.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          m.provider === "WHATSAPP"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        )}
                      >
                        <Send className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-semibold text-slate-900">
                            {channelLabel}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                              smsStatus.bg,
                              smsStatus.text
                            )}
                          >
                            {smsStatus.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            {m.sentAt
                              ? formatTRDate(m.sentAt)
                              : formatTRDate(m.createdAt)}
                          </span>
                        </div>

                        <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
                          {m.message}
                        </div>

                        {m.errorMessage && (
                          <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-800">
                            <strong>Hata: </strong>
                            {m.errorMessage}
                          </div>
                        )}

                        {m.providerMessageId && (
                          <div className="mt-2 text-xs text-slate-400">
                            Sağlayıcı ID:{" "}
                            <code className="font-mono">
                              {m.providerMessageId}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Hukuki not */}
      <Card className="border-slate-200 bg-slate-50/60">
        <CardContent className="p-5 text-xs leading-relaxed text-slate-600">
          <strong className="text-slate-900">Hukuki Kayıt Bildirimi:</strong>{" "}
          Bu sayfada gösterilen tüm tarihler, mesajlar ve KVKK onay zamanları
          DB'de kalıcı olarak saklanır. Hasta dosyası 6698 sayılı Kanun
          kapsamında en az 10 yıl boyunca arşivlenir. Yedekler her gün otomatik
          alınır.
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  monospace,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  monospace?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-slate-500">{label}</div>
        <div
          className={cn(
            "truncate font-medium text-slate-900",
            monospace && "font-mono text-sm"
          )}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
