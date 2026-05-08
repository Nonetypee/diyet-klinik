# Diyet Klinik — Dyt. Selin Akar Beslenme Danışmanlığı

Türk diyetisyenler için tasarlanmış, **onay öncelikli (Approval-First)** randevu yönetim sistemi. Tek diyetisyen, tek klinik (single-tenant). Hasta talebi → Diyetisyen onayı → Otomatik **WhatsApp / SMS** akışı.

## Teknoloji

- **Next.js 15** (App Router, Server Components)
- **Auth.js v5 (NextAuth)** — Credentials provider, JWT session
- **Prisma + SQLite** (kurulum gerektirmez)
- **Modüler Mesajlaşma**: WhatsApp Cloud API (birincil), Netgsm/Mutlucell (yedek), Mock (dev)
- **Tailwind CSS** + shadcn-style UI primitive'leri
- **react-hook-form + zod** form doğrulama
- **bcryptjs** şifre hashleme

## Hızlı Başlangıç

```bash
npm install
cp .env.example .env

# DB hazırla + admin oluştur
npx prisma db push
npm run db:seed

npm run dev
```

Açın:
- `http://localhost:3000` — Landing page
- `http://localhost:3000/login` — Yönetim paneli girişi

**Demo giriş bilgileri** (seed ile oluşturulur):
- E-posta: `admin@diyetklinik.com`
- Şifre: `admin1234`

## Kimlik Doğrulama (Auth.js v5)

- **Login**: `/login` (Credentials provider — e-posta + şifre)
- **Korumalı**: `/admin/*` — middleware ile, giriş yapmamış kullanıcı `/login`'e yönlendirilir
- **Session**: JWT tabanlı, 12 saat geçerli
- **Şifre**: bcrypt ile hashlenip `User.passwordHash`'te saklanır
- **Logout**: Sidebar'daki kullanıcı menüsünden

İlk admin kullanıcı `prisma/seed.ts` tarafından oluşturulur. Üretimde
`ADMIN_PASSWORD` env değerini değiştirip yeniden seed edin, ya da
veritabanına manuel bcrypt-hashlenmiş şifre ekleyin.

## Mesajlaşma (WhatsApp + SMS Fallback)

### Maliyet Karşılaştırması

| Kanal              | Mesaj Başına | Avantaj                              |
| ------------------ | ------------ | ------------------------------------ |
| WhatsApp Cloud API | ~0.65 TL     | Yüksek okuma oranı, zengin medya     |
| Netgsm SMS         | ~1.50 TL     | Telefon numarası varsa çalışır       |

WhatsApp ~%55 daha ucuz. **Önerilen yapılandırma**:

```env
MESSAGING_PROVIDER=WHATSAPP
MESSAGING_FALLBACK_PROVIDER=NETGSM
```

Bu yapıda her bildirim önce WhatsApp ile gönderilir; başarısız olursa
otomatik SMS'e fallback yapılır.

### WhatsApp Kurulumu

