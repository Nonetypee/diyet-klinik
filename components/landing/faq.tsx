"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingContentValues } from "@/lib/landing-data";

interface Props {
  content: LandingContentValues;
}

export function Faq({ content }: Props) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="sss" className="border-t border-slate-100 bg-emerald-50/20 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span
            className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium ring-1 ring-emerald-100"
            style={{ color: "var(--brand)" }}
          >
            {content.faqBadge}
          </span>
          <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {content.faqTitle}
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {content.faqItems.map((item, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-emerald-100 bg-white"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
              >
                <span className="text-base font-semibold text-slate-900">
                  {item.q}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-slate-400 transition-transform",
                    open === i && "rotate-180"
                  )}
                  style={open === i ? { color: "var(--brand)" } : undefined}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-base leading-relaxed text-slate-600">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
