"use client";

import type { Route } from "next";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  callbackUrl: string;
  initialError?: string;
}

/** Same-origin path only; avoids open redirects and satisfies typed routes. */
function safePostLoginRoute(from: string): Route {
  if (
    typeof from !== "string" ||
    !from.startsWith("/") ||
    from.startsWith("//") ||
    from.includes("://") ||
    from.includes("\\")
  ) {
    return "/admin";
  }
  return from as Route;
}

type Step = "credentials" | "totp";

export function LoginForm({ callbackUrl, initialError }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");

  // Step 1
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2
  const [totpCode, setTotpCode] = useState("");
  const [usingBackup, setUsingBackup] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (!initialError) return null;
    if (initialError === "session_expired") {
      return "Oturum geçersiz (veritabanı yenilendi olabilir). Lütfen tekrar giriş yapın.";
    }
    return "Giriş bilgileri hatalı, lütfen tekrar deneyin.";
  });

  async function attemptSignIn(extra: { totpCode?: string }) {
    return signIn("credentials", {
      username: username.trim().toLowerCase(),
      password,
      totpCode: extra.totpCode ?? "",
      redirect: false,
    });
  }

  async function onSubmitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await attemptSignIn({});

      if (!result || !result.error) {
        router.push(safePostLoginRoute(callbackUrl));
        router.refresh();
        return;
      }

      const code = decodeAuthError(result.error);

      if (code === "TOTP_REQUIRED") {
        setStep("totp");
        setError(null);
      } else if (code === "INVALID_CREDENTIALS") {
        setError("Kullanıcı adı veya şifre hatalı");
      } else {
        setError("Giriş yapılamadı, lütfen tekrar deneyin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitTotp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await attemptSignIn({ totpCode: totpCode.trim() });

      if (!result || !result.error) {
        router.push(safePostLoginRoute(callbackUrl));
        router.refresh();
        return;
      }

      const code = decodeAuthError(result.error);

      if (code === "INVALID_TOTP") {
        setError(
          usingBackup
            ? "Yedek kod hatalı veya zaten kullanılmış"
            : "Doğrulama kodu hatalı veya süresi dolmuş"
        );
      } else if (code === "INVALID_CREDENTIALS") {
        setStep("credentials");
        setError("Oturum zaman aşımı, baştan deneyin");
      } else {
        setError("Doğrulama yapılamadı");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  if (step === "totp") {
    return (
      <form onSubmit={onSubmitTotp} className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong className="font-semibold">İki Faktörlü Doğrulama</strong>
            <br />
            {usingBackup
              ? "Authenticator app'e erişiminiz yoksa yedek kodlardan birini girin."
              : "Authenticator uygulamanızdaki 6 haneli kodu girin."}
          </span>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Label htmlFor="totpCode">
            {usingBackup ? "Yedek Kod" : "Doğrulama Kodu"}
          </Label>
          <div className="relative mt-1.5">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="totpCode"
              type="text"
              autoComplete="one-time-code"
              required
              autoFocus
              inputMode={usingBackup ? "text" : "numeric"}
              maxLength={usingBackup ? 9 : 6}
              className="pl-9 text-center font-mono text-lg tracking-widest"
              placeholder={usingBackup ? "XXXX-XXXX" : "123456"}
              value={totpCode}
              onChange={(e) =>
                setTotpCode(
                  usingBackup
                    ? e.target.value.toUpperCase()
                    : e.target.value.replace(/\D/g, "")
                )
              }
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={
            loading ||
            (usingBackup ? totpCode.length < 8 : totpCode.length !== 6)
          }
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Doğrula ve Giriş Yap
        </Button>

        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              setStep("credentials");
              setTotpCode("");
              setError(null);
              setUsingBackup(false);
            }}
            className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-3 w-3" />
            Geri
          </button>
          <button
            type="button"
            onClick={() => {
              setUsingBackup((u) => !u);
              setTotpCode("");
              setError(null);
            }}
            className="font-medium text-emerald-700 hover:underline"
          >
            {usingBackup
              ? "Authenticator kodu kullan"
              : "Yedek kodla giriş yap"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmitCredentials} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <Label htmlFor="username">Kullanıcı Adı</Label>
        <div className="relative mt-1.5">
          <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            id="username"
            type="text"
            autoComplete="username"
            required
            autoFocus
            className="pl-9"
            placeholder="kullanici_adi"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">Şifre</Label>
        <div className="relative mt-1.5">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            minLength={6}
            className="pl-9 pr-10"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        Giriş Yap
      </Button>
    </form>
  );
}

/**
 * NextAuth v5 hata mesajlarını parse eder.
 * Custom CredentialsSignin error.code'larını ararız.
 */
function decodeAuthError(rawError: string): string | null {
  if (rawError.includes("TOTP_REQUIRED")) return "TOTP_REQUIRED";
  if (rawError.includes("INVALID_TOTP")) return "INVALID_TOTP";
  if (rawError.includes("INVALID_CREDENTIALS")) return "INVALID_CREDENTIALS";
  if (rawError === "CredentialsSignin") return "INVALID_CREDENTIALS";
  return null;
}
