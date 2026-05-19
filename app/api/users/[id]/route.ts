import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { hash } from "bcryptjs";
import {
  ROLES,
  canManageUsers,
  normalizeRole,
} from "@/lib/permissions";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
  // Developer rolü panelden ATANAMAZ. Sadece ADMIN ↔ STAFF arası geçiş.
  role: z.enum([ROLES.ADMIN, ROLES.STAFF]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

async function getMe(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
}

function isDeveloperRole(role: string | null | undefined) {
  // Yeni DEVELOPER + eski SUPER_ADMIN değerleri hepsi panelde gizli sayılır.
  return role === "DEVELOPER" || role === "SUPER_ADMIN";
}

/**
 * PATCH /api/users/[id]
 *  - Sadece DEVELOPER + ADMIN erişebilir.
 *  - Developer hesabı paneldemiş gibi yapılır → 404 döner (gizli).
 *  - Kullanıcı kendi rolünü değiştiremez.
 *  - Kullanıcı kendini pasifleştiremez.
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }
  const me = await getMe(session.user.id);
  const myRole = normalizeRole(me?.role);
  if (!canManageUsers(myRole)) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!target || isDeveloperRole(target.role)) {
    return NextResponse.json({ message: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Geçersiz istek" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Form geçersiz", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const isSelf = target.id === me?.id;
  const targetRole = normalizeRole(target.role);

  if (isSelf && parsed.data.role && parsed.data.role !== targetRole) {
    return NextResponse.json(
      { message: "Kendi rolünüzü değiştiremezsiniz." },
      { status: 403 }
    );
  }

  if (isSelf && parsed.data.isActive === false) {
    return NextResponse.json(
      { message: "Kendinizi pasifleştiremezsiniz." },
      { status: 403 }
    );
  }

  const data: {
    fullName?: string;
    phone?: string | null;
    role?: string;
    isActive?: boolean;
    passwordHash?: string;
  } = {};
  if (parsed.data.fullName !== undefined) data.fullName = parsed.data.fullName;
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.password) {
    data.passwordHash = await hash(parsed.data.password, 10);
  }

  try {
    await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/users/[id]]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 *  - Developer hesapları panelde gizli (404 döner).
 *  - Kendi hesabını silemezsin.
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }
  const me = await getMe(session.user.id);
  const myRole = normalizeRole(me?.role);
  if (!canManageUsers(myRole)) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (id === me?.id) {
    return NextResponse.json(
      { message: "Kendinizi silemezsiniz." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, isActive: true },
  });
  if (!target || isDeveloperRole(target.role)) {
    return NextResponse.json({ message: "Bulunamadı" }, { status: 404 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/users/[id]]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 }
    );
  }
}
