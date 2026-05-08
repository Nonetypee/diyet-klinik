import { z } from "zod";

/**
 * Türk cep telefonu doğrulayıcı:
 * 5xxxxxxxxx, 05xxxxxxxxx, +905xxxxxxxxx
 */
const trMobilePhone = z
  .string()
  .min(10, "Telefon numarası eksik")
  .transform((v) => v.replace(/\s|\(|\)|-/g, ""))
  .refine(
    (v) => /^(\+?90)?0?5\d{9}$/.test(v),
    "Geçerli bir cep telefonu giriniz (5xx xxx xx xx)"
  );

export const appointmentRequestSchema = z.object({
  // SLUG kullanıyoruz — DB'deki Service.slug ile eşleşir.
  // Form kaynak kodu hardcoded ID göndermeye çalıştığı için
  // önceki sürümde foreign key hatası oluşuyordu.
  serviceSlug: z.string().min(1, "Lütfen bir hizmet seçiniz"),
  patientName: z
    .string()
    .min(3, "Ad-soyad en az 3 karakter olmalıdır")
    .max(120, "Ad-soyad çok uzun"),
  patientPhone: trMobilePhone,
  patientEmail: z
    .string()
    .email("Geçerli bir e-posta giriniz")
    .optional()
    .or(z.literal("")),
  requestedDate: z
    .string()
    .min(1, "Tarih seçiniz")
    .refine((v) => !isNaN(Date.parse(v)), "Geçersiz tarih"),
  requestedTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Saat formatı HH:MM olmalıdır"),
  patientNote: z.string().max(500, "Not 500 karakteri aşamaz").optional(),
  kvkkConsent: z
    .boolean()
    .refine((v) => v === true, "KVKK onayı gerekli"),
});

export type AppointmentRequestInput = z.infer<typeof appointmentRequestSchema>;
