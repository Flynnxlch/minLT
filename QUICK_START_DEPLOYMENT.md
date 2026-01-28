# Quick Start: Deploy MinLT ke aaPanel

Panduan cepat untuk deploy aplikasi MinLT ke server dengan aaPanel.

## 🚀 Langkah Cepat (5 Menit)

### 1. Upload Project
```bash
# Via Git
cd /www/wwwroot
git clone <repo-url> minlt

# Atau upload via aaPanel File Manager ke /www/wwwroot/minlt
```

### 2. Build Frontend
```bash
cd /www/wwwroot/minlt
npm install
npm run build
```

### 3. Setup Backend
```bash
cd /www/wwwroot/minlt/Backend
npm install
npx prisma generate
npx prisma migrate deploy
```

### 4. Konfigurasi Environment
```bash
cd /www/wwwroot/minlt/Backend
nano .env
# Edit: CORS_ORIGIN, JWT_SECRET, NODE_ENV=production
chmod 600 .env
```

### 5. Start dengan PM2
```bash
cd /www/wwwroot/minlt/Backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Setup Nginx di aaPanel
1. **Website** → **Add Site**
2. Domain: `yourdomain.com`
3. Document Root: `/www/wwwroot/minlt/dist`
4. Edit Configuration → Paste config dari `DEPLOYMENT_AAPANEL.md`
5. Save & Reload

### 7. Setup SSL
1. **Website** → **Settings** → **SSL**
2. Pilih **Let's Encrypt**
3. Enable **Force HTTPS**

### 8. Test
- Buka: `https://yourdomain.com`
- Test API: `https://yourdomain.com/api/health`

---

## 📝 File Penting

### `.env` Configuration
```env
DATABASE_URL="your-database-url"
JWT_SECRET="your-strong-secret"
PORT=3001
NODE_ENV=production
CORS_ORIGIN="https://yourdomain.com"
SUPABASE_URL="your-supabase-url"
SUPABASE_SERVICE_ROLE_KEY="your-key"
SUPABASE_STORAGE_BUCKET="regulation-updates"
```

### `ecosystem.config.js` (PM2)
```javascript
module.exports = {
  apps: [{
    name: 'minlt-backend',
    script: 'src/server.js',
    cwd: '/www/wwwroot/minlt/Backend',
    env: { NODE_ENV: 'production', PORT: 3001 }
  }]
};
```

### Nginx Config (Key Parts)
```nginx
root /www/wwwroot/minlt/dist;

location /api {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## 🔧 Command Berguna

```bash
# PM2
pm2 status
pm2 logs minlt-backend
pm2 restart minlt-backend
pm2 monit

# Nginx
nginx -t                    # Test config
systemctl reload nginx      # Reload

# Build & Deploy
cd /www/wwwroot/minlt && npm run build
cd Backend && npm install && npx prisma generate
pm2 restart minlt-backend

# Logs
pm2 logs minlt-backend
tail -f /www/wwwlogs/yourdomain.com.error.log
```

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| 502 Bad Gateway | `pm2 restart minlt-backend` |
| CORS Error | Update `CORS_ORIGIN` di `.env` |
| Frontend 404 | Rebuild: `npm run build` |
| Database Error | Check `DATABASE_URL` di `.env` |
| Port in use | `netstat -tulpn \| grep 3001` |

---

## 📚 Dokumentasi Lengkap

Untuk panduan lengkap, baca: **`DEPLOYMENT_AAPANEL.md`**

Untuk checklist, gunakan: **`DEPLOYMENT_CHECKLIST.md`**

Untuk script otomatis, jalankan: **`bash deploy.sh`**

---

**Selamat Deploy! 🎉**
