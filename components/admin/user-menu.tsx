"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, ChevronUp, User } from "lucide-react";

interface Props {
  fullName: string;
  email: string;
  initials: string;
}

export function UserMenu({ fullName, email, initials }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-emerald-50"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
          {initials}
        </div>
        <div className="flex-1 text-sm">
          <div className="line-clamp-1 font-medium text-slate-900">
            {fullName}
          </div>
          <div className="line-clamp-1 text-xs text-slate-500">{email}</div>
        </div>
        <ChevronUp
          className={`h-4 w-4 text-slate-400 transition-transform ${
            open ? "" : "rotate-180"
          }`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-lg">
          <button
            onClick={() => {
              setOpen(false);
              window.location.href = "/admin/settings";
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-emerald-50"
          >
            <User className="h-4 w-4 text-slate-500" />
            Profilim
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2.5 border-t border-emerald-100 px-3 py-2.5 text-left text-sm text-red-700 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}
