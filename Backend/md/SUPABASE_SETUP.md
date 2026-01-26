# Panduan Setup Database Supabase untuk MinLT

Panduan lengkap untuk setup database Supabase baru, menjalankan migration Prisma, dan melakukan testing.

## 📋 Daftar Isi

1. [Setup Supabase Project](#1-setup-supabase-project)
2. [Setup Prisma dengan Supabase](#2-setup-prisma-dengan-supabase)
3. [Menjalankan Migration](#3-menjalankan-migration)
4. [Menjalankan Seed untuk Admin User](#4-menjalankan-seed-untuk-admin-user)
5. [Testing Membuat Risk Baru](#5-testing-membuat-risk-baru)

---

## 1. Setup Supabase Project

### 1.1 Buat Project Baru di Supabase

1. Buka [Supabase Dashboard](https://app.supabase.com/)
2. Klik **"New Project"**
3. Isi informasi project:
   - **Name**: `minlt-database` (atau nama lain sesuai preferensi)
   - **Database Password**: Buat password yang kuat (simpan dengan aman!)
   - **Region**: Pilih region terdekat (misalnya `Southeast Asia (Singapore)`)
   - **Pricing Plan**: Pilih sesuai kebutuhan (Free tier cukup untuk development)

4. Klik **"Create new project"** dan tunggu hingga project selesai dibuat (sekitar 2-3 menit)

### 1.2 Dapatkan Connection String

1. Setelah project dibuat, buka **Settings** → **Database**
2. Scroll ke bagian **Connection string**
3. Pilih tab **"URI"**
4. Copy connection string yang terlihat seperti:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. **PENTING**: Ganti `[YOUR-PASSWORD]` dengan password database yang Anda buat di langkah 1.1
6. Contoh hasil akhir:
   ```
   postgresql://postgres:MySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
   ```

---

## 2. Setup Prisma dengan Supabase

### 2.1 Install Dependencies

Pastikan Anda sudah berada di folder `Backend`:

```bash
cd Backend
```

Install dependencies jika belum:

```bash
bun install
# atau jika menggunakan npm:
# npm install
```

### 2.2 Setup Environment Variable

1. Buat file `.env` di folder `Backend` (jika belum ada)
2. Tambahkan `DATABASE_URL` dengan connection string dari Supabase:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?schema=public"
```

**Catatan**: 
- Ganti `YOUR_PASSWORD` dengan password database Anda
- Ganti `xxxxx` dengan ID project Supabase Anda
- Tambahkan `?schema=public` di akhir untuk Prisma

### 2.3 Generate Prisma Client

Generate Prisma client berdasarkan schema:

```bash
bun run prisma:generate
# atau:
# npx prisma generate
```

---

## 3. Menjalankan Migration

### 3.1 Buat Migration Baru

Jalankan migration untuk membuat semua tabel di database:

```bash
bun run prisma:migrate
# atau:
# npx prisma migrate dev --name init
```

**Catatan**: 
- Jika ini pertama kali, Prisma akan membuat folder `prisma/migrations`
- Migration akan membuat semua tabel sesuai dengan `schema.prisma`

### 3.2 Verifikasi Migration

Setelah migration selesai, verifikasi dengan:

```bash
bun run prisma:studio
# atau:
# npx prisma studio
```

Ini akan membuka Prisma Studio di browser (default: http://localhost:5555) dimana Anda bisa melihat semua tabel yang sudah dibuat.

**Atau** cek langsung di Supabase Dashboard:
1. Buka **Table Editor** di sidebar kiri
2. Anda seharusnya melihat tabel-tabel berikut:
   - `users`
   - `risks`
   - `risk_analyses`
   - `risk_mitigations`
   - `risk_evaluations`
   - `user_registration_requests`
   - `other_requests`

---

## 4. Menjalankan Seed untuk Admin User

### 4.1 Verifikasi Seed File

File `prisma/seed.js` sudah sesuai dengan schema. File ini akan membuat 3 user:
- **Admin Pusat** (`admin@adminlte.io` / `admin123`) - Cabang: `KPS`
- **Admin Cabang** (`admincabang@adminlte.io` / `admin123`) - Cabang: `CGK`
- **User Biasa** (`user@adminlte.io` / `user123`) - Cabang: `CGK`

**✅ Semua nilai `regionCabang` sudah menggunakan enum yang valid dari `Cabang` enum.**

### 4.2 Jalankan Seed

Jalankan seed untuk membuat admin user:

```bash
bun run prisma:seed
# atau:
# bun prisma/seed.js
```

Output yang diharapkan:
```
🌱 Starting seed...
📝 Creating users only (no sample data)...

✅ Created admin user: admin@adminlte.io
   - Name: Sawit Gila
   - Cabang: KPS
   - NIP: 101010010110101
   - Role: ADMIN_PUSAT
   - Password: admin123

✅ Created admin cabang user: admincabang@adminlte.io
   - Name: Admin Cabang
   - Cabang: CGK
   - NIP: 1234567890
   - Role: ADMIN_CABANG
   - Password: admin123

✅ Created regular user: user@adminlte.io
   - Name: Regular User
   - Cabang: CGK
   - NIP: 9876543210
   - Role: USER_BIASA
   - Password: user123

🎉 Seed completed successfully!

📋 Summary:
   - Created 3 users (1 Admin Pusat, 1 Admin Cabang, 1 Regular User)
   - No sample risks, mitigations, or evaluations created
   - Users can now log in and start using the system
```

### 4.3 Verifikasi User di Database

Verifikasi user sudah dibuat dengan:
- **Prisma Studio**: `bun run prisma:studio` → buka tabel `users`
- **Supabase Dashboard**: Table Editor → `users`

---

## 5. Testing Membuat Risk Baru

### 5.1 Start Backend Server

Pastikan backend server berjalan:

```bash
bun run dev
# atau:
# bun src/server.js
```

Server akan berjalan di `http://localhost:3001` (atau sesuai konfigurasi di `src/config/index.js`)

### 5.2 Login sebagai Admin

#### Via Frontend (Recommended)

1. Buka aplikasi frontend di browser
2. Masuk ke halaman Login
3. Login dengan kredensial admin:
   - **Email**: `admin@adminlte.io`
   - **Password**: `admin123`
   - **Remember for 7 days**: (opsional, centang jika ingin)

4. Setelah login berhasil, Anda akan diarahkan ke Dashboard

#### Via API (Manual Testing)

Gunakan Postman, curl, atau tool API lainnya:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@adminlte.io",
    "password": "admin123",
    "rememberMe": false
  }'
```

Response yang diharapkan:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@adminlte.io",
    "name": "Sawit Gila",
    "role": "ADMIN_PUSAT",
    "userRole": "ADMIN_PUSAT",
    "regionCabang": "KPS",
    ...
  }
}
```

**Simpan token** untuk digunakan di request berikutnya.

### 5.3 Membuat Risk Baru

#### Via Frontend

1. Setelah login, klik menu **"Entri Risiko Baru"** atau navigasi ke `/risks/new`
2. Isi form **"Formulir Entri Risiko"**:
   - **Nama Perusahaan**: Otomatis terisi "PT. Gapura Angkasa"
   - **Divisi**: Pilih divisi (misalnya "Internal Audit Group Head")
   - **Sasaran**: Isi sasaran risiko (misalnya "Meningkatkan efisiensi operasional")
   - **Peristiwa Risiko**: Isi peristiwa risiko (misalnya "Kegagalan sistem IT")
   - **Deskripsi Peristiwa Risiko**: Isi deskripsi detail
   - **Kategori**: Pilih kategori risiko
   - **Kategori Resiko**: Pilih kategori resiko (Kualitatif/Kuantitatif)
   - **Penyebab Risiko**: Isi penyebab risiko
   - **Deskripsi Dampak**: Isi deskripsi dampak
   - **Cabang**: Pilih cabang (misalnya "KPS")

3. Klik **"Buat Risiko"**
4. Setelah berhasil, Anda akan diarahkan ke halaman **"Semua Risiko"** (`/risks`)

#### Via API (Manual Testing)

```bash
curl -X POST http://localhost:3001/api/risks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "riskEvent": "Kegagalan sistem IT",
    "title": "Kegagalan sistem IT",
    "organization": "PT. Gapura Angkasa",
    "division": "Internal Audit Group Head",
    "target": "Meningkatkan efisiensi operasional",
    "riskEventDescription": "Sistem IT mengalami downtime yang menyebabkan gangguan operasional",
    "riskCause": "Kurangnya maintenance rutin",
    "riskImpactExplanation": "Operasional terhenti, kerugian finansial",
    "category": "Operational Risk",
    "riskCategoryType": "Kualitatif",
    "regionCode": "KPS"
  }'
```

Response yang diharapkan:
```json
{
  "message": "Risk created successfully",
  "risk": {
    "id": "RISK-20250114-1234",
    "riskEvent": "Kegagalan sistem IT"
  }
}
```

### 5.4 Verifikasi Risk di Database

Verifikasi risk sudah dibuat dengan:
- **Prisma Studio**: `bun run prisma:studio` → buka tabel `risks`
- **Supabase Dashboard**: Table Editor → `risks`
- **Frontend**: Buka halaman **"Semua Risiko"** (`/risks`)

---

## 🔧 Troubleshooting

### Error: "Connection refused" atau "Connection timeout"

**Solusi**:
1. Pastikan connection string di `.env` sudah benar
2. Pastikan password sudah diganti dengan password database yang benar
3. Pastikan Supabase project masih aktif (tidak di-pause)
4. Cek firewall atau network yang mungkin memblokir koneksi

### Error: "Enum value not found" saat seed

**Solusi**:
1. Pastikan `regionCabang` di `seed.js` menggunakan enum yang valid dari `Cabang` enum
2. Enum yang valid: `KPS`, `CGO`, `CGK`, `DPS`, `SUB`, dll (lihat `schema.prisma`)
3. Jangan gunakan nilai yang tidak ada di enum

### Error: "Table already exists" saat migration

**Solusi**:
1. Jika ingin reset database, jalankan:
   ```bash
   npx prisma migrate reset
   ```
   **PERINGATAN**: Ini akan menghapus semua data!
2. Atau gunakan `prisma migrate deploy` untuk production

### Error: "Invalid credentials" saat login

**Solusi**:
1. Pastikan seed sudah dijalankan dengan benar
2. Cek di database apakah user sudah dibuat
3. Pastikan password yang digunakan sesuai dengan seed (`admin123`)

---

## 📚 Referensi

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

## ✅ Checklist Setup

- [ ] Supabase project dibuat
- [ ] Connection string didapatkan dan disimpan di `.env`
- [ ] Prisma client di-generate
- [ ] Migration dijalankan dan tabel dibuat
- [ ] Seed dijalankan dan admin user dibuat
- [ ] Backend server berjalan
- [ ] Login sebagai admin berhasil
- [ ] Risk baru berhasil dibuat
- [ ] Data terlihat di database (Supabase Dashboard atau Prisma Studio)

---

**Selamat! Database Supabase Anda sudah siap digunakan! 🎉**
