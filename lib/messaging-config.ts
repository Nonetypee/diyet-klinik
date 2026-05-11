import "server-only";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

/**
 * Mesajlaşma Yapılandırması — DB + env fallback
 *
 * Tek satırlık MessagingConfig tablosundan okunur.
 * Henüz DB yoksa / boşsa env değerlerine düşülür (geriye dönük uyumluluk).
 *
 * Sırlar (token, şifre) DB'de AES-256-GCM ile şifreli saklanır.
 * Bu fonksiyonlar plain-text okumayı server'a izolasyon halinde yapar.
 */

export type MessagingProviderName = "MOCK" | "WHATSAPP" | "NETGSM" | "MUTLUCELL";

export interface ResolvedMessagingConfig {
  primary: MessagingProviderName;
  fallback: MessagingProviderName | null;

  whatsapp: {
    phoneNumberId: string;
    accessToken: string;
    apiVersion: string;
  };
  netgsm: {
    userCode: string;
    password: string;
    header: string;
  };
  mutlucell: {
    username: string;
    password: string;
    orgn: string;
  };
}

/**
 * Sağlayıcıların düzgün yapılandırılıp yapılandırılmadığını kontrol eder.
 */
export interface ProviderStatus {
  primary: MessagingProviderName;
  fallback: MessagingProviderName | null;
  primaryConfigured: boolean;
  fallbackConfigured: boolean;
}

const SINGLETON_ID = "singleton";

export async function getMessagingConfig(): Promise<ResolvedMessagingConfig> {
  const row = await prisma.messagingConfig.findUnique({
    where: { id: SINGLETON_ID },
  });

  // env fallback değerleri — eski yapılandırmaları korur
  const env = {
    primary: (process.env.MESSAGING_PROVIDER ??
      process.env.SMS_PROVIDER ??
      "MOCK") as MessagingProviderName,
    fallback: (process.env.MESSAGING_FALLBACK_PROVIDER ?? "") as
      | MessagingProviderName
      | "",
    whatsapp: {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
      apiVersion: process.env.WHATSAPP_API_VERSION ?? "v22.0",
    },
    netgsm: {
      userCode: process.env.NETGSM_USERCODE ?? "",
      password: process.env.NETGSM_PASSWORD ?? "",
      header: process.env.NETGSM_HEADER ?? "",
    },
    mutlucell: {
      username: process.env.MUTLUCELL_USERNAME ?? "",
      password: process.env.MUTLUCELL_PASSWORD ?? "",
      orgn: process.env.MUTLUCELL_ORGN ?? "",
    },
  };

  if (!row) {
    return {
      primary: env.primary,
      fallback: env.fallback || null,
      whatsapp: env.whatsapp,
      netgsm: env.netgsm,
      mutlucell: env.mutlucell,
    };
  }

  return {
    primary: row.primaryProvider as MessagingProviderName,
    fallback: (row.fallbackProvider as MessagingProviderName) || null,
    whatsapp: {
      phoneNumberId: row.whatsappPhoneNumberId ?? env.whatsapp.phoneNumberId,
      accessToken:
        decrypt(row.whatsappAccessTokenEnc) ?? env.whatsapp.accessToken,
      apiVersion: row.whatsappApiVersion ?? env.whatsapp.apiVersion,
    },
    netgsm: {
      userCode: row.netgsmUserCode ?? env.netgsm.userCode,
      password: decrypt(row.netgsmPasswordEnc) ?? env.netgsm.password,
      header: row.netgsmHeader ?? env.netgsm.header,
    },
    mutlucell: {
      username: row.mutlucellUsername ?? env.mutlucell.username,
      password: decrypt(row.mutlucellPasswordEnc) ?? env.mutlucell.password,
      orgn: row.mutlucellOrgn ?? env.mutlucell.orgn,
    },
  };
}

function isProviderConfigured(
  provider: MessagingProviderName,
  cfg: ResolvedMessagingConfig
): boolean {
  switch (provider) {
    case "MOCK":
      return true;
    case "WHATSAPP":
      return !!cfg.whatsapp.phoneNumberId && !!cfg.whatsapp.accessToken;
    case "NETGSM":
      return (
        !!cfg.netgsm.userCode && !!cfg.netgsm.password && !!cfg.netgsm.header
      );
    case "MUTLUCELL":
      return (
        !!cfg.mutlucell.username &&
        !!cfg.mutlucell.password &&
        !!cfg.mutlucell.orgn
      );
    default:
      return false;
  }
}

export async function getProviderStatus(): Promise<ProviderStatus> {
  const cfg = await getMessagingConfig();
  return {
    primary: cfg.primary,
    fallback: cfg.fallback,
    primaryConfigured: isProviderConfigured(cfg.primary, cfg),
    fallbackConfigured: cfg.fallback
      ? isProviderConfigured(cfg.fallback, cfg)
      : false,
  };
}

/**
 * UI form için maskelenmiş yapılandırma. Sırlar { set: boolean } olarak döner.
 */
