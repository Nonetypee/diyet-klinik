/**
 * DİYETİSYEN HİZMET KATALOĞU
 *
 * Bu dosya hem seed scripti hem de landing page formu tarafından
 * tüketilir. Slug değerleri stabil tutulmalıdır — form'dan gönderilen
 * slug, API tarafında Service.slug ile eşleşir.
 */

export type ServiceCategory = "WEIGHT" | "SPORTS" | "MEDICAL" | "LIFESTYLE";

export interface ServiceDef {
  slug: string;
  name: string;
  iconName: string; // Lucide icon adı
  description: string;
  shortBenefits: string[];
  category: ServiceCategory;
  durationMin: number;
  priceFromTRY?: number;
}

export const DIETITIAN_SERVICES: ServiceDef[] = [
  {
    slug: "kilo-yonetimi",
    name: "Kilo Yönetimi",
    iconName: "Scale",
    category: "WEIGHT",
    durationMin: 60,
    description:
      "Bilime dayalı, sürdürülebilir kilo verme veya alma programı. Yaşam tarzınıza göre kişiselleştirilmiş plan.",
    shortBenefits: ["Sürdürülebilir Plan", "Haftalık Takip", "Yo-yo Etkisi Yok"],
  },
  {
    slug: "sporcu-beslenmesi",
    name: "Sporcu Beslenmesi",
    iconName: "Dumbbell",
    category: "SPORTS",
    durationMin: 60,
    description:
      "Performans, kas kazanımı ve toparlanma için antrenman planınıza özel beslenme programı.",
    shortBenefits: ["Performans Artışı", "Makro Hesabı", "Suplement Önerisi"],
  },
  {
    slug: "cocuk-adolesan",
    name: "Çocuk & Adolesan Beslenmesi",
    iconName: "Apple",
    category: "LIFESTYLE",
    durationMin: 45,
    description:
      "Sağlıklı büyüme ve gelişme için yaşa uygun, dengeli beslenme planları.",
    shortBenefits: ["Büyüme Takibi", "Aileyle Birlikte", "Beslenme Eğitimi"],
  },
  {
    slug: "hamilelik-emzirme",
    name: "Hamilelik & Emzirme",
    iconName: "Heart",
    category: "MEDICAL",
    durationMin: 60,
    description:
      "Anne ve bebek sağlığı için trimester bazlı beslenme önerileri ve takibi.",
    shortBenefits: ["Trimester Bazlı", "Vitamin & Mineral", "Doktor İşbirliği"],
  },
  {
    slug: "hastalik-bazli",
    name: "Hastalık Bazlı Diyet",
    iconName: "Activity",
    category: "MEDICAL",
    durationMin: 60,
    description:
      "Diyabet, hipertansiyon, insülin direnci, çölyak gibi durumlar için medikal beslenme tedavisi.",
    shortBenefits: ["Diyabet", "İnsülin Direnci", "Hipertansiyon"],
  },
  {
    slug: "vegan-vejetaryen",
    name: "Vegan & Vejetaryen",
    iconName: "Leaf",
    category: "LIFESTYLE",
    durationMin: 45,
    description:
      "Bitki bazlı beslenmede protein, B12 ve demir dengesi için uzman desteği.",
    shortBenefits: ["Protein Dengesi", "B12 Takibi", "Lezzetli Tarifler"],
  },
  {
    slug: "online-danismanlik",
    name: "Online Beslenme Danışmanlığı",
    iconName: "Video",
    category: "LIFESTYLE",
    durationMin: 45,
    description:
      "Türkiye ve dünyanın her yerinden video görüşme ile danışmanlık imkanı.",
    shortBenefits: ["Video Görüşme", "Esnek Saat", "Dijital Plan"],
  },
  {
    slug: "bagirsak-sagligi",
    name: "Bağırsak Sağlığı & Mikrobiyota",
    iconName: "Sprout",
    category: "MEDICAL",
    durationMin: 60,
    description:
      "Şişkinlik, hassas bağırsak, IBS ve mikrobiyota odaklı kişiselleştirilmiş plan.",
    shortBenefits: ["IBS Desteği", "Probiyotik", "Eliminasyon Diyeti"],
  },
];

export function getServiceBySlug(slug: string): ServiceDef | undefined {
  return DIETITIAN_SERVICES.find((s) => s.slug === slug);
}
