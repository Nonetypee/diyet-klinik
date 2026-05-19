"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { Menu, Phone, X, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LandingClinic, LandingDietician } from "@/lib/landing-data";
import { phoneToTelHref } from "@/lib/landing-data";

const NAV_ITEMS: { href: Route; label: string }[] = [
  { href: "#hizmetler" as Route, label: "Hizmetler" },
  { href: "#hakkimda" as Route, label: "Hakkımda" },
  { href: "#nasil-calisir" as Route, label: "Nasıl Çalışır" },
  { href: "#yorumlar" as Route, label: "Danışan Yorumları" },
  { href: "#sss" as Route, label: "S.S.S." },
];

interface Props {
  clinic: LandingClinic;
  dietician: LandingDietician;
}

export function Navbar({ clinic, dietician }: Props) {
  const [open, setOpen] = useState(false);

  const brandTitle = `${dietician.title} ${dietician.fullName}`.trim();
  const brandSubtitle = clinic.tagline ?? "Beslenme & Diyet";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: "var(--brand)" }}
          >
            <Leaf className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight text-slate-900">
              {brandTitle}
            </div>
            <div
              className="text-[11px] font-medium tracking-wide"
              style={{ color: "var(--brand)" }}
            >
              {brandSubtitle}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`tel:${phoneToTelHref(clinic.phone)}`}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-700"
          >
            <Phone className="h-4 w-4" />
            {clinic.phone}
          </a>
          <Button
            asChild
            size="sm"
            variant="primary"
            style={{ backgroundColor: "var(--brand)" }}
          >
            <Link href={"#randevu" as Route}>Randevu Al</Link>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menüyü aç"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-slate-100 bg-white md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <div className="space-y-1 px-6 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-base font-medium text-slate-700"
            >
              {item.label}
            </Link>
          ))}
          <Button
            asChild
            variant="primary"
            className="mt-3 w-full"
            style={{ backgroundColor: "var(--brand)" }}
          >
            <Link href={"#randevu" as Route} onClick={() => setOpen(false)}>
              Randevu Al
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
