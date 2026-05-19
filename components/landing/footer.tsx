import Link from "next/link";
import type { Route } from "next";
import { Leaf, MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { DIETITIAN_SERVICES } from "@/lib/services-config";
import type { LandingClinic, LandingDietician } from "@/lib/landing-data";
import {
  phoneToTelHref,
  summarizeWorkingHours,
} from "@/lib/landing-data";

interface Props {
  clinic: LandingClinic;
  dietician: LandingDietician;
}

export function Footer({ clinic, dietician }: Props) {
  const brandTitle = `${dietician.title} ${dietician.fullName}`.trim();
  const fullAddress = [clinic.address, clinic.district, clinic.city]
    .filter(Boolean)
    .join(", ");
  const hoursLabel = summarizeWorkingHours(clinic.workingHours);
  const tagline = clinic.tagline ?? "Beslenme & Diyet";

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700">
                <Leaf className="h-5 w-5 text-white" strokeWidth={2.25} />
              </div>
              <div className="leading-tight">
                <div className="text-base font-semibold tracking-tight text-slate-900">
                  {brandTitle}
                </div>
                <div className="text-[11px] font-medium tracking-wide text-emerald-700">
                  {tagline}
                </div>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              Bilime dayalı, kişiye özel beslenme programları. Online ve yüz
              yüze danışmanlık. KVKK uyumlu.
            </p>

            <div className="mt-6 space-y-3 text-sm text-slate-600">
              {fullAddress && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{fullAddress}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-emerald-600" />
                <a
                  href={`tel:${phoneToTelHref(clinic.phone)}`}
                  className="hover:text-slate-900"
                >
                  {clinic.phone}
                </a>
              </div>
              {clinic.whatsapp && (
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  <a
                    href={`https://wa.me/${phoneToTelHref(clinic.whatsapp).replace(/^\+/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-900"
                  >
                    {clinic.whatsapp} (WhatsApp)
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-emerald-600" />
                <a
                  href={`mailto:${clinic.email}`}
                  className="hover:text-slate-900"
                >
                  {clinic.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{hoursLabel}</span>
              </div>
            </div>
          </div>

          {/* Hizmetler */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-slate-900">Hizmetler</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              {DIETITIAN_SERVICES.slice(0, 6).map((s) => (
                <li key={s.slug}>
                  <Link href="#hizmetler" className="hover:text-emerald-700">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kurumsal */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-900">Kurumsal</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="#hakkimda" className="hover:text-emerald-700">
                  Hakkımda
                </Link>
              </li>
              <li>
                <Link href="#yorumlar" className="hover:text-emerald-700">
                  Yorumlar
                </Link>
              </li>
              <li>
                <Link href="#sss" className="hover:text-emerald-700">
                  S.S.S.
                </Link>
              </li>
              <li>
                <Link href="#randevu" className="hover:text-emerald-700">
                  Randevu Al
                </Link>
              </li>
            </ul>
          </div>

          {/* KVKK */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-slate-900">
              KVKK Aydınlatma Metni
            </h3>
            <p className="mt-4 text-xs leading-relaxed text-slate-600">
              6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında,
              randevu talebiniz sırasında paylaştığınız ad-soyad, telefon,
              e-posta ve sağlık bilgileri yalnızca beslenme danışmanlığı
              süreçlerinin yürütülmesi amacıyla işlenmektedir.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <Link
                href={"/kvkk" as Route}
                className="font-medium text-emerald-700 hover:underline"
              >
                Tam Metin
              </Link>
              <span className="text-slate-300">·</span>
              <Link
                href={"/cerez-politikasi" as Route}
                className="font-medium text-emerald-700 hover:underline"
              >
                Çerez Politikası
              </Link>
              <span className="text-slate-300">·</span>
              <Link
                href={"/gizlilik" as Route}
                className="font-medium text-emerald-700 hover:underline"
              >
                Gizlilik
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center">
          <div>
            © {new Date().getFullYear()} {brandTitle}. Tüm hakları saklıdır.
            {dietician.licenseNumber && (
              <>
                <span className="mx-2 text-slate-300">·</span>
                T.C. Sağlık Bakanlığı Diyetisyen Lisans No:{" "}
                {dietician.licenseNumber}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>Bu site KVKK uyumludur.</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-emerald-100">
              SSL Korumalı
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
