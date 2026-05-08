"use client";

import * as React from "react";
import { create } from "zustand";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (input: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (input) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { ...input, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function toast(input: Omit<ToastItem, "id">) {
  useToastStore.getState().push(input);
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; icon: React.ReactNode }> = {
  default: { bg: "border-slate-200 bg-white", icon: <Info className="h-5 w-5 text-slate-500" /> },
  success: { bg: "border-emerald-200 bg-emerald-50", icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" /> },
  error: { bg: "border-red-200 bg-red-50", icon: <AlertCircle className="h-5 w-5 text-red-600" /> },
  info: { bg: "border-emerald-200 bg-emerald-50", icon: <Info className="h-5 w-5 text-emerald-600" /> },
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col-reverse gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg animate-in-up",
            VARIANT_STYLES[t.variant].bg
          )}
        >
          {VARIANT_STYLES[t.variant].icon}
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">{t.title}</div>
            {t.description && (
              <div className="mt-0.5 text-sm text-slate-600">{t.description}</div>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Bildirimi kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  return { toast };
}
