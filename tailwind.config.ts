import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Tailwind v3 yapılandırması.
 *
 * NOT — "ara sıra style'lar gitmesi" sorununa karşı önlemler:
 *   1. content path'leri DAHA GENİŞ tutuldu (.js/.jsx/.mdx dahil)
 *      ki dev sunucu hot-reload sonrası dosyaları kaçırmasın.
 *   2. safelist — dinamik render edilen kritik class'ları (status badge'leri,
 *      slot button stateleri vs.) JIT'in budamasını engelliyor.
 *   3. node_modules açıkça hariç tutuluyor (tarama hızlanır, hatalar azalır).
 */

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./lib/**/*.{js,jsx,ts,tsx,mdx}",
    "./hooks/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  // Dinamik olarak üretilen ya da koşullu render'da geçen ama Tailwind'in
  // JIT'inin statik analizle bulamayacağı class'lar — burada listeleyince
  // her zaman bundle'a girer.
  safelist: [
    // Status badge renkleri (PENDING/APPROVED/COMPLETED/REJECTED/CANCELLED)
    "bg-amber-50", "bg-amber-100", "bg-amber-500", "text-amber-700", "text-amber-800", "text-amber-900", "border-l-amber-500",
    "bg-emerald-50", "bg-emerald-100", "bg-emerald-500", "bg-emerald-600", "bg-emerald-700", "bg-emerald-800",
    "text-emerald-600", "text-emerald-700", "text-emerald-800", "text-emerald-900", "border-l-emerald-500",
    "bg-red-50", "bg-red-100", "bg-red-500", "text-red-700", "text-red-800", "text-red-900", "border-l-red-500",
    "bg-slate-50", "bg-slate-100", "bg-slate-500", "text-slate-500", "text-slate-700", "border-l-slate-500", "border-l-slate-400",
    // Service ikon kategori bg'leri (services-manager'da dinamik)
    "bg-blue-50", "bg-violet-50", "bg-sky-50", "bg-rose-50", "bg-indigo-50", "bg-teal-50", "bg-green-50",
    "text-blue-600", "text-violet-600", "text-sky-600", "text-rose-600", "text-indigo-600", "text-teal-600", "text-green-700",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
