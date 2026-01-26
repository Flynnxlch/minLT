# Setup Regulation Updates dengan Supabase Storage

## 1. Setup Supabase

### Buat Supabase Project
1. Buka https://supabase.com dan buat project baru
2. Catat `Project URL` dan `Service Role Key` dari Settings > API

### Setup Storage Bucket
1. Buka Storage di dashboard Supabase
2. Buat bucket baru dengan nama `regulation-updates`
3. Set bucket menjadi **Public** (agar gambar bisa diakses)
4. Atau jika ingin private, pastikan policy RLS sudah dikonfigurasi dengan benar

## 2. Konfigurasi Environment Variables

Tambahkan ke `Backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=regulation-updates
```

## 3. Install Dependencies

```bash
cd Backend
bun install
```

Ini akan menginstall `@supabase/supabase-js` yang sudah ditambahkan ke `package.json`.

## 4. Run Migration

```bash
cd Backend
bunx prisma migrate dev --name add_regulation_updates
```

Ini akan membuat tabel `regulation_updates` di database.

## 5. Regenerate Prisma Client

```bash
cd Backend
bunx prisma generate
```

## 6. Restart Backend Server

```bash
cd Backend
bun run dev
```

## Struktur Database

Tabel `regulation_updates` memiliki kolom:
- `id` (Int, Primary Key)
- `title` (String, 500 chars)
- `category` (String, 255 chars)
- `contentType` (Enum: TEXT, IMAGE)
- `content` (Text) - berisi text atau URL gambar dari Supabase Storage
- `link` (String, 500 chars, nullable)
- `publishedAt` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## API Endpoints

### GET /api/regulation-updates
Mendapatkan semua regulation updates (public, tidak perlu auth)

### GET /api/regulation-updates/:id
Mendapatkan regulation update by ID (public)

### POST /api/regulation-updates
Membuat regulation update baru (hanya ADMIN_PUSAT)
- Body: `{ title, category, contentType, content, link? }`
- Jika `contentType` = 'image' dan `content` adalah base64, akan diupload ke Supabase Storage

### PUT /api/regulation-updates/:id
Update regulation update (hanya ADMIN_PUSAT)

### DELETE /api/regulation-updates/:id
Hapus regulation update (hanya ADMIN_PUSAT)
- Jika tipe gambar, akan menghapus file dari Supabase Storage juga

## Catatan

- Gambar akan diupload ke Supabase Storage dengan path: `regulation-updates/{timestamp}-{random}.{ext}`
- URL public dari Supabase Storage akan disimpan di database
- Frontend akan menampilkan gambar langsung dari URL Supabase Storage
