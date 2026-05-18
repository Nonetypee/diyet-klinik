/**
 * PM2 Process Manager Yapılandırması
 *
 * Kullanım:
 *   pm2 start ecosystem.config.cjs
 *   pm2 logs diyet-klinik
 *   pm2 reload diyet-klinik          # kesintisiz yeniden yükleme
 *   pm2 stop diyet-klinik
 *   pm2 save                          # mevcut process listesini kalıcı yap
 *   pm2 startup systemd               # sistem açılışında otomatik başlat
 *
 * Notlar:
 *   - 127.0.0.1'e bind ediyoruz → sadece Nginx üzerinden erişilebilir
 *   - 1 instance yeterli (SQLite multi-process'i desteklemez)
 *   - Bellek 1GB'ı geçerse otomatik restart
 */

module.exports = {
  apps: [
    {
      name: "diyet-klinik",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork", // SQLite için cluster KULLANMA
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      // Log dosyaları
      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      // Çevre değişkenleri .env'den okunur (PM2 otomatik yüklemez,
      // Next.js dotenv ile yükler). Ekstra runtime env burada eklenebilir:
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
