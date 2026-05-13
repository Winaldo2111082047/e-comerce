# 🚀 Panduan Deploy TokoKita ke Vercel

> Stack: Next.js 16 · Neon PostgreSQL · Cloudinary · Vercel

---

## Daftar Isi

1. [Setup Database — Neon PostgreSQL](#1-setup-database--neon-postgresql)
2. [Setup Cloudinary](#2-setup-cloudinary)
3. [Persiapan Lokal Sebelum Deploy](#3-persiapan-lokal-sebelum-deploy)
4. [Deploy ke Vercel](#4-deploy-ke-vercel)
5. [Environment Variables Production](#5-environment-variables-production)
6. [Prisma Migrate Production](#6-prisma-migrate-production)
7. [Verifikasi Deployment](#7-verifikasi-deployment)
8. [Troubleshooting](#8-troubleshooting)
9. [Monitoring & Maintenance](#9-monitoring--maintenance)

---

## 1. Setup Database — Neon PostgreSQL

Neon adalah PostgreSQL serverless yang gratis, cocok untuk Next.js di Vercel.

### 1.1 Buat Akun & Project

1. Buka [neon.tech](https://neon.tech) → **Sign Up** (gratis)
2. Klik **New Project**
3. Isi:
   - **Project name**: `tokokita-production`
   - **Database name**: `tokokita`
   - **Region**: `AWS ap-southeast-1` (Singapore — terdekat dari Indonesia)
4. Klik **Create Project**

### 1.2 Ambil Connection String

1. Di dashboard Neon → klik project kamu
2. Tab **Connection Details**
3. Pilih **Connection string** → format **Prisma**
4. Copy string yang terlihat seperti:

```
postgresql://USER:PASSWORD@ep-xxx.ap-southeast-1.aws.neon.tech/tokokita?sslmode=require
```

> **Simpan string ini** — akan dipakai sebagai `DATABASE_URL` di Vercel.

### 1.3 Aktifkan Connection Pooling (Penting untuk Serverless)

Neon punya fitur **Connection Pooling** via PgBouncer — wajib diaktifkan untuk Vercel (serverless functions).

1. Di dashboard Neon → **Connection Details**
2. Toggle **Connection pooling** → ON
3. Copy **Pooled connection string** (ada `-pooler` di hostname):

```
postgresql://USER:PASSWORD@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/tokokita?sslmode=require
```

> Gunakan **pooled connection string** sebagai `DATABASE_URL` di Vercel.
> Gunakan **direct connection string** (tanpa `-pooler`) untuk `prisma migrate deploy`.

---

## 2. Setup Cloudinary

### 2.1 Buat Akun

1. Buka [cloudinary.com](https://cloudinary.com) → **Sign Up** (gratis 25GB)
2. Setelah login, buka **Dashboard**

### 2.2 Ambil Credentials

Di **Dashboard** → **API Keys**:

| Variable | Lokasi |
|----------|--------|
| `CLOUDINARY_CLOUD_NAME` | Dashboard → Cloud name |
| `CLOUDINARY_API_KEY` | Dashboard → API Keys → API Key |
| `CLOUDINARY_API_SECRET` | Dashboard → API Keys → API Secret |

### 2.3 Setup Upload Preset (untuk unsigned uploads)

1. Settings → **Upload** → **Upload presets**
2. Klik **Add upload preset**
3. Isi:
   - **Preset name**: `tokokita_products`
   - **Signing mode**: `Unsigned`
   - **Folder**: `tokokita/products`
4. Save

---

## 3. Persiapan Lokal Sebelum Deploy

### 3.1 Pastikan Build Lokal Berhasil

```bash
npm run build
```

Jika ada error, perbaiki dulu sebelum deploy.

### 3.2 Jalankan Pre-Deploy Check

```bash
npm run check
```

Semua harus ✅ pass.

### 3.3 Pastikan .gitignore Benar

File-file ini **TIDAK BOLEH** di-commit:

```
.env
.env.local
.env.production
.env.production.local
```

Verifikasi:
```bash
git status
# Pastikan tidak ada file .env* yang muncul sebagai "Changes to be committed"
```

### 3.4 Generate AUTH_SECRET Baru untuk Production

```bash
openssl rand -base64 32
```

**PENTING**: Jangan pakai AUTH_SECRET yang sama dengan development.

### 3.5 Push ke GitHub

```bash
git add .
git commit -m "ready for production deployment"
git push origin main
```

---

## 4. Deploy ke Vercel

### Opsi A: Via GitHub (Recommended)

1. Buka [vercel.com/new](https://vercel.com/new)
2. Klik **Import Git Repository**
3. Pilih repository `e-comerce` (atau nama repo kamu)
4. Framework: **Next.js** (auto-detected)
5. **JANGAN klik Deploy dulu** — set env vars dulu di step 5
6. Klik **Environment Variables** → tambahkan semua vars dari step 5
7. Klik **Deploy**

### Opsi B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy ke production
vercel --prod
```

---

## 5. Environment Variables Production

Set semua ini di **Vercel Dashboard → Project → Settings → Environment Variables**.

### Wajib

| Variable | Value | Keterangan |
|----------|-------|------------|
| `DATABASE_URL` | Pooled connection string dari Neon | Pakai yang ada `-pooler` |
| `AUTH_SECRET` | Output `openssl rand -base64 32` | **Baru, bukan dari dev** |
| `AUTH_URL` | `https://nama-app.vercel.app` | URL production tanpa trailing slash |
| `CLOUDINARY_CLOUD_NAME` | Dari Cloudinary dashboard | |
| `CLOUDINARY_API_KEY` | Dari Cloudinary dashboard | |
| `CLOUDINARY_API_SECRET` | Dari Cloudinary dashboard | |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Sama dengan `CLOUDINARY_CLOUD_NAME` | Untuk client-side |
| `NEXT_PUBLIC_APP_URL` | `https://nama-app.vercel.app` | Untuk SEO/OG |

### Cara Set di Vercel Dashboard

1. Buka project di Vercel
2. **Settings** → **Environment Variables**
3. Untuk setiap variable:
   - Isi **Key** dan **Value**
   - Centang environment: ✅ **Production** ✅ **Preview**
   - Klik **Save**

### Contoh Nilai Production

```bash
DATABASE_URL="postgresql://neondb_owner:abc123@ep-cool-name-pooler.ap-southeast-1.aws.neon.tech/tokokita?sslmode=require"
AUTH_SECRET="K8mN2pQ7rT4vX1yZ6wA9bC3dE5fG0hI"
AUTH_URL="https://tokokita.vercel.app"
CLOUDINARY_CLOUD_NAME="dxyz123abc"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz12345"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dxyz123abc"
NEXT_PUBLIC_APP_URL="https://tokokita.vercel.app"
```

---

## 6. Prisma Migrate Production

Setelah deploy pertama, jalankan migration ke database production.

### 6.1 Dari Lokal (Cara Termudah)

```bash
# Set DATABASE_URL ke direct connection (BUKAN pooled) untuk migrate
# Ganti dengan direct connection string dari Neon (tanpa -pooler)
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.ap-southeast-1.aws.neon.tech/tokokita?sslmode=require" npx prisma migrate deploy
```

### 6.2 Verifikasi Tabel Terbuat

```bash
# Cek tabel di database production
DATABASE_URL="postgresql://..." npx prisma studio
```

Atau cek di Neon Dashboard → **Tables**.

### 6.3 Seed Data Awal (Opsional)

```bash
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
```

Ini akan membuat:
- Admin: `admin@tokokita.com` / `admin123`
- User: `user@tokokita.com` / `user123`
- Kategori dan produk sample

> **Ganti password admin** setelah seed di production!

---

## 7. Verifikasi Deployment

### 7.1 Cek Build Log

Di Vercel Dashboard → **Deployments** → klik deployment terbaru → **Build Logs**.

Build sukses terlihat seperti:
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Build complete
```

### 7.2 Test Fungsionalitas

Setelah deploy, test manual:

- [ ] Homepage load dengan benar
- [ ] `/products` tampil produk
- [ ] `/login` bisa login
- [ ] `/register` bisa daftar
- [ ] `/admin` bisa diakses admin
- [ ] Upload gambar produk berhasil (Cloudinary)
- [ ] Checkout flow berjalan
- [ ] `/sitemap.xml` accessible
- [ ] `/robots.txt` accessible

### 7.3 Cek Environment Variables

```bash
# Vercel CLI — pull env vars production
vercel env pull .env.production.local

# Jangan commit file ini!
```

---

## 8. Troubleshooting

### ❌ Build Error: "Cannot find module"

```
Error: Cannot find module '@/generated/prisma/client'
```

**Solusi**: `postinstall` script sudah ada di `package.json` yang menjalankan `prisma generate` otomatis saat build. Pastikan tidak dihapus:

```json
"postinstall": "prisma generate"
```

---

### ❌ Runtime Error: "PrismaClientInitializationError"

```
Error: PrismaClientInitializationError: Can't reach database server
```

**Penyebab**: `DATABASE_URL` salah atau database tidak bisa diakses.

**Solusi**:
1. Cek `DATABASE_URL` di Vercel env vars
2. Pastikan pakai **pooled connection** (ada `-pooler` di hostname)
3. Pastikan `?sslmode=require` ada di akhir URL
4. Cek Neon dashboard — pastikan project tidak di-suspend

---

### ❌ Auth Error: "JWT_SESSION_ERROR"

```
[auth][error] JWTSessionError: ...
```

**Penyebab**: `AUTH_SECRET` tidak di-set atau berbeda antara deployments.

**Solusi**:
1. Pastikan `AUTH_SECRET` di-set di Vercel env vars
2. Pastikan nilainya minimal 32 karakter
3. Redeploy setelah set env vars

---

### ❌ Auth Error: "OAuthCallbackError" / Redirect Loop

**Penyebab**: `AUTH_URL` salah.

**Solusi**:
1. Set `AUTH_URL` ke URL production yang benar: `https://nama-app.vercel.app`
2. Tanpa trailing slash
3. Harus HTTPS di production

---

### ❌ Gambar Tidak Muncul

**Penyebab**: `CLOUDINARY_CLOUD_NAME` salah atau tidak di-set.

**Solusi**:
1. Cek `CLOUDINARY_CLOUD_NAME` di Vercel env vars
2. Pastikan `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` juga di-set
3. Cek `next.config.ts` — `remotePatterns` harus include `res.cloudinary.com`

---

### ❌ "Table does not exist" di Production

**Penyebab**: Migration belum dijalankan.

**Solusi**:
```bash
# Gunakan DIRECT connection (bukan pooled) untuk migrate
DATABASE_URL="postgresql://USER:PASS@ep-xxx.neon.tech/db?sslmode=require" \
  npx prisma migrate deploy
```

---

### ❌ Build Timeout di Vercel

**Penyebab**: Build terlalu lama (default timeout 45 menit).

**Solusi**:
1. Vercel Dashboard → Settings → General → **Build & Development Settings**
2. Tambah **Build Command**: `npm run build`
3. Pastikan tidak ada infinite loop di `generateStaticParams`

---

### ❌ "FUNCTION_INVOCATION_TIMEOUT"

**Penyebab**: Serverless function timeout (default 10 detik di Hobby plan).

**Solusi**:
1. Optimasi query Prisma — tambah index, kurangi data yang di-fetch
2. Upgrade ke Vercel Pro untuk timeout 60 detik
3. Gunakan connection pooling Neon

---

## 9. Monitoring & Maintenance

### Vercel Dashboard

- **Deployments** → lihat semua deployment dan status
- **Functions** → lihat invocation count dan error rate
- **Analytics** → Core Web Vitals (aktifkan di Settings)
- **Logs** → real-time function logs

### Neon Dashboard

- **Monitoring** → query performance, connection count
- **Branches** → buat branch database untuk preview deployments
- **Compute** → auto-suspend setelah 5 menit idle (gratis plan)

### Cloudinary Dashboard

- **Dashboard** → storage usage, bandwidth
- **Media Library** → kelola gambar yang diupload
- **Analytics** → transformasi dan delivery stats

### Update Dependencies

```bash
# Cek outdated packages
npm outdated

# Update minor/patch
npm update

# Update major (hati-hati — baca changelog dulu)
npx npm-check-updates -u
npm install
```

### Backup Database

```bash
# Dump database production
pg_dump "postgresql://USER:PASS@HOST/DB?sslmode=require" > backup-$(date +%Y%m%d).sql

# Restore
psql "postgresql://USER:PASS@HOST/DB?sslmode=require" < backup-20240101.sql
```

---

## Quick Reference

```bash
# Build lokal
npm run build

# Pre-deploy check
npm run check

# Deploy ke production
vercel --prod

# Migrate database production
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Seed database production
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts

# Pull env vars dari Vercel
vercel env pull .env.production.local

# Lihat logs production
vercel logs --prod
```

---

## Checklist Final Sebelum Go-Live

- [ ] `npm run build` berhasil tanpa error
- [ ] `npm run check` semua ✅ pass
- [ ] `AUTH_SECRET` production sudah di-generate baru
- [ ] `DATABASE_URL` mengarah ke Neon production (pooled)
- [ ] `AUTH_URL` diisi URL production yang benar
- [ ] Cloudinary credentials sudah diisi
- [ ] `.env*` tidak ada di git history
- [ ] `prisma migrate deploy` sudah dijalankan
- [ ] Seed data sudah dijalankan (jika perlu)
- [ ] Test login admin berhasil
- [ ] Test upload gambar berhasil
- [ ] Test checkout flow berhasil
- [ ] `/sitemap.xml` accessible
- [ ] Lighthouse score ≥ 80