export interface MaskedMessagingConfig {
  primary: MessagingProviderName;
  fallback: MessagingProviderName | null;
  whatsapp: {
    phoneNumberId: string;
    apiVersion: string;
    accessTokenSet: boolean;
  };
  netgsm: {
    userCode: string;
    header: string;
    passwordSet: boolean;
  };
  mutlucell: {
    username: string;
    orgn: string;
    passwordSet: boolean;
  };
  lastTest: {
    at: string | null;
    status: string | null;
    channel: string | null;
    error: string | null;
  };
}

export async function getMaskedConfig(): Promise<MaskedMessagingConfig> {
  const row = await prisma.messagingConfig.findUnique({
    where: { id: SINGLETON_ID },
  });
  const cfg = await getMessagingConfig();

  return {
    primary: cfg.primary,
    fallback: cfg.fallback,
    whatsapp: {
      phoneNumberId: cfg.whatsapp.phoneNumberId,
      apiVersion: cfg.whatsapp.apiVersion,
      accessTokenSet: !!cfg.whatsapp.accessToken,
    },
    netgsm: {
      userCode: cfg.netgsm.userCode,
      header: cfg.netgsm.header,
      passwordSet: !!cfg.netgsm.password,
    },
    mutlucell: {
      username: cfg.mutlucell.username,
      orgn: cfg.mutlucell.orgn,
      passwordSet: !!cfg.mutlucell.password,
    },
    lastTest: {
      at: row?.lastTestAt?.toISOString() ?? null,
      status: row?.lastTestStatus ?? null,
      channel: row?.lastTestChannel ?? null,
      error: row?.lastTestError ?? null,
    },
  };
}

export interface UpdateMessagingConfigInput {
  primary: MessagingProviderName;
  fallback: MessagingProviderName | "";

  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string; // boş bırakırsa mevcut korunur
  whatsappApiVersion?: string;

  netgsmUserCode?: string;
  netgsmPassword?: string; // boş bırakırsa korunur
  netgsmHeader?: string;

  mutlucellUsername?: string;
  mutlucellPassword?: string; // boş bırakırsa korunur
  mutlucellOrgn?: string;
}

/**
 * Yapılandırmayı günceller. Şifre/token alanları BOŞ gönderilirse
 * mevcut değer korunur (üzerine yazılmaz). Bu sayede admin sadece
 * değiştirmek istediği alanı güncelleyebilir.
 */
export async function upsertMessagingConfig(
  input: UpdateMessagingConfigInput
): Promise<void> {
  const existing = await prisma.messagingConfig.findUnique({
    where: { id: SINGLETON_ID },
  });

  // Yardımcı: yeni değer boşsa mevcut korunur
  const keepOrSet = (newVal: string | undefined, existingVal: string | null) =>
    newVal === undefined || newVal === "" ? existingVal ?? null : newVal;

  const keepOrEncrypt = (
    newVal: string | undefined,
    existingEnc: string | null
  ) => {
    if (newVal === undefined || newVal === "") return existingEnc ?? null;
    return encrypt(newVal);
  };

  const data = {
    primaryProvider: input.primary,
    fallbackProvider: input.fallback || null,

    whatsappPhoneNumberId: keepOrSet(
      input.whatsappPhoneNumberId,
      existing?.whatsappPhoneNumberId ?? null
    ),
    whatsappAccessTokenEnc: keepOrEncrypt(
      input.whatsappAccessToken,
      existing?.whatsappAccessTokenEnc ?? null
    ),
    whatsappApiVersion: keepOrSet(
      input.whatsappApiVersion,
      existing?.whatsappApiVersion ?? "v22.0"
    ),

    netgsmUserCode: keepOrSet(
      input.netgsmUserCode,
      existing?.netgsmUserCode ?? null
    ),
    netgsmPasswordEnc: keepOrEncrypt(
      input.netgsmPassword,
      existing?.netgsmPasswordEnc ?? null
    ),
    netgsmHeader: keepOrSet(input.netgsmHeader, existing?.netgsmHeader ?? null),

    mutlucellUsername: keepOrSet(
      input.mutlucellUsername,
      existing?.mutlucellUsername ?? null
    ),
    mutlucellPasswordEnc: keepOrEncrypt(
      input.mutlucellPassword,
      existing?.mutlucellPasswordEnc ?? null
    ),
    mutlucellOrgn: keepOrSet(
      input.mutlucellOrgn,
      existing?.mutlucellOrgn ?? null
    ),
  };

  await prisma.messagingConfig.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...data },
    update: data,
  });
}

export async function recordTestResult(input: {
  status: "OK" | "FAILED";
  channel: string | null;
  error: string | null;
}): Promise<void> {
  await prisma.messagingConfig.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      lastTestAt: new Date(),
      lastTestStatus: input.status,
      lastTestChannel: input.channel,
      lastTestError: input.error,
    },
    update: {
      lastTestAt: new Date(),
      lastTestStatus: input.status,
      lastTestChannel: input.channel,
      lastTestError: input.error,
    },
  });
}
