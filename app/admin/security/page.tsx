import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseBackupCodes, unusedBackupCount } from "@/lib/totp";
import { SecuritySettings } from "@/components/admin/security-settings";
import { BackupPanel } from "@/components/admin/backup-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Güvenlik & 2FA" };

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?from=/admin/security");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      totpEnabled: true,
      totpVerifiedAt: true,
      backupCodes: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const records = parseBackupCodes(user.backupCodes);
  const unusedCount = unusedBackupCount(records);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Güvenlik & 2FA
        </h1>
        <p className="mt-1 text-slate-600">
          İki faktörlü doğrulamayı etkinleştirerek hesabınızı koruyun.
        </p>
      </div>

      <SecuritySettings
        user={{
          email: user.email,
          fullName: user.fullName,
          totpEnabled: user.totpEnabled,
          totpVerifiedAt: user.totpVerifiedAt?.toISOString() ?? null,
          lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
          unusedBackupCodes: unusedCount,
          totalBackupCodes: records.length,
        }}
      />

      {/* Veri Yedekleme & Geri Yükleme */}
      <BackupPanel />
    </div>
  );
}
