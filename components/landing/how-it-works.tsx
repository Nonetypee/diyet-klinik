import {
  FileText,
  ShieldCheck,
  MessageSquareText,
  CalendarCheck,
  ClipboardList,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";
import type { LandingClinic, LandingContentValues } from "@/lib/landing-data";

const STEP_ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  ShieldCheck,
  MessageSquareText,
  CalendarCheck,
  ClipboardList,
  PhoneCall,
};

interface Props {
  clinic: LandingClinic;
  content: LandingContentValues;
}

export function HowItWorks({ clinic, content }: Props) {
  // 4. adım açıklamasında "klinikte" sözcüğü varsa ilçeyi otomatik ekleyelim.
  const steps = content.howSteps.map((step) => {
    if (
      step.description.includes("klinikte") &&
      clinic.district &&
      !step.description.includes(clinic.district)
    ) {
      return {
        ...step,
        description: step.description.replace(
          /klinikte/,
          `${clinic.district}'deki klinikte`
        ),
      };
    }
    return step;
  });

  return (
    <section
      id="nasil-calisir"
      className="border-t border-slate-100 bg-slate-50/40 py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium ring-1 ring-emerald-100"
            style={{ color: "var(--brand)" }}
          >
            {content.howBadge}
          </span>
          <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {content.howTitle}
          </h2>
          <p className="mt-4 text-balance text-lg leading-relaxed text-slate-600">
            {content.howSubtitle}
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => {
            const Icon = STEP_ICON_MAP[step.icon] ?? FileText;
            return (
              <div
                key={`${step.number}-${idx}`}
                className="relative rounded-2xl border border-slate-200 bg-white p-7"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold tracking-widest"
                    style={{ color: "var(--brand)" }}
                  >
                    {step.number}
                  </span>
                  <Icon className="h-5 w-5 text-slate-400" strokeWidth={2} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {step.description}
                </p>

                {idx < steps.length - 1 && (
                  <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-emerald-100 lg:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
