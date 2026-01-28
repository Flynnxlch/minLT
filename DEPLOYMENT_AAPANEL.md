# Panduan Deploy MinLT ke aaPanel - Lengkap dari Build sampai Online

## 📋 Daftar Isi
1. [Prerequisites](#prerequisites)
2. [Persiapan Server](#persiapan-server)
3. [Upload Project ke Server](#upload-project-ke-server)
4. [Setup Database](#setup-database)
5. [Build Frontend](#build-frontend)
6. [Setup Backend](#setup-backend)
7. [Konfigurasi Environment Variables](#konfigurasi-environment-variables)
8. [Setup Nginx di aaPanel](#setup-nginx-di-aapanel)
9. [Setup PM2 untuk Process Management](#setup-pm2-untuk-process-management)
10. [Setup SSL/HTTPS](#setup-sslhttps)
11. [Testing & Troubleshooting](#testing--troubleshooting)

---

## Prerequisites

### Software yang Diperlukan:
- ✅ **aaPanel** sudah terinstall di server
- ✅ **Node.js** (v18 atau lebih tinggi) atau **Bun** runtime
- ✅ **PostgreSQL** (jika menggunakan database lokal, atau tetap gunakan Supabase)
- ✅ **Nginx** (biasanya sudah terinstall dengan aaPanel)
- ✅ **PM2** (untuk process management)
- ✅ **Git** (untuk clone repository)

---

## Persiapan Server

### 1. Install Node.js/Bun melalui aaPanel

**Via aaPanel UI:**
1. Login ke aaPanel
2. Buka **App Store** → **Runtime Environment**
3. Install **Node.js Version Manager** atau **Bun**
4. Install Node.js versi terbaru (minimal v18)

**Via SSH Terminal:**
```bash
# Install Node.js menggunakan nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Atau install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 2. Install PM2
```bash
npm install -g pm2
# atau jika menggunakan Bun
bun install -g pm2
```

### 3. Install PostgreSQL (Opsional - jika tidak menggunakan Supabase)
```bash
# Via aaPanel: App Store → Database → PostgreSQL
# Atau via terminal:
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

### 4. Verifikasi Instalasi
```bash
node --version    # Harus v18+
npm --version
pm2 --version
# atau
bun --version
```

---

## Upload Project ke Server

### Opsi 1: Upload via aaPanel File Manager
1. Login ke aaPanel
2. Buka **File** → Navigate ke `/www/wwwroot/`
3. Buat folder baru: `minlt`
4. Upload semua file project ke folder tersebut
5. Extract jika file dalam format zip

### Opsi 2: Clone via Git (Recommended)
```bash
cd /www/wwwroot
git clone <your-repository-url> minlt
cd minlt
```

### Opsi 3: Upload via SCP/SFTP
```bash
# Dari komputer lokal (Windows PowerShell)
scp -r "C:\Users\gibran\OneDrive\Documents\Kerja keknya\mnLte\minLT\*" root@your-server-ip:/www/wwwroot/minlt/
```

**Struktur folder yang diharapkan:**
```
/www/wwwroot/minlt/
├── Backend/
├── src/
├── public/
├── package.json
├── vite.config.js
└── ... (file lainnya)
```

---

## Setup Database [Kalau Perlu]

### Jika Menggunakan Supabase (Recommended - Sudah Ada)

**Agar backend di server tersambung ke Supabase**, lakukan di server:

1. **File `.env` di Backend**  
   Di `/www/wwwroot/minLT/Backend/` (atau path project Anda) buat/edit `.env` dengan:
   - **`DATABASE_URL`** = connection string dari Supabase (Dashboard → Project Settings → Database → Connection string, pilih “URI” atau “Transaction”/pooler).
   - Contoh:  
     `DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true"`  
     atau format “direct” yang diberikan Supabase.
   - Jika fitur Regulation Updates memakai Supabase Storage, tambahkan **`SUPABASE_URL`** dan **`SUPABASE_SERVICE_ROLE_KEY`** (dari Project Settings → API).

2. **Migrasi schema**  
   ```bash
   cd /www/wwwroot/minLT/Backend
   npx prisma migrate deploy
   # atau: bunx prisma migrate deploy
   ```

3. **Jalankan backend**  
   Backend yang connect ke DB adalah proses Node/Bun, bukan Nginx. Pastikan jalan lewat PM2:
   ```bash
   cd /www/wwwroot/minLT/Backend
   pm2 start ecosystem.config.js
   pm2 save
   ```
   Nginx tidak “connect” ke Supabase; koneksi dilakukan dari backend ke internet (Supabase). Pastikan firewall/security group server mengizinkan koneksi keluar ke `*.supabase.com` pada port 5432 (dan 443 jika pakai REST/Storage).

Lanjut ke bagian berikutnya untuk build frontend dan konfigurasi Nginx.

### Jika Menggunakan PostgreSQL Lokal
```bash
# Login ke PostgreSQL
sudo -u postgres psql

# Buat database dan user
CREATE DATABASE minlt;
CREATE USER minlt_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE minlt TO minlt_user;
\q
```

---

## Build Frontend

### 1. Masuk ke Direktori Project
```bash
cd /www/wwwroot/minlt
```

### 2. Install Dependencies Frontend
```bash
npm install
# atau jika menggunakan Bun
bun install
```

### 3. Build Frontend untuk Production
```bash
npm run build
# atau
bun run build
```

**Output build akan berada di:** `/www/wwwroot/minlt/dist/`

### 4. Verifikasi Build
```bash
ls -la dist/
# Harus ada file index.html dan folder assets/
```

---

## Setup Backend

### 1. Masuk ke Direktori Backend
```bash
cd /www/wwwroot/minlt/Backend
```

### 2. Install Dependencies Backend
```bash
npm install
# atau
bun install
```

### 3. Generate Prisma Client
```bash
npx prisma generate
# atau
bunx prisma generate
```

### 4. Run Database Migrations
```bash
# Jika menggunakan Supabase (sudah ada database)
npx prisma migrate deploy
# atau
bunx prisma migrate deploy

# Jika menggunakan database lokal baru
npx prisma migrate dev
```

### 5. Seed Database (Opsional)
```bash
npm run prisma:seed
# atau
bun run prisma:seed
```

---

## Konfigurasi Environment Variables

### 1. Buat File .env di Backend
```bash
cd /www/wwwroot/minlt/Backend
nano .env
```

### 2. Isi File .env dengan Konfigurasi Production
```env
# Database URL (Supabase atau PostgreSQL lokal)
DATABASE_URL="postgresql://postgres.isbwwnylvtqajzwaxjjg:abdhewhjsgmmokullopjshh@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?schema=public"

# JWT Secret (GANTI dengan secret yang lebih kuat!)
JWT_SECRET="hWDSiGU8Y0/Y5FWI+tacF/EcuC+5NT/DWH01xk4QmtWoPCu1iJOJDhNid/6jRwDA"
JWT_EXPIRES_IN="5d"

# Server Port (Backend akan berjalan di port ini)
PORT=3001

# Environment
NODE_ENV=production

# CORS Origin (GANTI dengan domain Anda!)
CORS_ORIGIN="https://yourdomain.com,https://www.yourdomain.com"

# Supabase Configuration
SUPABASE_URL=https://isbwwnylvtqajzwaxjjg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzYnd3bnlsdnRxYWp6d2F4ampnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk4MDM5MiwiZXhwIjoyMDg0NTU2MzkyfQ.lgRMtbo0AYfE_LCVeOO53BsgX4MUx_qPQMzjK2zvVsE
SUPABASE_STORAGE_BUCKET=regulation-updates
```

**⚠️ PENTING:**
- Ganti `CORS_ORIGIN` dengan domain production Anda
- Ganti `JWT_SECRET` dengan secret yang lebih kuat dan unik
- Jangan commit file `.env` ke Git!

### 3. Set Permissions
```bash
chmod 600 .env  # Hanya owner yang bisa read/write
```

---

## Setup Nginx di aaPanel

### Konfigurasi untuk risk.appsdev.my.id

Untuk situs **risk.appsdev.my.id** sudah disiapkan contoh konfigurasi di repo: **`nginx.risk.appsdev.conf`**.

Isi file itu sudah mencakup:
- **Proxy `/api` ke backend (port 3001)** — agar login tidak error "Unexpected token '<'"
- **SPA fallback** — `try_files $uri $uri/ /index.html` sehingga refresh atau back/next di `/dashboard`, `/risks`, dll. tidak 404
- **Root** — `/www/wwwroot/minLT/dist` (sesuaikan huruf besar/kecil dengan path di server Anda)

**Cara pakai:**  
Di aaPanel → **Website** → **risk.appsdev.my.id** → **Settings** → **Configuration** → ganti isi blok `server { ... }` dengan isi dari `nginx.risk.appsdev.conf`, lalu simpan dan reload Nginx.

Pastikan path **root** sama dengan lokasi build (mis. `/www/wwwroot/minLT/dist` atau `/www/wwwroot/minlt/dist`).

---

### Opsi 1: Via aaPanel UI (Recommended)

1. **Login ke aaPanel**
2. **Website** → **Add Site**
3. **Domain:** Masukkan domain Anda (contoh: `minlt.yourdomain.com`)
4. **Document Root:** `/www/wwwroot/minlt/dist`
5. **PHP Version:** Pilih "Static" atau "None"
6. Klik **Submit**

### 2. Edit Nginx Configuration

1. **Website** → Klik **Settings** pada website yang baru dibuat
2. **Configuration** → **Edit Configuration**
3. Ganti seluruh isi dengan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # GANTI dengan domain Anda
    
    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
    
    # Client body size limit (for file uploads)
    client_max_body_size 10M;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Root directory for static files
    root /www/wwwroot/minlt/dist;
    index index.html;
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy to backend
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        
        # Headers for proper proxying
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # Don't pass Accept-Encoding to backend
        proxy_set_header Accept-Encoding "";
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        access_log off;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Deny access to backup files
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

4. **Save** konfigurasi
5. **Reload** Nginx

### Opsi 2: Via SSH Terminal

```bash
# Edit file konfigurasi Nginx
sudo nano /www/server/panel/vhost/nginx/yourdomain.com.conf

# Paste konfigurasi di atas, lalu:
sudo nginx -t  # Test konfigurasi
sudo systemctl reload nginx  # Reload Nginx
```

---

## Setup PM2 untuk Process Management

### 1. Buat File PM2 Ecosystem

```bash
cd /www/wwwroot/minlt/Backend
nano ecosystem.config.js
```

### 2. Isi File ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'minlt-backend',
    script: 'src/server.js',
    cwd: '/www/wwwroot/minlt/Backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/www/wwwroot/minlt/logs/pm2-error.log',
    out_file: '/www/wwwroot/minlt/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
};
```

### 3. Buat Folder Logs
```bash
mkdir -p /www/wwwroot/minlt/logs
```

### 4. Start Backend dengan PM2

**Jika menggunakan Node.js:**
```bash
cd /www/wwwroot/minlt/Backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Setup PM2 untuk auto-start saat server reboot
```

**Jika menggunakan Bun:**
```bash
cd /www/wwwroot/minlt/Backend
# Edit ecosystem.config.js, ubah script menjadi:
# script: 'bun',
# args: 'src/server.js'

pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Verifikasi PM2 Status
```bash
pm2 status
pm2 logs minlt-backend
```

**Command PM2 yang Berguna:**
```bash
pm2 restart minlt-backend    # Restart aplikasi
pm2 stop minlt-backend       # Stop aplikasi
pm2 delete minlt-backend     # Hapus dari PM2
pm2 monit                    # Monitor real-time
```

---

## Setup SSL/HTTPS

### Via aaPanel (Recommended)

1. **Website** → Klik **Settings** pada website Anda
2. **SSL** → Pilih salah satu:
   - **Let's Encrypt** (Gratis, otomatis renew)
   - **Cloudflare** (Jika menggunakan Cloudflare)
   - **Custom SSL** (Jika punya sertifikat sendiri)

3. **Let's Encrypt:**
   - Pilih domain
   - Email: masukkan email Anda
   - Klik **Apply**
   - Tunggu hingga selesai

4. **Force HTTPS:**
   - Setelah SSL aktif, enable **Force HTTPS**
   - Nginx akan otomatis redirect HTTP ke HTTPS

### Update Nginx Configuration untuk HTTPS

Setelah SSL aktif, konfigurasi Nginx akan otomatis diupdate oleh aaPanel. Pastikan konfigurasi `/api` proxy tetap ada.

### Verifikasi SSL
```bash
# Test SSL
curl -I https://yourdomain.com

# Atau buka browser dan cek certificate
```

---

## Testing & Troubleshooting

### 1. Test Backend API
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test dari luar (harus via domain)
curl https://yourdomain.com/api/health
```

### 2. Test Frontend
- Buka browser: `https://yourdomain.com`
- Harus bisa load halaman login
- Cek Console browser (F12) untuk error

### 3. Test Database Connection
```bash
cd /www/wwwroot/minlt/Backend
npx prisma studio
# Buka http://localhost:5555 (jika di server lokal)
```

### 4. Check Logs

**PM2 Logs:**
```bash
pm2 logs minlt-backend --lines 100
```

**Nginx Error Logs:**
```bash
tail -f /www/wwwlogs/yourdomain.com.error.log
```

**Nginx Access Logs:**
```bash
tail -f /www/wwwlogs/yourdomain.com.log
```

### 5. Common Issues & Solutions

#### Issue: Backend tidak bisa start
```bash
# Check port sudah digunakan
netstat -tulpn | grep 3001

# Check PM2 status
pm2 status

# Check logs
pm2 logs minlt-backend
```

#### Issue: 502 Bad Gateway
- Backend tidak running → `pm2 restart minlt-backend`
- Port salah di Nginx → Check `proxy_pass http://127.0.0.1:3001`
- Firewall block port → Check firewall settings

#### Issue: CORS Error
- Update `CORS_ORIGIN` di `.env` dengan domain production
- Restart backend: `pm2 restart minlt-backend`

#### Issue: Database Connection Error
- Check `DATABASE_URL` di `.env`
- Test connection: `npx prisma studio`
- Check Supabase dashboard jika menggunakan Supabase

#### Issue: Frontend tidak load
- Check build output: `ls -la /www/wwwroot/minlt/dist/`
- Check Nginx root path di konfigurasi
- Check file permissions: `chmod -R 755 /www/wwwroot/minlt/dist`

#### Issue: Static files 404
- Check Nginx location block untuk static files
- Check file permissions
- Rebuild frontend: `npm run build`

#### Issue: Login error "Unexpected token '<', \"<!doctype \"... is not valid JSON"
Ini terjadi ketika **request ke `/api/auth/login` tidak sampai ke backend** dan Nginx malah mengembalikan **index.html** (halaman SPA). Frontend mengharapkan JSON, lalu gagal saat parse.

**Penyebab:** Konfigurasi Nginx untuk situs ini **tidak punya (atau tidak aktif) block `location /api`** yang mem-proxy ke backend.

**Langkah perbaikan:**

1. **Pastikan backend jalan:**
   ```bash
   pm2 status
   curl -s http://127.0.0.1:3001/health
   ```
   Jika backend mati: `pm2 start ecosystem.config.js` dari folder Backend.

2. **Pastikan Nginx punya proxy `/api`:**
   - Buka **Website** → pilih situs → **Settings** → **Configuration** (Edit).
   - Harus ada block ini **di dalam** `server { ... }` (biasanya **sebelum** `location /`):
   ```nginx
   location /api {
       proxy_pass http://127.0.0.1:3001;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
   - Jika tidak ada, tambahkan, simpan, lalu **Nginx** → **Service** → **Reload**.

3. **Urutan `location` penting:**  
   `location /api` harus ada sebagai block terpisah. Jangan sampai path `/api/...` terjatuh ke `location /` yang pakai `try_files ... /index.html`, karena itu yang membuat Nginx mengembalikan index.html.

4. **Cek dari server:**  
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/auth/login
   curl -s -I https://yourdomain.com/api/auth/login
   ```
   Request ke domain harus di-proxy ke backend (bukan 200 dengan body HTML).

Setelah `location /api` benar dan backend jalan, login seharusnya kembali normal.

### 6. Performance Optimization

**Enable Nginx Cache:**
Tambahkan di Nginx config (di dalam `location /api`):
```nginx
proxy_cache_path /var/cache/nginx/api levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m use_temp_path=off;

location /api {
    proxy_cache api_cache;
    proxy_cache_valid 200 60m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    # ... konfigurasi lainnya
}
```

**PM2 Cluster Mode (untuk multi-core):**
Edit `ecosystem.config.js`:
```javascript
instances: 'max',  // atau angka spesifik seperti 2, 4
exec_mode: 'cluster',
```

---

## Checklist Final

Sebelum go-live, pastikan:

- [ ] ✅ Frontend sudah di-build (`npm run build`)
- [ ] ✅ Backend dependencies terinstall
- [ ] ✅ Prisma client sudah di-generate
- [ ] ✅ Database migrations sudah di-run
- [ ] ✅ File `.env` sudah dikonfigurasi dengan benar
- [ ] ✅ `CORS_ORIGIN` sudah diupdate ke domain production
- [ ] ✅ Backend running dengan PM2 (`pm2 status`)
- [ ] ✅ Nginx konfigurasi sudah benar
- [ ] ✅ SSL/HTTPS sudah aktif
- [ ] ✅ Domain DNS sudah pointing ke server IP
- [ ] ✅ Firewall port 80 dan 443 sudah dibuka
- [ ] ✅ Test login dan fitur utama berfungsi
- [ ] ✅ Logs tidak ada error yang critical

---

## Maintenance

### Update Aplikasi

```bash
# 1. Backup database (jika perlu)
# 2. Pull update dari Git
cd /www/wwwroot/minlt
git pull

# 3. Update dependencies
npm install
cd Backend && npm install

# 4. Rebuild frontend
npm run build

# 5. Run migrations (jika ada)
cd Backend
npx prisma migrate deploy

# 6. Restart backend
pm2 restart minlt-backend

# 7. Reload Nginx
sudo systemctl reload nginx
```

### Backup

```bash
# Backup database (Supabase sudah auto-backup)
# Backup files
tar -czf minlt-backup-$(date +%Y%m%d).tar.gz /www/wwwroot/minlt

# Backup via aaPanel: File → Backup
```

---

## Support & Resources

- **aaPanel Documentation:** https://doc.aapanel.com/
- **PM2 Documentation:** https://pm2.keymetrics.io/docs/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **Prisma Documentation:** https://www.prisma.io/docs/

---

## Catatan Penting

1. **Security:**
   - Jangan commit file `.env` ke Git
   - Gunakan JWT secret yang kuat dan unik
   - Update dependencies secara berkala
   - Enable firewall di aaPanel

2. **Performance:**
   - Monitor PM2 dengan `pm2 monit`
   - Setup log rotation untuk PM2
   - Monitor disk space secara berkala

3. **Backup:**
   - Backup database secara berkala
   - Backup file project sebelum update besar
   - Simpan backup di lokasi terpisah

---

**Selamat! Website Anda seharusnya sudah bisa diakses di `https://yourdomain.com` 🎉**

Jika ada masalah, check logs dan ikuti troubleshooting guide di atas.
