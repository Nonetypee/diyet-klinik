/**
 * Landing page için varsayılan içerikler.
 *
 * `prisma/seed.ts` LandingContent kaydı oluştururken bu değerleri kullanır.
 * Ayrıca DB'de kayıt yoksa runtime'da fallback olarak da kullanılır.
 */

export interface HeroTrustSignal {
  icon: string; // Lucide icon adı
  text: string;
}

export interface TrustPillar {
  icon: string;
  title: string;
  description: string;
}

export type TrustStat = [string, string]; // [value, label]

export interface HowStep {
  number: string;
  icon: string;
  title: string;
  description: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export const DEFAULT_HERO_TRUST_SIGNALS: HeroTrustSignal[] = [
  { icon: "ShieldCheck", text: "KVKK Uyumlu" },
  { icon: "Sprout", text: "9+ yıl klinik deneyim" },
  { icon: "BadgeCheck", text: "Hacettepe BES & Diyetetik" },
];

export const DEFAULT_TRUST_PILLARS: TrustPillar[] = [
  {
    icon: "FlaskConical",
    title: "Bilim Temelli Yaklaşım",
    description:
      "Akademik beslenme bilimi ve güncel klinik araştırmalara dayanan, kanıta dayalı diyet protokolleri uygulanır.",
  },
  {
    icon: "UserCheck",
    title: "Kişiye Özel Plan",
    description:
      "Yaşam tarzınız, alışkanlıklarınız, alerjileriniz ve laboratuvar değerlerinize göre özelleştirilmiş program.",
  },
  {
    icon: "Repeat",
    title: "Sürdürülebilir Sonuç",
    description:
      "Geçici diyetler değil — kalıcı yaşam değişimi. Yo-yo etkisi olmadan, beslenme alışkanlığı kazandırır.",
  },
  {
    icon: "Video",
    title: "Online & Yüz Yüze",
    description:
      "Türkiye ve dünyanın her yerinden video görüşme, ya da klinikte yüz yüze danışmanlık.",
  },
  {
    icon: "MessageCircle",
    title: "Sürekli Takip & Destek",
    description:
      "WhatsApp destek hattı, haftalık check-in ve dijital plan ile süreç boyunca yanınızdayım.",
  },
  {
    icon: "ShieldCheck",
    title: "KVKK Uyumlu",
    description:
      "Sağlık verileriniz 6698 sayılı KVKK çerçevesinde şifrelenerek saklanır, üçüncü tarafla paylaşılmaz.",
  },
];

export const DEFAULT_TRUST_STATS: TrustStat[] = [
  ["1.500+", "Memnun danışan"],
  ["9 yıl", "Klinik deneyim"],
  ["%92", "Hedef başarısı"],
  ["7/24", "Randevu talebi"],
];

export const DEFAULT_HOW_STEPS: HowStep[] = [
  {
    number: "01",
    icon: "FileText",
    title: "Talebinizi Oluşturun",
    description:
      "Hizmet, tarih ve saat seçerek randevu talebinizi 60 saniyeden kısa sürede gönderin.",
  },
  {
    number: "02",
    icon: "ShieldCheck",
    title: "Talebinizi İnceleyim",
    description:
      "Takvimi kontrol eder, uygunluğu doğrularım. KVKK çerçevesinde randevunuzu onaylarım.",
  },
  {
    number: "03",
    icon: "MessageSquareText",
    title: "SMS ile Bilgilenin",
    description:
      "Onaylanan randevunuz cep telefonunuza otomatik SMS ile bildirilir. Hatırlatma da gelir.",
  },
  {
    number: "04",
    icon: "CalendarCheck",
    title: "Görüşmeye Katılın",
    description:
      "Online video bağlantısıyla ya da klinikte yüz yüze görüşmeye başlayalım.",
  },
];

export const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    q: "Online danışmanlık nasıl yürütülüyor?",
    a: "Görüşme öncesi e-posta ile gönderilen Zoom/Google Meet bağlantısı üzerinden 45-60 dakikalık seans yapılır. Beslenme planı, takip dosyaları ve dijital tarif kitabı PDF olarak iletilir.",
  },
  {
    q: "İlk görüşmede neler konuşulur?",
    a: "İlk görüşme yaklaşık 60 dakikadır. Beslenme alışkanlıklarınız, sağlık geçmişiniz, laboratuvar değerleriniz, hedefleriniz ve yaşam tarzınız detaylı şekilde değerlendirilir. Kişiye özel plan, bu görüşmenin ardından 24-48 saat içinde hazırlanır.",
  },
  {
    q: "Diyet listesi ne kadar süre sonra hazır olur?",
    a: "İlk görüşmenin ardından en geç 48 saat içinde özel beslenme planınız e-posta ile iletilir. Plan; alışveriş listesi, yemek tarifleri ve değişim listesini içerir.",
  },
  {
    q: "Kaç seans gerekir?",
    a: "Hedefe göre değişir. Genellikle ilk ay haftalık takip, sonrasında 2 haftada bir seans yeterli olur. Ortalama bir kilo verme süreci 3-6 ay arasındadır.",
  },
  {
    q: "Yo-yo etkisi yaşar mıyım?",
    a: "Hayır. Programlarımız aşırı kısıtlayıcı diyetler değil, sürdürülebilir yaşam değişikliği üzerine kuruludur.",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Evet. Tüm danışan bilgileri 6698 sayılı KVKK çerçevesinde şifrelenerek saklanır. Verileriniz hiçbir üçüncü tarafla paylaşılmaz.",
  },
  {
    q: "Ödeme nasıl yapılır?",
    a: "Online görüşmelerde havale/EFT veya kredi kartı kabul edilir. Yüz yüze görüşmelerde nakit veya kart ile ödeme yapabilirsiniz.",
  },
];

