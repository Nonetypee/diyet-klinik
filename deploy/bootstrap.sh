#!/usr/bin/env bash
###############################################################
# Diyet Klinik — VPS Sıfırdan Kurulum Bootstrap
#
# Bu script TAZE bir Ubuntu 22.04 / 24.04 sunucuda projeyi
# tek seferde ayağa kaldırmak için tasarlandı.
#
# ÖN KOŞULLAR (script'ten önce):
#   1. Sunucuya `root` olarak SSH ile bağlandınız
#   2. Yeni bir non-root kullanıcı oluşturmak istiyorsunuz
#
# Kullanım:
#   sudo bash deploy/bootstrap.sh
#
# Script şunları yapar:
#   - Sistem güncellemesi
#   - Node.js 20 LTS kurulumu
#   - PM2, Nginx, Certbot kurulumu
#   - UFW firewall
#   - fail2ban (SSH koruması)
#   - unattended-upgrades (otomatik güvenlik yamaları)
#
# UYGULAMA KURULUMU script SONRASINDA manuel yapılır.
# README'deki "Kurulum Adımları"nın 8. adımından devam edin.
###############################################################

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "✗ Bu script root yetkisi ister. sudo ile çalıştırın."
  exit 1
fi

echo "▸ Sistemi güncelliyorum..."
apt update
apt upgrade -y

echo "▸ Temel paketleri kuruyorum..."
apt install -y curl wget git build-essential ufw nano

echo "▸ Node.js 20 LTS kuruluyor (NodeSource)..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "   Node: $(node --version)  npm: $(npm --version)"

echo "▸ PM2 yükleniyor..."
npm install -g pm2

echo "▸ Nginx yükleniyor..."
apt install -y nginx
systemctl enable --now nginx

echo "▸ Certbot (Let's Encrypt SSL) yükleniyor..."
apt install -y certbot python3-certbot-nginx

echo "▸ fail2ban (SSH brute-force koruması) yükleniyor..."
apt install -y fail2ban
systemctl enable --now fail2ban

echo "▸ unattended-upgrades (otomatik güvenlik yamaları)..."
apt install -y unattended-upgrades
echo 'APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";' > /etc/apt/apt.conf.d/20auto-upgrades

echo "▸ UFW firewall kuralları..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status verbose

echo ""
echo "================================================================"
echo "✓ Sistem hazır. Uygulama kurulumu için README'nin 8. adımından"
echo "  devam edin."
echo ""
echo "Sıradaki adımlar:"
echo "  1. Non-root kullanıcı oluştur:    adduser diyetadmin && usermod -aG sudo diyetadmin"
echo "  2. SSH anahtarını kopyala:        rsync --archive --chown=diyetadmin:diyetadmin ~/.ssh /home/diyetadmin"
echo "  3. su - diyetadmin"
echo "  4. cd /var/www && git clone YOUR_REPO_URL diyet-klinik"
echo "  5. cd diyet-klinik && npm install"
echo "  6. cp .env.example .env && nano .env  (NEXTAUTH_SECRET üret!)"
echo "  7. npx prisma db push && npm run db:seed"
echo "  8. NODE_ENV=production npm run build"
echo "  9. pm2 start ecosystem.config.cjs && pm2 save"
echo " 10. sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/diyet-klinik"
echo "     # Domain'i düzenle, sites-enabled'a link, nginx reload"
echo " 11. sudo certbot --nginx -d DOMAIN.com -d www.DOMAIN.com"
echo "================================================================"
