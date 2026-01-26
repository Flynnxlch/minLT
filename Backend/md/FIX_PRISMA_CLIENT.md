# Fix Prisma Client Error

## Masalah
Error: `The column risk_evaluations.current_impact_level does not exist in the current database`

## Penyebab
Prisma Client belum di-regenerate setelah perubahan schema. Migration sudah menghapus kolom `current_impact_level` dan `current_probability_type` dari tabel `risk_evaluations`, tapi Prisma Client masih mencoba mengakses kolom tersebut.

## Solusi

### 1. Stop Backend Server
Hentikan backend server yang sedang berjalan (Ctrl+C di terminal)

### 2. Regenerate Prisma Client
```bash
cd Backend
bunx prisma generate
```

Atau jika menggunakan npm:
```bash
cd Backend
npx prisma generate
```

### 3. Verifikasi
Pastikan tidak ada error saat generate. Output yang diharapkan:
```
✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client
```

### 4. Restart Backend Server
```bash
cd Backend
bun run dev
```

## Catatan
- Migration sudah dijalankan dan kolom sudah dihapus dari database
- Schema sudah diupdate dengan benar
- Hanya perlu regenerate Prisma Client agar sesuai dengan schema baru