export const DEFAULT_LANDING_COLORS = {
  primaryColor: "#047857",
  primaryColorDark: "#065f46",
  accentColor: "#14b8a6",
  darkBgColor: "#064e3b",
} as const;

export interface LandingContentValues {
  primaryColor: string;
  primaryColorDark: string;
  accentColor: string;
  darkBgColor: string;
  heroBadge: string;
  heroTitlePart1: string;
  heroTitleAccent: string;
  heroTitlePart2: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroTrustSignals: HeroTrustSignal[];
  trustBadge: string;
  trustTitle: string;
  trustSubtitle: string;
  trustPillars: TrustPillar[];
  trustStats: TrustStat[];
  servicesBadge: string;
  servicesTitle: string;
  servicesSubtitle: string;
  howBadge: string;
  howTitle: string;
  howSubtitle: string;
  howSteps: HowStep[];
  bookingBadge: string;
  bookingTitle: string;
  bookingSubtitle: string;
  faqBadge: string;
  faqTitle: string;
  faqItems: FaqItem[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaPrimary: string;
}

export const DEFAULT_LANDING_CONTENT: LandingContentValues = {
  ...DEFAULT_LANDING_COLORS,
  heroBadge: "Bilime dayalı, kişiye özel beslenme",
  heroTitlePart1: "Sağlıklı yaşam,",
  heroTitleAccent: "sürdürülebilir",
  heroTitlePart2: "beslenme alışkanlığıyla başlar.",
  heroSubtitle:
    "Yo-yo diyetlerine veda. Yaşam tarzınıza, hedefinize ve laboratuvar değerlerinize göre kişiselleştirilmiş, bilim temelli bir beslenme planıyla kalıcı sonuçlara birlikte ulaşalım.",
  heroCtaPrimary: "Hemen Randevu Talep Et",
  heroCtaSecondary: "Hizmetlerimi İnceleyin",
  heroTrustSignals: DEFAULT_HERO_TRUST_SIGNALS,
  trustBadge: "Neden Beni Seçmelisiniz?",
  trustTitle: "Sürdürülebilir sonuç,\nşeffaf süreç.",
  trustSubtitle:
    "Yo-yo diyetler ve genel-geçer öneriler size zaman kaybettiriyor. Bilime dayalı, kişiye özel bir plan ile gerçek sağlık dönüşümü mümkün.",
  trustPillars: DEFAULT_TRUST_PILLARS,
  trustStats: DEFAULT_TRUST_STATS,
  servicesBadge: "Hizmetlerim",
  servicesTitle: "Her hedef için, kişiye özel bir plan.",
  servicesSubtitle:
    "Kilo yönetiminden sporcu beslenmesine, hamilelik dönemine ve hastalık bazlı medikal beslenmeye uzanan kapsamlı bir uzmanlık.",
  howBadge: "Nasıl Çalışır?",
  howTitle: "Onay-öncelikli, şeffaf bir akış",
  howSubtitle:
    "Otomatik onay yerine her randevu titizlikle kontrol edilir. Hata payı yoktur, çakışma yaşanmaz.",
  howSteps: DEFAULT_HOW_STEPS,
  bookingBadge: "Randevu Talebi",
  bookingTitle: "Sağlıklı yaşam için ilk adımı atın",
  bookingSubtitle:
    "Formu doldurun, en kısa sürede randevunuzu değerlendireyim. Onaylandığında bilgilendirileceksiniz.",
  faqBadge: "Sıkça Sorulan Sorular",
  faqTitle: "Aklınıza takılanlar",
  faqItems: DEFAULT_FAQ_ITEMS,
  ctaTitle: "Sağlıklı yaşam için\nbekleyecek vaktiniz yok.",
  ctaSubtitle:
    "Randevu sürecinizi 60 saniyede tamamlayın. Onayım SMS ile size ulaşacak, sürdürülebilir değişim yolculuğunuz başlayacak.",
  ctaPrimary: "Randevu Talep Et",
};
