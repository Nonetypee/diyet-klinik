import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  canManageUsers,
  normalizeRole,
} from "@/lib/permissions";
import { UsersManager } from "@/components/admin/users-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kullanıcı Yönetimi" };

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?from=/admin/users");
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  const myRole = normalizeRole(me?.role);
  if (!canManageUsers(myRole)) {
    redirect("/admin");
  }

  const users = await prisma.user.findMany({
    where: {
      // DEVELOPER hesapları panelde gizli — yalnızca .env üzerinden yönetilir.
      role: { notIn: ["DEVELOPER", "SUPER_ADMIN"] },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      totpEnabled: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Kullanıcı Yönetimi
        </h1>
        <p className="mt-1 text-slate-600">
          Sisteme giriş yapabilen hesapları yönetin. Roller: Yönetici
          (ayarlar & kullanıcı), Yetkili (sadece günlük işler).
        </p>
      </div>

      <UsersManager
        currentUserId={me?.id ?? ""}
        currentRole={myRole}
        initialUsers={users.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          fullName: u.fullName,
          phone: u.phone,
          role: normalizeRole(u.role),
          isActive: u.isActive,
          totpEnabled: u.totpEnabled,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
