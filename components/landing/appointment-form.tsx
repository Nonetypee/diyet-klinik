"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import {
  appointmentRequestSchema,
  type AppointmentRequestInput,
} from "@/lib/validation/appointment";
import { DIETITIAN_SERVICES } from "@/lib/services-config";
import { DateSlotPicker } from "@/components/landing/date-slot-picker";

interface ServiceOption {
  slug: string;
  name: string;
  durationMin: number;
}

export function AppointmentForm({ services }: { services?: ServiceOption[] }) {
  // DB'den geldiyse onu, yoksa statik config'i kullan
  const serviceOptions: ServiceOption[] =
    services && services.length > 0
      ? services
      : DIETITIAN_SERVICES.map((s) => ({
          slug: s.slug,
          name: s.name,
          durationMin: s.durationMin,
        }));

  const [submitted, setSubmitted] = useState(false);
  const [serviceSlug, setServiceSlug] = useState<string | null>(null);
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [pickedTime, setPickedTime] = useState<string | null>(null);

  // Başarı mesajı görünür olunca otomatik scroll için referans
  const successRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (submitted && successRef.current) {
      // İçerik DOM'a girdikten sonra smooth scroll
      const el = successRef.current;
      // Header sticky olduğu için biraz offset bırak
      const offset = 100;
      const top =
        el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [submitted]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AppointmentRequestInput>({
    resolver: zodResolver(appointmentRequestSchema),
    defaultValues: {
      kvkkConsent: false,
    },
  });

  const onSubmit = async (data: AppointmentRequestInput) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let detailedMessage =
          err?.message ?? `Talebiniz iletilemedi (HTTP ${res.status})`;
        if (err?.errors && typeof err.errors === "object") {
          const firstField = Object.keys(err.errors)[0];
          const firstError = err.errors[firstField]?.[0];
          if (firstError) detailedMessage = `${firstField}: ${firstError}`;
        }
        if (err?.details) detailedMessage += ` — ${err.details}`;
        throw new Error(detailedMessage);
      }

      setSubmitted(true);
      toast({
        variant: "success",
        title: "Talebiniz alındı",
        description:
          "Onay durumu ile ilgili bilgilendirme yapılacaktır.",
      });
      reset();
      setServiceSlug(null);
      setPickedDate(null);
      setPickedTime(null);
    } catch (e) {
      toast({
        variant: "error",
        title: "Bir hata oluştu",
        description:
          e instanceof Error ? e.message : "Lütfen tekrar deneyiniz.",
      });
    }
  };

  if (submitted) {
    return (
      <div
        ref={successRef}
        className="mx-auto max-w-2xl scroll-mt-24 rounded-3xl border border-emerald-200 bg-emerald-50 p-10 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-7 w-7 text-emerald-700" />
        </div>
        <h3 className="mt-5 text-2xl font-semibold text-slate-900">
          Talebiniz başarıyla alındı
        </h3>
        <p className="mt-2 text-slate-600">
          En kısa sürede randevunuz değerlendirilecektir.
          Onaylandığında cep telefonunuza bildirim gelecektir.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => setSubmitted(false)}
        >
          Yeni randevu talebi
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-emerald-100/30 sm:p-10"
    >
      <div className="space-y-6">
        {/* 1. Hizmet seçimi */}
        <div>
          <Label htmlFor="serviceSlug">
            Danışmanlık Türü <span className="text-red-500">*</span>
          </Label>
          <Select
            onValueChange={(v) => {
              setServiceSlug(v);
              setValue("serviceSlug", v, { shouldValidate: true });
              // Hizmet değişince saat seçimini sıfırla (süre değişebilir)
              setPickedTime(null);
              setValue("requestedTime", "" as never, { shouldValidate: false });
            }}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Hangi konuda görüşmek istersiniz?" />
            </SelectTrigger>
            <SelectContent>
              {serviceOptions.map((s) => (
                <SelectItem key={s.slug} value={s.slug}>
                  {s.name} ({s.durationMin} dk)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.serviceSlug && (
            <FieldError>{errors.serviceSlug.message}</FieldError>
          )}
        </div>

        {/* 2. Tarih + saat picker */}
        <div>
          <Label>
            Tarih ve Saat <span className="text-red-500">*</span>
          </Label>
          <div className="mt-1.5">
            <DateSlotPicker
              serviceSlug={serviceSlug}
              selectedDate={pickedDate}
              selectedTime={pickedTime}
              onChange={(date, time) => {
                setPickedDate(date);
                setPickedTime(time);
                if (date) {
                  setValue("requestedDate", date, { shouldValidate: true });
                }
                if (time) {
                  setValue("requestedTime", time, { shouldValidate: true });
                } else {
                  setValue("requestedTime", "" as never, {
                    shouldValidate: false,
                  });
                }
              }}
            />
          </div>
          {(errors.requestedDate || errors.requestedTime) && (
            <FieldError>
              {errors.requestedDate?.message ?? errors.requestedTime?.message}
            </FieldError>
          )}
        </div>

        {/* 3. Hasta bilgileri */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="patientName">
              Ad Soyad <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="patientName"
                className="pl-9"
                placeholder="Adınız Soyadınız"
                {...register("patientName")}
              />
            </div>
            {errors.patientName && (
              <FieldError>{errors.patientName.message}</FieldError>
            )}
          </div>

          <div>
            <Label htmlFor="patientPhone">
              Cep Telefonu <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="patientPhone"
                type="tel"
                className="pl-9"
                placeholder="0 5xx xxx xx xx"
                {...register("patientPhone")}
              />
            </div>
            {errors.patientPhone && (
              <FieldError>{errors.patientPhone.message}</FieldError>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="patientEmail">E-posta (opsiyonel)</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="patientEmail"
                type="email"
                className="pl-9"
                placeholder="ornek@eposta.com"
                {...register("patientEmail")}
              />
            </div>
            {errors.patientEmail && (
              <FieldError>{errors.patientEmail.message}</FieldError>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="patientNote">Notunuz (opsiyonel)</Label>
            <div className="relative mt-1.5">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Textarea
                id="patientNote"
                rows={3}
                className="pl-9"
                placeholder="Hedefiniz, mevcut durumunuz veya bilmemizi istediğiniz detaylar"
                {...register("patientNote")}
              />
            </div>
          </div>
        </div>

        {/* 4. KVKK */}
        <div>
          <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <Checkbox
              id="kvkkConsent"
              onCheckedChange={(c) =>
                setValue("kvkkConsent", c === true, { shouldValidate: true })
              }
            />
            <Label
              htmlFor="kvkkConsent"
              className="cursor-pointer text-sm leading-relaxed text-slate-700"
            >
              <ShieldCheck className="mr-1 inline h-4 w-4 text-emerald-600" />
              <span>
                <strong className="font-semibold">KVKK Aydınlatma Metnini</strong>{" "}
                okudum, kişisel sağlık verilerimin beslenme danışmanlığı
                süreçlerinin yürütülmesi amacıyla işlenmesine açık rıza veriyorum.{" "}
                <a
                  href="/kvkk"
                  target="_blank"
                  className="font-medium text-emerald-700 underline-offset-2 hover:underline"
                >
                  Tam metni okuyun
                </a>
              </span>
            </Label>
          </div>
          {errors.kvkkConsent && (
            <FieldError>{errors.kvkkConsent.message}</FieldError>
          )}
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        variant="primary"
        className="mt-8 h-12 w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Talebiniz iletiliyor...
          </>
        ) : (
          "Randevu Talebi Gönder"
        )}
      </Button>

      <p className="mt-4 text-center text-xs text-slate-500">
        Talebinizi göndererek, sizinle iletişime geçilmesini kabul etmiş
        olursunuz. Onay sonrası bilgilendirileceksiniz.
      </p>
    </form>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs font-medium text-red-600">{children}</p>;
}
