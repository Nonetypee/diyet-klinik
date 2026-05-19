import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { DIETITIAN_SERVICES } from "../lib/services-config";
import {
  DEFAULT_FAQ_ITEMS,
  DEFAULT_HERO_TRUST_SIGNALS,
  DEFAULT_HOW_STEPS,
  DEFAULT_TRUST_PILLARS,
  DEFAULT_TRUST_STATS,
} from "../lib/landing-defaults";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  // 1. Klinik (single-tenant)
  const clinic = await prisma.clinic.upsert({
    where: { slug: "diyet-klinik" },
    update: {},
    create: {
      slug: "diyet-klinik",
      name: "Dyt. Selin Akar - Beslenme & Diyet",
      tagline: "Sağlıklı yaşam için kişiye özel beslenme",
      phone: "+902121234567",
      whatsapp: "+905321234567",
      email: "info@selinakarbeslenme.com",
      address: "Bağdat Caddesi No: 123, Daire 4",
      city: "İstanbul",
      district: "Kadıköy",
      workingHours: JSON.stringify({
        monday:    { open: "09:00", close: "18:00", closed: false },
        tuesday:   { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday:  { open: "09:00", close: "18:00", closed: false },
        friday:    { open: "09:00", close: "18:00", closed: false },
        saturday:  { open: "10:00", close: "16:00", closed: false },
        sunday:    { closed: true },
      }),
      kvkkText:
        "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, randevu talebiniz sırasında paylaştığınız ad-soyad, telefon, e-posta ve sağlık bilgileri yalnızca beslenme danışmanlığı süreçlerinin yürütülmesi amacıyla işlenmektedir.",
      metaTitle: "Dyt. Selin Akar - İstanbul Kadıköy Beslenme Danışmanlığı",
      metaDescription:
        "Bilime dayalı, kişiye özel beslenme programları. Online ve yüz yüze danışmanlık. KVKK uyumlu.",
      keywords: "diyetisyen, beslenme danışmanı, kadıköy diyetisyen, kilo yönetimi",
    },
  });

  // 2. Diyetisyen — tek satır
  const existingDietician = await prisma.dietician.findFirst();
  if (!existingDietician) {
    await prisma.dietician.create({
      data: {
        fullName: "Selin Akar",
        title: "Dyt.",
        specialty: "Klinik Beslenme & Diyetetik",
        bio:
          "Hacettepe Üniversitesi Beslenme ve Diyetetik mezunu. 9 yıllık deneyim. " +
          "Kişiye özel, sürdürülebilir programlar ile 1500+ danışana ulaştı. " +
          "TDD (Türkiye Diyetisyenler Derneği) üyesidir.",
        yearsOfExperience: 9,
        licenseNumber: "DYT-12345",
      },
    });
  }

  // 3. Hizmetler — paylaşılan katalogtan
  for (let i = 0; i < DIETITIAN_SERVICES.length; i++) {
    const s = DIETITIAN_SERVICES[i];
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        iconName: s.iconName,
        category: s.category,
        durationMin: s.durationMin,
        description: s.description,
        sortOrder: i,
      },
      create: {
        clinicId: clinic.id,
        slug: s.slug,
        name: s.name,
        iconName: s.iconName,
        category: s.category,
        durationMin: s.durationMin,
        description: s.description,
        sortOrder: i,
      },
    });
  }

  // 4. Demo testimonialler
  const testimonials = [
    {
      patientName: "Aslı M.",
      rating: 5,
      service: "Kilo Yönetimi",
      result: "12 kg kayıp - 5 ayda",
      comment:
        "Selin Hanım'ın programı sayesinde sadece kilo vermekle kalmadım, beslenme alışkanlıklarım kalıcı olarak değişti. Kesinlikle yo-yo etkisi yaşamadım.",
      isVerified: true,
      isFeatured: true,
    },
    {
      patientName: "Kerem T.",
      rating: 5,
      service: "Sporcu Beslenmesi",
      result: "8 kg kas kazanımı",
      comment:
        "Antrenmanlarım için doğru makroları öğrendim. Performansım belirgin şekilde arttı, toparlanma sürem kısaldı.",
      isVerified: true,
      isFeatured: true,
    },
    {
      patientName: "Zeynep K.",
      rating: 5,
      service: "İnsülin Direnci",
      result: "HOMA-IR 4.2 → 1.8",
      comment:
        "İnsülin direncim için aldığım danışmanlık değerlerimi normal aralığa getirdi. Üstelik enerjim de geri geldi.",
      isVerified: true,
      isFeatured: true,
    },
    {
      patientName: "Mehmet O.",
      rating: 5,
      service: "Online Danışmanlık",
      result: "Sürdürülebilir alışkanlık",
      comment:
        "Yurt dışında çalıştığım için online danışmanlık çok pratik oldu. Her hafta WhatsApp'tan check-in yapıyoruz.",
      isVerified: true,
      isFeatured: false,
    },
    {
      patientName: "Ayşe G.",
      rating: 5,
      service: "Hamilelik Beslenmesi",
      result: "Sağlıklı gebelik",
      comment:
        "Hamileliğim boyunca hangi besini ne kadar tüketmem gerektiğini öğrendim. Hem ben hem bebeğim sağlıklı.",
      isVerified: true,
      isFeatured: false,
    },
  ];

  for (const t of testimonials) {
    const exists = await prisma.testimonial.findFirst({
      where: { patientName: t.patientName, comment: t.comment },
    });
    if (!exists) {
      await prisma.testimonial.create({
        data: { ...t, clinicId: clinic.id },
      });
    }
  }

  // 5. Demo PENDING randevular (admin paneli denemesi için)
  const pendingCount = await prisma.appointment.count({ where: { status: "PENDING" } });
  if (pendingCount === 0) {
    const kiloService = await prisma.service.findUnique({ where: { slug: "kilo-yonetimi" } });
    const sporcuService = await prisma.service.findUnique({ where: { slug: "sporcu-beslenmesi" } });
    const onlineService = await prisma.service.findUnique({ where: { slug: "online-danismanlik" } });
    const dietician = await prisma.dietician.findFirst();

    if (kiloService && sporcuService && onlineService && dietician) {
      const future = (days: number, h: number, m = 0) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        d.setHours(h, m, 0, 0);
        return d;
      };

      await prisma.appointment.createMany({
        data: [
          {
            clinicId: clinic.id,
            dieticianId: dietician.id,
            serviceId: kiloService.id,
            patientName: "Selin Kara",
            patientPhone: "0532 111 22 33",
            patientEmail: "selin@example.com",
            patientNote: "Sabah saatleri tercih ederim, mümkünse 09:30.",
            requestedAt: future(2, 9, 30),
            status: "PENDING",
            kvkkConsent: true,
            kvkkConsentAt: new Date(),
          },
          {
            clinicId: clinic.id,
            dieticianId: dietician.id,
            serviceId: sporcuService.id,
            patientName: "Burak Tan",
            patientPhone: "0541 444 55 66",
            patientNote: "Hafta sonu CrossFit yapıyorum, antrenman sonrası toparlanma için danışmak istiyorum.",
            requestedAt: future(3, 14, 0),
            status: "PENDING",
            kvkkConsent: true,
            kvkkConsentAt: new Date(),
          },
          {
            clinicId: clinic.id,
            dieticianId: dietician.id,
            serviceId: onlineService.id,
            patientName: "Aylin Mert",
            patientPhone: "0535 222 33 44",
            requestedAt: future(1, 11, 0),
            status: "PENDING",
            kvkkConsent: true,
            kvkkConsentAt: new Date(),
          },
        ],
      });
    }
  }

  // Yaklaşan onaylı randevu (takvim için)
  const approvedCount = await prisma.appointment.count({ where: { status: "APPROVED" } });
  if (approvedCount === 0) {
    const kiloService = await prisma.service.findUnique({ where: { slug: "kilo-yonetimi" } });
    const dietician = await prisma.dietician.findFirst();
    if (kiloService && dietician) {
      const today = new Date();
      today.setHours(11, 0, 0, 0);
      await prisma.appointment.create({
        data: {
          clinicId: clinic.id,
          dieticianId: dietician.id,
          serviceId: kiloService.id,
          patientName: "Ali Yıldız",
          patientPhone: "0532 999 11 22",
          requestedAt: today,
          status: "APPROVED",
          approvedAt: new Date(),
          kvkkConsent: true,
          kvkkConsentAt: new Date(),
        },
      });
    }
  }

  // 5b. Anasayfa içeriği — singleton
  await prisma.landingContent.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      heroTrustSignals: JSON.stringify(DEFAULT_HERO_TRUST_SIGNALS),
      trustPillars: JSON.stringify(DEFAULT_TRUST_PILLARS),
      trustStats: JSON.stringify(DEFAULT_TRUST_STATS),
      howSteps: JSON.stringify(DEFAULT_HOW_STEPS),
      faqItems: JSON.stringify(DEFAULT_FAQ_ITEMS),
    },
  });

  // 6. Eski hesapların username alanını doldur (mevcut kurulumlardan
  //    yükseltme için). Yoksa atla.
  const usersWithoutUsername = await prisma.user.findMany({
    where: { username: null },
    select: { id: true, email: true },
  });
  for (const u of usersWithoutUsername) {
    const base =
      (u.email ?? "user").split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") ||
      "user";
    let candidate = base;
    let i = 0;
    while (
      await prisma.user.findFirst({
        where: { username: candidate, NOT: { id: u.id } },
      })
    ) {
      i += 1;
      candidate = `${base}${i}`;
    }
    await prisma.user.update({
      where: { id: u.id },
      data: { username: candidate },
    });
    console.log(`   Username dolduruldu: ${u.email ?? u.id} → ${candidate}`);
  }

  // 7. DEVELOPER hesabı — yalnızca .env üzerinden yönetilir.
  //    Şifre her seed çalıştırıldığında env değerine senkronlanır;
  //    böylece kaybedildiyse env üzerinden değiştirip seed çalıştırmak yeterli.
  const devUsername = process.env.DEVELOPER_USERNAME ?? "developer";
  const devPassword = process.env.DEVELOPER_PASSWORD ?? null;

  if (!devPassword) {
    console.warn(
      "   ⚠ DEVELOPER_PASSWORD .env içinde tanımlı değil — developer hesabı oluşturulmadı."
    );
  } else {
    const passwordHash = await hash(devPassword, 10);
    const existingDev = await prisma.user.findUnique({
      where: { username: devUsername },
    });
    if (!existingDev) {
      // Eski kurulumdaki admin'i developer'a yükselt
      const legacyAdmin =
        (await prisma.user.findFirst({
          where: { role: { in: ["DEVELOPER", "SUPER_ADMIN", "DIETICIAN"] } },
        })) ?? null;

      if (legacyAdmin) {
        await prisma.user.update({
          where: { id: legacyAdmin.id },
          data: {
            username: devUsername,
            passwordHash,
            role: "DEVELOPER",
            isActive: true,
          },
        });
        console.log(
          `   Mevcut hesap developer'a yükseltildi: ${devUsername}`
        );
      } else {
        await prisma.user.create({
          data: {
            username: devUsername,
            passwordHash,
            fullName: "Developer",
            role: "DEVELOPER",
            isActive: true,
          },
        });
        console.log(`   Developer hesabı oluşturuldu: ${devUsername}`);
      }
    } else {
      await prisma.user.update({
        where: { id: existingDev.id },
        data: {
          passwordHash,
          role: "DEVELOPER",
          isActive: true,
        },
      });
      console.log(`   Developer şifresi .env ile senkronlandı: ${devUsername}`);
    }
  }

  console.log("✅ Seed tamamlandı.");
  console.log("   Klinik:", clinic.slug);
  console.log("   Hizmet sayısı:", DIETITIAN_SERVICES.length);
  console.log("");
  if (devPassword) {
    console.log(
      `🔐 Giriş için: /login — kullanıcı adı: ${devUsername}`
    );
    console.log("   (Şifre: .env içindeki DEVELOPER_PASSWORD)");
  } else {
    console.log(
      "🔐 Developer hesabı oluşturulmadı. .env içinde DEVELOPER_PASSWORD tanımlayıp tekrar seed çalıştırın."
    );
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
