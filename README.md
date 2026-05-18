# Diyet Klinik — VPS Kurulum & Yönetim Kılavuzu

Türk diyetisyenler için **onay-öncelikli** randevu yönetim sistemi. Tek diyetisyenli klinik (single-tenant). WhatsApp Cloud API + SMS bildirim, TOTP 2FA, otomatik yedekleme, hasta dosyaları.

## Hızlı Başlangıç (Geliştirme)

```bash
npm install
cp .env.example .env
npx prisma db push && npm run db:seed
npm run dev
```

Tarayıcıda `http://localhost:3000` (landing) ve `http://localhost:3000/login` (admin).

---

# 🚀 VPS Üretim Kurulumu

## VPS Seçimi

### Önerilen İşletim Sistemi
**Ubuntu 24.04 LTS** (Long-Term Support — Nisan 2034'e kadar destekli) veya **Ubuntu 22.04 LTS**.

Neden Ubuntu LTS?
- En yaygın belgelenen sunucu Linux'u (sorun yaşadığınızda çözüm bulmak kolay)
- Node.js, Nginx, Certbot için resmi paket desteği var
- 10 yıl boyunca güvenlik yamaları geliyor

> Diğer Linux'lar (Debian 12, Rocky Linux, AlmaLinux) da çalışır ama paket isimleri farklı olabilir; aşağıdaki komutlar Ubuntu için yazıldı.

### Minimum Donanım

| Trafiğe Göre              | CPU       | RAM       | Disk      |
|---------------------------|-----------|-----------|-----------|
| Küçük klinik (< 50 randevu/gün)  | 1 vCPU    | 1 GB      | 20 GB SSD |
| Orta klinik (< 200 randevu/gün)  | 2 vCPU    | 2 GB      | 40 GB SSD |
| Büyük zincir              | 4 vCPU    | 4 GB+     | 80 GB SSD |

**Tavsiye edilen VPS sağlayıcıları (Türkiye / Avrupa):**
- Hetzner Cloud (Frankfurt, ~5 € / ay, 2 vCPU 4 GB RAM)
- DigitalOcean ($6 / ay, 1 vCPU 1 GB)
- Vultr (1 vCPU 1 GB, $6 / ay)
- Türkiye lokasyonu için: Turhost, Natro, Hostinger (Türk veri merkezleri)

---

## Kurulum Adımları

### 1. Sunucuya SSH ile bağlanın

```bash
ssh root@SUNUCU_IP
```

### 2. Sistemi güncelleyin

```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential ufw
```

### 3. Non-root kullanıcı oluşturun (güvenlik için)

```bash
adduser diyetadmin
usermod -aG sudo diyetadmin

# SSH anahtarı kopyala (yoksa şifreyle giriş)
rsync --archive --chown=diyetadmin:diyetadmin ~/.ssh /home/diyetadmin
```

Çıkış yapıp yeniden bağlanın:
```bash
exit
ssh diyetadmin@SUNUCU_IP
```

Bundan sonra tüm komutlar `diyetadmin` kullanıcısıyla çalıştırılacak. Root yetkisi gerekirse `sudo` öneki kullanılır.

### 4. Node.js 20 LTS kurulumu (NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Doğrulama
node --version    # v20.x.x olmalı
npm --version
```

### 5. PM2 (Process Manager) kurulumu

```bash
sudo npm install -g pm2
pm2 --version
```

### 6. Nginx (Reverse Proxy) kurulumu

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
sudo systemctl status nginx
```

Tarayıcıda `http://SUNUCU_IP` ziyaret edip Nginx welcome sayfasını görmelisiniz.

### 7. Firewall (UFW) yapılandırması

```bash
sudo ufw allow OpenSSH        # 22 portu
sudo ufw allow 'Nginx Full'   # 80 ve 443
sudo ufw enable
sudo ufw status
```

### 8. Projeyi sunucuya kopyalayın

**Seçenek A — Git ile (önerilen)**:
```bash
sudo mkdir -p /var/www
sudo chown diyetadmin:diyetadmin /var/www
cd /var/www
git clone https://github.com/KULLANICIADI/diyet-klinik.git
cd diyet-klinik
```

**Seçenek B — rsync ile (lokal makineden)**:
```bash
# Yerel makinenizde:
rsync -avz --exclude node_modules --exclude .next --exclude .git \
  ~/Desktop/diyet-klinik/ \
  diyetadmin@SUNUCU_IP:/var/www/diyet-klinik/
```

**Seçenek C — SCP ile (tek seferlik)**:
```bash
# Yerel:
tar czf diyet-klinik.tar.gz --exclude node_modules --exclude .next ~/Desktop/diyet-klinik
scp diyet-klinik.tar.gz diyetadmin@SUNUCU_IP:/tmp/

# Sunucuda:
cd /var/www
tar xzf /tmp/diyet-klinik.tar.gz
```

### 9. Bağımlılıkları kurun

```bash
cd /var/www/diyet-klinik
npm install
```

### 10. `.env` dosyasını oluşturun

```bash
cp .env.example .env
nano .env
```

**Mutlaka değiştirin:**

```env
DATABASE_URL="file:/var/www/diyet-klinik/prisma/dev.db"
NEXTAUTH_SECRET="..."         # openssl rand -base64 32 ile üretin
NEXTAUTH_URL="https://selinakar.com.tr"
ADMIN_EMAIL="siz@email.com"
ADMIN_PASSWORD="güçlü-uzun-şifre"
```

NEXTAUTH_SECRET üretmek için:
```bash
openssl rand -base64 32
```

### 11. Veritabanını başlatın

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

Seed çıktısında admin giriş bilgileriniz görünür. Bunu kaydedin.

### 12. Production build

```bash
NODE_ENV=production npm run build
```

Bu adım 1-3 dakika sürebilir. Sonunda `.next/` klasörü oluşur.

### 13. PM2 ile başlatın

```bash
mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 logs diyet-klinik          # logları izle
```

Sistem yeniden başlatıldığında PM2'nin otomatik açılması için:
```bash
pm2 startup systemd -u diyetadmin --hp /home/diyetadmin
# Çıktıdaki sudo komutunu çalıştırın
pm2 save
```

Doğrulama: `curl http://127.0.0.1:3000` çıktısında HTML görmelisiniz.

### 14. Nginx yapılandırması

```bash
sudo cp /var/www/diyet-klinik/deploy/nginx.conf.example /etc/nginx/sites-available/diyet-klinik
sudo nano /etc/nginx/sites-available/diyet-klinik
# selinakar.com.tr yerine kendi domain'inizi yazın (3 yerde)

sudo ln -s /etc/nginx/sites-available/diyet-klinik /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default      # varsayılan welcome sayfasını kaldır
sudo nginx -t                                 # syntax kontrol
sudo systemctl reload nginx
```

### 15. DNS Ayarları

Domain sağlayıcınızda (GoDaddy, Namecheap, vs.):

| Tip   | Host  | Değer        | TTL |
|-------|-------|--------------|-----|
| A     | @     | SUNUCU_IP    | 600 |
| A     | www   | SUNUCU_IP    | 600 |

DNS yayılması 5 dk - 24 saat arası sürebilir. Test:
```bash
dig +short selinakar.com.tr
# SUNUCU_IP dönmeli
```

### 16. SSL Sertifikası (Let's Encrypt — ÜCRETSİZ)

DNS yayıldıktan sonra:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d selinakar.com.tr -d www.selinakar.com.tr
```

Sorulara cevaplar:
- E-posta: kendi adresinizi girin
- Şartları kabul edin (A)
- HTTPS yönlendirmesi: 2 (Redirect — önerilen)

Certbot otomatik olarak Nginx config'ini düzenler. Sertifika 90 günde bir otomatik yenilenir (cron ile).

Yenileme testi:
```bash
sudo certbot renew --dry-run
```

### 17. Doğrulama

Tarayıcıda `https://selinakar.com.tr` ziyaret edin:
- Yeşil kilit (geçerli SSL)
- Landing page açılır
- `/login` çalışır

---

## Mesajlaşma Yapılandırması (WhatsApp + SMS)

`.env`'e elle yazmaya **gerek yok** — admin panelden gireceksiniz:

1. `https://selinakar.com.tr/login` → giriş yap
2. **Ayarlar** → **Mesajlaşma** tabı
3. WhatsApp seç → Phone Number ID + Access Token gir
4. Yedek olarak Netgsm/Mutlucell ekle (opsiyonel)
5. Kaydet → kendi telefonunuza test mesajı gönder

Token'lar AES-256-GCM ile şifrelenmiş halde SQLite'a yazılır.

### WhatsApp Cloud API Kurulumu

1. [business.facebook.com](https://business.facebook.com) → Business Account oluştur
2. [developers.facebook.com](https://developers.facebook.com) → App oluştur → WhatsApp ürünü ekle
3. **Phone Number ID** ve **Access Token** kopyala
4. **Message Templates** → onaylat (Türkçe template'ler):

**`appointment_approved`** template metni:
```
Sayın {{patient_name}}, beslenme danışmanlığı randevunuz Diyet Klinik tarafından onaylanmıştır. Randevu tarihi: {{appointment_date}}. İptal veya değişiklik için kliniğimizi {{clinic_phone}} numarasından arayabilirsiniz. Sağlıklı günler dileriz.
```

**`appointment_rejected`** template metni:
```
Sayın {{patient_name}}, beslenme danışmanlığı randevu talebiniz şu anda karşılanamamaktadır. Detaylar: {{details}}. Yeniden randevu için kliniğimizi {{clinic_phone}} numarasından arayabilirsiniz. Anlayışınız için teşekkür ederiz.
```

Onay genelde 24 saat sürer.

---

## Güncelleme

Yeni sürüm geldiğinde:

```bash
ssh diyetadmin@SUNUCU_IP
cd /var/www/diyet-klinik
chmod +x deploy/update.sh    # ilk seferde
./deploy/update.sh
```

Script otomatik şunları yapar:
1. Pre-update yedek alır
2. `git pull` (varsa)
3. `npm install`
4. Prisma migrate
5. Production build
6. PM2 reload (kesintisiz)

---

## Yedekleme

### Otomatik (proje içinde)
- Her gün gece yarısı SQLite dosyası kopyalanır → `prisma/backups/`
- Son 30 gün saklanır
- Admin panel → **Güvenlik & 2FA** → "Veri Yedekleme" panelinden manuel yedek + geri yükleme

### Harici Yedek (önerilen)

VPS çökerse local yedek de gider. Aşağıdakilerden birini yapın:

**A) rsync ile başka sunucuya** (crontab):
```bash
crontab -e
# Her gün 02:30'da yedekleri uzak sunucuya gönder
30 2 * * * rsync -az /var/www/diyet-klinik/prisma/backups/ kullanici@backup-server:/yedekler/diyet-klinik/
```

**B) AWS S3 / Backblaze B2 / Wasabi** (s3cmd ile):
```bash
sudo apt install s3cmd
s3cmd --configure
crontab -e
30 2 * * * s3cmd sync /var/www/diyet-klinik/prisma/backups/ s3://kova-adi/diyet-klinik/
```

**C) Google Drive / Dropbox** (rclone ile):
```bash
sudo apt install rclone
rclone config
crontab -e
30 2 * * * rclone sync /var/www/diyet-klinik/prisma/backups/ gdrive:diyet-klinik-yedek/
```

---

## Güvenlik Kontrol Listesi

- [x] **Firewall**: UFW açık, sadece 22, 80, 443 portları açık
- [x] **SSL**: Let's Encrypt sertifikası kurulu
- [x] **HTTPS yönlendirmesi**: HTTP otomatik HTTPS'e atılıyor
- [x] **NEXTAUTH_SECRET**: Güçlü ve rastgele (üretimde değiştirildi)
- [x] **Admin şifresi**: 12+ karakter, karmaşık
- [x] **2FA aktif**: Admin paneli → Güvenlik & 2FA → TOTP etkin
- [ ] **fail2ban**: SSH brute-force koruması (opsiyonel ama önerilen)
- [ ] **Otomatik güvenlik güncellemeleri**: `unattended-upgrades`
- [ ] **Düzenli yedek doğrulama**: Ayda bir yedeği test geri yükleyin

### fail2ban kurulumu (opsiyonel)
```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
```

### Otomatik güvenlik güncellemeleri
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## İzleme & Loglar

```bash
# PM2 logs (uygulama)
pm2 logs diyet-klinik
pm2 logs diyet-klinik --lines 200

# Nginx logs
sudo tail -f /var/log/nginx/diyet-klinik-access.log
sudo tail -f /var/log/nginx/diyet-klinik-error.log

# Sistem servis durumu
pm2 status
sudo systemctl status nginx

# Disk kullanımı
df -h
du -sh /var/www/diyet-klinik/

# Bellek
free -h
pm2 monit                  # CPU/RAM canlı izleme
```

---

## Sorun Giderme

### "502 Bad Gateway"
Next.js çalışmıyor demek:
```bash
pm2 status                              # online mı?
pm2 logs diyet-klinik --lines 50        # hata var mı?
curl -I http://127.0.0.1:3000           # doğrudan ulaşılabiliyor mu?
```

### Auth.js "UntrustedHost" hatası
`.env`'de şunlar olmalı:
```env
NEXTAUTH_URL="https://selinakar.com.tr"
AUTH_TRUST_HOST=true
```
Sonra `pm2 reload diyet-klinik --update-env`.

### SSL sertifika yenilenmiyor
```bash
sudo certbot renew --dry-run
sudo systemctl status snap.certbot.renew.timer
```

### DB locked / SQLite hatası
SQLite tek instance'ta çalışır. `ecosystem.config.cjs`'de `instances: 1` ve `exec_mode: "fork"` olmalı (cluster mode'a almayın).

### Disk doldu (yedekler şişti)
```bash
ls -lh /var/www/diyet-klinik/prisma/backups/
find /var/www/diyet-klinik/prisma/backups/ -name "backup-*" -mtime +60 -delete
```

---

## Komut Hızlı Referansı

```bash
# Uygulama
pm2 status
pm2 logs diyet-klinik
pm2 reload diyet-klinik             # zero-downtime restart
pm2 restart diyet-klinik            # full restart
pm2 stop diyet-klinik

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx

# Güncelleme
cd /var/www/diyet-klinik
./deploy/update.sh

# Yedekleme (manuel)
cp prisma/dev.db prisma/backups/manual-$(date +%Y%m%d).db

# Veritabanı şeması değiştiyse
npx prisma generate
npx prisma db push
```

---

## Proje Yapısı

```
diyet-klinik/
├─ app/                       # Next.js app router
│  ├─ admin/                  # /admin/* — korumalı yönetim paneli
│  ├─ api/                    # API rotaları
│  ├─ login/                  # /login — giriş
│  └─ page.tsx                # Landing page
├─ components/                # React bileşenleri
│  ├─ admin/                  # Admin paneli UI
│  ├─ landing/                # Landing page sections
│  └─ ui/                     # shadcn-style primitive'ler
├─ lib/                       # Kütüphaneler
│  ├─ db.ts                   # Prisma singleton
│  ├─ sms/                    # Mesajlaşma (WhatsApp, SMS)
│  ├─ messaging-config.ts     # DB-tabanlı config + şifreleme
│  ├─ crypto.ts               # AES-256-GCM
│  ├─ totp.ts                 # 2FA
│  ├─ backup.ts               # Yedekleme
│  ├─ scheduler.ts            # Saatlik backup checker
│  ├─ availability.ts         # Müsait saat hesaplama
│  └─ patients.ts             # Hasta dosyaları
├─ prisma/
│  ├─ schema.prisma           # DB şeması
│  ├─ dev.db                  # SQLite (gitignored)
│  ├─ backups/                # Otomatik yedekler (gitignored)
│  └─ seed.ts                 # Demo veri + admin user
├─ deploy/
│  ├─ nginx.conf.example      # Nginx konfigürasyonu
│  ├─ systemd.service.example # PM2 alternatifi
│  └─ update.sh               # Güncelleme script'i
├─ auth.ts                    # NextAuth v5 (server-side)
├─ auth.config.ts             # Edge-uyumlu auth config
├─ middleware.ts              # /admin korumalı
├─ instrumentation.ts         # Backup scheduler başlatıcı
├─ ecosystem.config.cjs       # PM2 process tanımı
└─ next.config.mjs            # Next.js config
```

---

## Maliyet Tahmini

| Bileşen           | Aylık Maliyet     | Not                                           |
|-------------------|-------------------|-----------------------------------------------|
| VPS (Hetzner CX22)| ~5 €              | 2 vCPU, 4 GB RAM                              |
| Domain (.com.tr)  | ~1 € (yıllık 12 €) | Türkiye için (.com daha ucuz: ~$10/yıl)       |
| SSL (Let's Encrypt)| **0**             | Ücretsiz                                      |
| WhatsApp Cloud API| **0**             | İlk 1000 mesaj/ay ücretsiz, sonrası 0.40 TL   |
| SMS yedek         | Kullanıma göre    | ~1.50 TL/mesaj (Netgsm)                       |
| **Toplam**        | **~6 €/ay**       | Yıllık ~72 € (~2500 TL)                       |

Küçük bir klinik için aylık 1000 mesajın altında kalmak çok mümkün → mesajlaşma 0 TL.

---

## Özellikler Özeti

- ✅ **Onay-öncelikli randevu**: Hasta talebi → admin onayı → otomatik WhatsApp/SMS
- ✅ **NextAuth v5 + TOTP 2FA**: Yedek kodlar dahil
- ✅ **Akıllı tarih/saat picker**: Dolu saatler otomatik kapalı
- ✅ **WhatsApp Cloud API**: SMS'in 1/4 fiyatına
- ✅ **Hasta dosyaları**: Hukuki kayıt — KVKK onay zamanı, mesaj geçmişi
- ✅ **Otomatik yedekleme**: Günlük, geri yükleme UI dahil
- ✅ **Admin yönetimi**: Hizmetler, çalışma saatleri, yorumlar, mesajlaşma config — hepsi UI'dan
- ✅ **KVKK uyumlu**: Onay metni, zorunlu onay kutusu, audit trail

---

## Destek

Sorunla karşılaşırsanız:
1. `pm2 logs` ile hata mesajını alın
2. `sudo nginx -t` ile config syntax kontrolü
3. README "Sorun Giderme" bölümünü inceleyin

Kod içindeki yorumlar Türkçe'dir; mimari, schema ve akışlar açıklanmıştır.
