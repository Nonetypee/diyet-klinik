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

const usernameSchema = z
  .string()
  .min(3, "En az 3 karakter")
  .max(32, "En fazla 32 karakter")
  .regex(
    /^[a-z0-9_.-]+$/,
    "Sadece küçük harf, rakam ve _ . - karakterleri"
  );

const createSchema = z.object({
  username: usernameSchema,
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  fullName: z.string().min(2),
  phone: z.string().optional().nullable(),
  // Developer rolü panelden ATANAMAZ — sadece .env üzerinden yönetilir.
  role: z.enum([ROLES.ADMIN, ROLES.STAFF]),
});

/**
 * GET /api/users
 * Tüm kullanıcıları listeler. DEVELOPER + ADMIN erişebilir.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!canManageUsers(normalizeRole(me?.role))) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: {
      // Developer hesapları panelde tamamen gizlidir.
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

  return NextResponse.json(
    users.map((u) => ({
      ...u,
      role: normalizeRole(u.role),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    }))
  );
}

/**
 * POST /api/users
 * Yeni kullanıcı oluşturur. DEVELOPER + ADMIN erişebilir.
 * Yeni DEVELOPER hesabı SADECE mevcut bir DEVELOPER tarafından oluşturulabilir.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const myRole = normalizeRole(me?.role);
  if (!canManageUsers(myRole)) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Form geçersiz",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const username = parsed.data.username.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { username },
    });
    if (existing) {
      return NextResponse.json(
        { message: "Bu kullanıcı adı zaten kullanılıyor." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(parsed.data.password, 10);
    const created = await prisma.user.create({
      data: {
        username,
        passwordHash,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone ?? null,
        role: parsed.data.role,
        isActive: true,
      },
      select: { id: true, username: true, role: true },
    });

    return NextResponse.json({ success: true, user: created }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/users]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 }
    );
  }
}
