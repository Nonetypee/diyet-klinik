import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  getMaskedConfig,
  upsertMessagingConfig,
  type MessagingProviderName,
} from "@/lib/messaging-config";

export const dynamic = "force-dynamic";

const PROVIDER_VALUES = ["MOCK", "WHATSAPP", "NETGSM", "MUTLUCELL"] as const;

const updateSchema = z.object({
  primary: z.enum(PROVIDER_VALUES),
  fallback: z.enum(["", ...PROVIDER_VALUES]).optional(),

  whatsappPhoneNumberId: z.string().optional(),
  whatsappAccessToken: z.string().optional(),
  whatsappApiVersion: z.string().optional(),

  netgsmUserCode: z.string().optional(),
  netgsmPassword: z.string().optional(),
  netgsmHeader: z.string().optional(),

  mutlucellUsername: z.string().optional(),
  mutlucellPassword: z.string().optional(),
  mutlucellOrgn: z.string().optional(),
});

/**
 * GET /api/settings/messaging
 * Maskelenmiş yapılandırmayı döner — secret değerler "set: true/false" olarak.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }

  try {
    const config = await getMaskedConfig();
    return NextResponse.json(config);
  } catch (err) {
    console.error("[GET /api/settings/messaging]", err);
    return NextResponse.json(
      { message: "Yapılandırma okunamadı" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/messaging
 * Yapılandırmayı günceller.
 * Sırrı boş bırakırsanız (`""` veya `undefined`) mevcut değer korunur.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Form geçersiz",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await upsertMessagingConfig({
      primary: parsed.data.primary,
      fallback: (parsed.data.fallback ?? "") as MessagingProviderName | "",
      whatsappPhoneNumberId: parsed.data.whatsappPhoneNumberId,
      whatsappAccessToken: parsed.data.whatsappAccessToken,
      whatsappApiVersion: parsed.data.whatsappApiVersion,
      netgsmUserCode: parsed.data.netgsmUserCode,
      netgsmPassword: parsed.data.netgsmPassword,
      netgsmHeader: parsed.data.netgsmHeader,
      mutlucellUsername: parsed.data.mutlucellUsername,
      mutlucellPassword: parsed.data.mutlucellPassword,
      mutlucellOrgn: parsed.data.mutlucellOrgn,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/settings/messaging]", err);
    return NextResponse.json(
      {
        message: "Kaydedilemedi",
        details:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
