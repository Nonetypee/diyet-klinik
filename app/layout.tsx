import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: {
    default: "Dyt. Selin Akar - Beslenme & Diyet Danışmanlığı",
    template: "%s | Dyt. Selin Akar",
  },
  description:
    "Bilime dayalı, kişiye özel beslenme programları. Kilo yönetimi, sporcu beslenmesi, hastalık bazlı diyet ve online danışmanlık. KVKK uyumlu.",
  keywords: [
    "diyetisyen",
    "beslenme danışmanı",
    "kadıköy diyetisyen",
    "online diyetisyen",
    "kilo yönetimi",
    "sporcu beslenmesi",
    "insülin direnci diyeti",
  ],
  authors: [{ name: "Dyt. Selin Akar" }],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    title: "Dyt. Selin Akar - Beslenme & Diyet Danışmanlığı",
    description:
      "Sürdürülebilir, bilime dayalı beslenme programları. Online ve yüz yüze danışmanlık.",
    siteName: "Dyt. Selin Akar",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.className} bg-white text-slate-900 antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
