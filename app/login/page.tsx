import Link from "next/link";
import type { Route } from "next";
import { Leaf } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata = {
  title: "Giriş Yap",
};

export default async function LoginPage(props: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const sp = await props.searchParams;
  const callbackUrl = sp.from ?? "/admin";

  return (
    <div className="min-h-screen bg-emerald-50/30">
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700">
                <Leaf className="h-5 w-5 text-white" strokeWidth={2.25} />
              </div>
              <div className="leading-tight text-left">
                <div className="text-base font-semibold tracking-tight text-slate-900">
                  Dyt. Selin Akar
                </div>
                <div className="text-[11px] font-medium tracking-wide text-emerald-700">
                  Yönetim Paneli
                </div>
              </div>
            </Link>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-100/40">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Tekrar hoş geldiniz
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Yönetim paneline erişmek için giriş yapın.
              </p>
            </div>

            <LoginForm callbackUrl={callbackUrl} initialError={sp.error} />
          </div>

          <p className="text-center text-xs text-slate-500">
            Şifrenizi mi unuttunuz?{" "}
            <Link
              href={"/iletisim" as Route}
              className="font-medium text-emerald-700 hover:underline"
            >
              Destek talep edin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
