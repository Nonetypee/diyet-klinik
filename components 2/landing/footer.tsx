import Link from "next/link";
import { Leaf, MapPin, Phone, Mail, Clock, Instagram } from "lucide-react";
import { DIETITIAN_SERVICES } from "@/lib/services-config";

export function Footer() {
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
                  Dyt. Selin Akar
                </div>
                <div className="text-[11px] font-medium tracking-wide text-emerald-700">
                  Beslenme & Diyet
                </div>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              Bilime dayalı, kişiye özel beslenme programları. Online ve yüz
              yüze danışmanlık. KVKK uyumlu.
            </p>

            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>Bağdat Caddesi No: 123, Daire 4, Kadıköy / İstanbul</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-emerald-600" />
                <a href="tel:+902121234567" className="hover:text-slate-900">
                  0212 123 45 67
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-emerald-600" />
                <a
                  href="mailto:info@selinakarbeslenme.com"
                  className="hover:text-slate-900"
                >
                  info@selinakarbeslenme.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Pzt-Cmt 09:00 - 19:00</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Instagram className="h-4 w-4 shrink-0 text-emerald-600" />
                <a href="#" className="hover:text-slate-900">
                  @dyt.selinakar
                </a>
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
                href="/kvkk"
                className="font-medium text-emerald-700 hover:underline"
              >
                Tam Metin
              </Link>
              <span className="text-slate-300">·</span>
              <Link
                href="/cerez-politikasi"
                className="font-medium text-emerald-700 hover:underline"
              >
                Çerez Politikası
              </Link>
              <span className="text-slate-300">·</span>
              <Link
                href="/gizlilik"
                className="font-medium text-emerald-700 hover:underline"
              >
                Gizlilik
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center">
          <div>
            © {new Date().getFullYear()} Dyt. Selin Akar. Tüm hakları saklıdır.
            <span className="mx-2 text-slate-300">·</span>
            T.C. Sağlık Bakanlığı Diyetisyen Lisans No: DYT-12345
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
