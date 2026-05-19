#!/usr/bin/env bash
###############################################################
# Diyet Klinik — Production Update Script
#
# Kullanım (sunucuda):
#   cd /var/www/diyet-klinik
#   ./deploy/update.sh
#
# Bu script şunları yapar:
#   1. Manuel yedek alır (DB dosyası snapshot)
#   2. Git'ten yeni kodu çeker (varsa)
#   3. npm install
#   4. Prisma generate + db push
#   5. Production build
#   6. PM2 reload (kesintisiz yeniden başlatma)
###############################################################

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/diyet-klinik}"
cd "$PROJECT_DIR"

echo "▸ Çalışma dizini: $PROJECT_DIR"

# 1. Update öncesi yedek
if [ -f "prisma/dev.db" ]; then
  BACKUP_NAME="prisma/backups/pre-update-$(date -u +%Y-%m-%dT%H-%M-%SZ).db"
  mkdir -p prisma/backups
  cp prisma/dev.db "$BACKUP_NAME"
  echo "✓ Yedek alındı: $BACKUP_NAME"
fi

# 2. Git pull (.git varsa)
if [ -d ".git" ]; then
  echo "▸ git pull..."
  git pull --rebase
fi

# 3. Bağımlılıklar
echo "▸ npm install..."
npm install --omit=dev=false

# 4. Prisma
echo "▸ Prisma generate + db push..."
npx prisma generate
npx prisma db push --skip-generate

# 5. Build
echo "▸ Production build..."
NODE_ENV=production npm run build

# 6. PM2 reload (zero-downtime)
if command -v pm2 >/dev/null 2>&1; then
  echo "▸ PM2 reload..."
  pm2 reload ecosystem.config.cjs --update-env
  pm2 save
else
  echo "▸ PM2 bulunamadı. Systemd kullanıyorsanız:"
  echo "    sudo systemctl restart diyet-klinik"
fi

echo "✓ Güncelleme tamamlandı"
