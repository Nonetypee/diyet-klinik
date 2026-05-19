import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  CalendarDays,
  Settings,
  Leaf,
  ClipboardList,
  ShieldCheck,
  Star,
  Salad,
  Users,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { auth, signOut } from "@/auth";
import {
  canManageServices,
  canManageSettings,
  canManageTestimonials,
  canManageUsers,
  normalizeRole,
  ROLE_LABELS,
  ROLES,
} from "@/lib/permissions";
import { NotificationsBell } from "@/components/admin/notifications-bell";
import { UserMenu } from "@/components/admin/user-menu";
import { SessionProvider } from "@/components/providers/session-provider";

export const metadata = {
  title: "Yönetim Paneli",
};

export const dynamic = "force-dynamic";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth — middleware zaten /admin'i koruyor ama defansif olalım
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?from=/admin");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      username: true,
      email: true,
      fullName: true,
    },
  });
  if (!dbUser) {
    await signOut({
      redirectTo: "/login?from=/admin&error=session_expired",
    });
    redirect("/login?from=/admin&error=session_expired");
  }

  const role = normalizeRole(dbUser.role);
  const pendingCount = await prisma.appointment.count({
    where: { status: "PENDING" },
  });

  const fullNav: {
    href: Route;
    label: string;
    icon: LucideIcon;
    badge?: number;
    show: boolean;
  }[] = [
    { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard, show: true },
    {
      href: "/admin/inbox",
      label: "Onay Bekleyenler",
      icon: Inbox,
      badge: pendingCount,
      show: true,
    },
    {
      href: "/admin/appointments",
      label: "Tüm Randevular",
      icon: ClipboardList,
      show: true,
    },
    { href: "/admin/patients", label: "Hasta Dosyaları", icon: Users, show: true },
    { href: "/admin/calendar", label: "Takvim", icon: CalendarDays, show: true },
    {
      href: "/admin/services",
      label: "Hizmetler",
      icon: Salad,
      show: canManageServices(role),
    },
    {
      href: "/admin/testimonials",
      label: "Yorumlar",
      icon: Star,
      show: canManageTestimonials(role),
    },
    {
      href: "/admin/users",
      label: "Kullanıcı Yönetimi",
      icon: UserCog,
      show: canManageUsers(role),
    },
    {
      href: "/admin/security",
      label: "Güvenlik & 2FA",
      icon: ShieldCheck,
      show: true,
    },
    {
      href: "/admin/settings",
      label: "Ayarlar",
      icon: Settings,
      show: canManageSettings(role),
    },
  ];

  const NAV = fullNav.filter((item) => item.show);

  // Sidebar'da öne çıkan etiket: kullanıcı adı; alt etiket: ad soyad.
  const primaryLabel = dbUser.username ?? dbUser.email ?? "Yönetici";
  const secondaryLabel = dbUser.fullName ?? "";
  const initials = getInitials(primaryLabel);

  // Developer rolü panelde "Yönetici" olarak gösterilir; istisna: hesabın
  // sahibi kendi paneline girerse kendi rolünü gerçek adıyla görür.
  const roleBadge =
    role === ROLES.DEVELOPER ? "Developer" : ROLE_LABELS[role];

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-emerald-50/20">
        {/* Sidebar (md+) */}
        <aside className="hidden w-64 flex-col border-r border-emerald-100 bg-white md:flex">
          <div className="flex h-16 items-center border-b border-emerald-100 px-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700">
                <Leaf className="h-4 w-4 text-white" strokeWidth={2.25} />
              </div>
              <span className="text-base font-semibold tracking-tight text-slate-900">
                Yönetim Paneli
              </span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-emerald-50"
              >
                <item.icon className="h-4 w-4 text-slate-500 group-hover:text-emerald-700" />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-700 px-1.5 text-xs font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="border-t border-emerald-100 p-3">
            <div className="mb-2 flex items-center gap-2 px-2">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                {roleBadge}
              </span>
            </div>
            <UserMenu
              fullName={primaryLabel}
              handle={secondaryLabel}
              initials={initials}
            />
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-emerald-100 bg-white md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs text-slate-600"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute right-2 top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-700 px-1 text-[10px] font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-emerald-100 bg-white/85 px-6 backdrop-blur-md">
            <div className="text-sm font-medium text-slate-700">
              Diyet Klinik ·{" "}
              {new Intl.DateTimeFormat("tr-TR", {
                weekday: "long",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date())}
            </div>
            <NotificationsBell pendingCount={pendingCount} />
          </header>

          <main className="flex-1 px-6 pb-24 pt-8 md:pb-8">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
