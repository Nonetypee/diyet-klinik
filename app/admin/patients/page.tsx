import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Inbox,
  XCircle,
  CheckCheck,
} from "lucide-react";
import { auth } from "@/auth";
import { listPatients } from "@/lib/patients";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTRDateOnly } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hasta Dosyaları" };

export default async function PatientsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?from=/admin/patients");
  }

  const patients = await listPatients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Hasta Dosyaları
        </h1>
        <p className="mt-1 text-slate-600">
          Telefon numarası bazlı kayıt — her danışanın geçmişi, KVKK onay
          tarihi, gönderilen tüm mesajlar ve randevu durumları arşivlenir.
          Bu kayıtlar hukuki belgelendirme için tutulur.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-700" />
              <span className="font-semibold text-slate-900">
                {patients.length}
              </span>
              <span className="text-slate-600">benzersiz danışan</span>
            </div>
            <div className="text-slate-300">·</div>
            <div className="text-slate-600">
              Toplam{" "}
              <span className="font-semibold text-slate-900">
                {patients.reduce((acc, p) => acc + p.totalAppointments, 0)}
              </span>{" "}
              randevu kaydı
            </div>
          </div>
        </CardContent>
      </Card>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Henüz hasta kaydı yok
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Randevu talebi geldiğinde burada otomatik dosya açılır.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <Link
              key={p.phoneKey}
              href={`/admin/patients/${encodeURIComponent(p.phoneKey)}` as any}
              className="block"
            >
              <Card className="transition-colors hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-100/30">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <Users className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {p.latestName}
                      </h3>
                      {p.allNames.length > 1 && (
                        <span
                          title={p.allNames.join(", ")}
                          className="text-xs text-slate-500"
                        >
                          (+{p.allNames.length - 1} ad)
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {p.phoneDisplay}
                      </span>
                      {p.latestEmail && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {p.latestEmail}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        İlk: {formatTRDateOnly(p.firstSeenAt)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                        <span className="font-semibold">
                          {p.totalAppointments}
                        </span>{" "}
                        toplam
                      </span>
                      {p.pendingCount > 0 && (
                        <Badge variant="warning">
                          <Inbox className="h-3 w-3" />
                          {p.pendingCount} bekliyor
                        </Badge>
                      )}
                      {p.approvedCount > 0 && (
                        <Badge variant="success">
                          <CheckCircle2 className="h-3 w-3" />
                          {p.approvedCount} onaylı
                        </Badge>
                      )}
                      {p.completedCount > 0 && (
                        <Badge variant="default">
                          <CheckCheck className="h-3 w-3" />
                          {p.completedCount} tamamlandı
                        </Badge>
                      )}
                      {p.rejectedCount > 0 && (
                        <Badge variant="danger">
                          <XCircle className="h-3 w-3" />
                          {p.rejectedCount} reddedildi
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