1. **Meta for Developers** üzerinden bir App oluşturun
   ([developers.facebook.com](https://developers.facebook.com))
2. WhatsApp ürününü ekleyin → Phone Number ID ve Access Token alın
3. **Business Manager** → WhatsApp Manager → Mesaj Şablonları'ndan
   şu template'leri onaylatın (kategori: **UTILITY**, dil: **Turkish (tr)**):
   - `appointment_approved`
     ```
     Sayın {{1}}, {{2}} tarihindeki {{3}} ile randevunuz onaylanmıştır.
     İptal/değişiklik için: {{4}}
     ```
   - `appointment_rejected`
     ```
     Sayın {{1}}, randevu talebiniz şu anda karşılanamamaktadır.
     Sebep: {{2}} Önerilen alternatif: {{3}} İletişim: {{4}}
     ```
4. `.env` dosyasında `WHATSAPP_PHONE_NUMBER_ID` ve `WHATSAPP_ACCESS_TOKEN` tanımlayın

### Neden Template?

WhatsApp Cloud API'nın **24-saat kuralı**: Bir kullanıcı son 24 saat
içinde size mesaj atmadıysa, ona ancak **onaylı template mesajı**
gönderilebilir. Randevu onayı/reddi server-initiated olduğu için
template kullanmak zorunludur. Template parametreleri kod içinde
runtime'da doldurulur.

### Yeni Sağlayıcı Eklemek

`lib/sms/providers/` altına `SmsProvider` arayüzünü implement eden
yeni bir sınıf yazıp `lib/sms/index.ts` içindeki `buildProvider`
fonksiyonuna ekleyin. Sağlayıcının `channel: "SMS" | "WHATSAPP"` alanı
hangi kanaldan gönderim yaptığını belirtir.

## Düzeltilen Backend Sorunları

| Sorun | Çözüm |
|-------|-------|
| Form `serviceId` olarak hardcoded sabit gönderiyordu, foreign key hatası | Form artık `serviceSlug` gönderiyor; API `Service.slug` ile gerçek ID'yi buluyor |
| Admin Inbox demo data kullanıyordu | Server component, gerçek `PENDING` randevuları çekiyor |
| Admin Calendar demo data | Önümüzdeki 3 haftanın gerçek randevuları, otomatik o haftaya atlama |
| Dashboard istatistikleri sabitti | Canlı `prisma.appointment.count()` |
| Postgres kurulumu gerekiyordu | SQLite — kurulum yok |
| Approve/reject route'ları kırılgandı | Idempotent, atomic, dev modda gerçek hata mesajı |
| Auth yoktu | NextAuth v5 + middleware ile /admin koruması |
| Sadece SMS vardı | WhatsApp Cloud API eklendi, fallback ile birlikte |

## Proje Yapısı

```
.
├─ auth.ts                       # NextAuth ana yapılandırma
├─ auth.config.ts                # Edge-uyumlu config (middleware için)
├─ middleware.ts                 # /admin/* korur, /login'e yönlendirir
├─ types/next-auth.d.ts          # Session.user.id ve role tip uzantısı
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                   # Landing page
│  ├─ login/page.tsx             # Giriş sayfası (admin chrome'suz)
│  ├─ admin/                     # Tüm /admin/* — auth gerektirir
│  │  ├─ layout.tsx              # Sidebar + UserMenu (auth fetch)
│  │  ├─ page.tsx                # Dashboard
│  │  ├─ inbox/page.tsx          # Onay kuyruğu
│  │  ├─ appointments/page.tsx   # Tüm randevular (status filtreli)
│  │  ├─ calendar/page.tsx       # Akıllı takvim
│  │  └─ settings/page.tsx       # 6 sekmeli ayarlar (Mesajlaşma dahil)
│  └─ api/
│     ├─ auth/[...nextauth]/route.ts   # Auth handler
│     ├─ appointments/                  # CRUD + approve/reject
│     ├─ notifications/route.ts         # Admin bildirimleri
│     └─ settings/...                   # Klinik / diyetisyen güncelleme
├─ components/
│  ├─ landing/                    # Hero, Services, Testimonials, vs.
│  ├─ admin/
│  │  ├─ approval-queue.tsx       # Onayla/Reddet
│  │  ├─ appointments-list.tsx    # Tab filtreli liste
│  │  ├─ smart-calendar.tsx       # Günlük/Haftalık görünüm
│  │  ├─ notifications-bell.tsx   # Bildirim dropdown
│  │  ├─ settings-view.tsx        # Ayarlar 6 sekmesi
│  │  ├─ login-form.tsx           # Auth.js signIn
│  │  └─ user-menu.tsx            # Profil + çıkış
│  ├─ providers/session-provider.tsx
│  └─ ui/                         # Button, Input, Select, vb.
├─ lib/
│  ├─ db.ts                       # Prisma singleton
│  ├─ utils.ts
│  ├─ services-config.ts          # 8 hizmet kataloğu (paylaşılan)
│  ├─ validation/appointment.ts   # Zod, TR cep telefonu doğrulama
│  └─ sms/                        # Aslında "messaging" — eski isim
│     ├─ index.ts                 # getSmsProvider + sendSms (fallback'li)
│     ├─ types.ts                 # NotificationMessage, TemplateMessage, vs.
│     └─ providers/
│        ├─ mock.ts
│        ├─ netgsm.ts             # SMS
│        ├─ mutlucell.ts          # SMS
│        └─ whatsapp.ts           # WhatsApp Cloud API
└─ prisma/
   ├─ schema.prisma
   └─ seed.ts                     # Klinik + diyetisyen + servisler + admin user
```

## Komutlar

```bash
npm run dev          # Geliştirme sunucusu
npm run build        # Production build
npm run db:push      # Şemayı SQLite'a yansıt
npm run db:seed      # Demo veri + admin user
npm run db:generate  # Prisma client yeniden üret
```

## Sonraki Adımlar

1. **Şifre sıfırlama** — e-posta tabanlı reset flow
2. **Online görüşme** — Zoom/Meet entegrasyonu otomatik link üretimi
3. **Beslenme planı PDF** — `pdf` skill ile dinamik PDF üretimi
4. **WhatsApp inbound** — danışan mesajlarına otomatik yanıt + sekreter eskalasyonu
5. **Çoklu sekreter** — User.role bazlı izin yönetimi
