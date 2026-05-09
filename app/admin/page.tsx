import { Inbox, CheckCircle2, Clock4, TrendingUp, ArrowRight, ShieldAlert, Globe, Star, Clock } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

async function getStats() {
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);

  const [pending, approvedToday, weekRequests, recentApproved] = await Promise.all([
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.count({
      where: { status: "APPROVED", approvedAt: { gte: startOfDay } },
    }),
    prisma.appointment.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.appointment.findMany({
      where: { status: "APPROVED", approvedAt: { not: null, gte: startOfWeek } },
      select: { createdAt: true, approvedAt: true },
      take: 50,
    }),
  ]);

  // Ortalama onay süresi (dakika)
  let avgApprovalMin = 0;
  if (recentApproved.length > 0) {
    const total = recentApproved.reduce((acc, a) => {
      if (!a.approvedAt) return acc;
      return acc + (a.approvedAt.getTime() - a.createdAt.getTime());
    }, 0);
    avgApprovalMin = Math.round(total / recentApproved.length / 60000);
  }

  return { pending, approvedToday, weekRequests, avgApprovalMin };
}

export default async function AdminHomePage() {
  const [{ pending, approvedToday, weekRequests, avgApprovalMin }, session] =
    await Promise.all([getStats(), auth()]);

  // 2FA durumu — banner için
  let totpEnabled = true;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totpEnabled: true },
    });
    totpEnabled = user?.totpEnabled ?? false;
  }

  const stats = [
    {
      label: "Onay Bekleyen",
      value: String(pending),
      delta: pending > 0 ? "Hemen ilgilenin" : "Sıfır kuyruk",
      icon: Inbox,
      accent: "bg-amber-50 text-amber-700",
    },
    {
      label: "Bugün Onaylanan",
      value: String(approvedToday),
      delta: "Son 24 saat",
      icon: CheckCircle2,
      accent: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Ortalama Onay Süresi",
      value: avgApprovalMin > 0 ? `${avgApprovalMin} dk` : "—",
      delta: "Son 7 gün",
      icon: Clock4,
      accent: "bg-teal-50 text-teal-700",
    },
    {
      label: "Bu Hafta Talep",
      value: String(weekRequests),
      delta: "Toplam",
      icon: TrendingUp,
      accent: "bg-green-50 text-green-700",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          İyi günler 🌿
        </h1>
        <p className="mt-1 text-slate-600">
          {pending > 0
            ? `Bugün ${pending} randevu talebi onayınızı bekliyor.`
            : "Onay kuyruğu boş — harika!"}
        </p>
      </div>

      {/* 2FA aktif değilse banner */}
      {!totpEnabled && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <ShieldAlert className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Hesabınızı 2FA ile koruyun
                </h3>
                <p className="mt-0.5 text-sm text-slate-600">
                  İki faktörlü doğrulama, şifreniz çalınsa bile hesabınızı güvende tutar.
                </p>
              </div>
            </div>
            <Button asChild variant="primary" size="sm">
              <Link href="/admin/security">
                Hemen Etkinleştir
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="text-sm font-medium text-slate-600">{s.label}</div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.accent}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                {s.value}
              </div>
              <div className="mt-1 text-xs text-slate-500">{s.delta}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pending > 0 && (
          <Card>
            <CardContent className="flex flex-col items-start gap-4 p-6">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                  <Inbox className="h-5 w-5 text-amber-700" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900">
                  Onay bekleyen {pending} randevu var
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Hızlıca inceleyip onay/red ile süreci tamamlayabilirsiniz.
                </p>
              </div>
              <Button asChild variant="primary">
                <Link href="/admin/inbox">
                  Onay Kuyruğuna Git
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                Onaylı randevuları görüntüleyin
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Onaylanmış tüm randevularınızın listesine ve takvim görünümüne ulaşın.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/appointments?status=APPROVED">
                  Onaylı Randevular
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/calendar">Takvimde Gör</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Site Kontrolü kartı */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Globe className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Site Kontrolü
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Tek sayfa sitenizin içeriğini ve müsaitlik ayarlarınızı buradan
                yönetin.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
            >
              <Clock className="h-4 w-4 text-emerald-700" />
              <div>
                <div className="font-medium text-slate-900">
                  Çalışma Saatleri
                </div>
                <div className="text-xs text-slate-500">
                  Açılış / kapanış saatleri
                </div>
              </div>
            </Link>

            <Link
              href="/admin/testimonials"
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
            >
              <Star className="h-4 w-4 text-emerald-700" />
              <div>
                <div className="font-medium text-slate-900">
                  Danışan Yorumları
                </div>
                <div className="text-xs text-slate-500">
                  Landing'de gösterilen yorumlar
                </div>
              </div>
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
            >
              <Globe className="h-4 w-4 text-emerald-700" />
              <div>
                <div className="font-medium text-slate-900">
                  Klinik Bilgileri
                </div>
                <div className="text-xs text-slate-500">
                  İletişim, adres, KVKK
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
