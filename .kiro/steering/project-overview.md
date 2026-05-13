---
inclusion: always
---

# E-Commerce TokoKita — Project Overview

## Stack
- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** — pakai `@import "tailwindcss"` dan `bg-linear-to-r` (bukan `bg-gradient-to-r`)
- **Prisma 7** + **@prisma/adapter-pg** — breaking changes dari v6
- **NextAuth.js v5 (beta)** — `auth()` async, `signIn/signOut` dari `next-auth/react` di client
- **PostgreSQL**
- **Cloudinary** (belum diimplementasi, step berikutnya)

## Prisma 7 — Aturan Penting
- Import dari `@/generated/prisma/client` (BUKAN `@prisma/client`)
- `url` TIDAK ada di `schema.prisma` — ada di `prisma.config.ts`
- Wajib pakai driver adapter: `new PrismaPg({ connectionString: ... })`
- Generator: `provider = "prisma-client"` (bukan `prisma-client-js`)
- Output: `output = "../src/generated/prisma"`

## Struktur Folder
```
src/
  app/
    (auth)/          # Login, Register — layout tanpa Navbar
    (store)/         # Halaman publik — layout dengan Navbar+Footer
    actions/         # Server Actions (auth.ts, cart.ts)
    api/auth/        # NextAuth route handler
  components/
    ui/              # Button, Input (reusable)
    layout/          # Navbar, NavbarClient, Footer
    product/         # ProductCard, AddToCartButton
    cart/            # CartItemRow
  generated/prisma/  # Auto-generated, jangan edit manual
  lib/
    auth.ts          # NextAuth config
    prisma.ts        # Prisma singleton dengan PrismaPg adapter
    definitions.ts   # Zod schemas + FormState type
    utils.ts         # slugify, formatRupiah, cn, dll
  proxy.ts           # Route protection (middleware deprecated di Next.js 16)
```

## Konvensi Kode
- `params` di page/route handler adalah `Promise` — selalu `await params`
- `cookies()`, `headers()` juga async — selalu `await`
- Server Actions: file dengan `'use server'` di atas, atau inline di Server Component
- Client Components: `'use client'` di atas, gunakan `useActionState` (bukan `useFormState`)
- Zod: gunakan `z.string().email()` (bukan `z.email()`)

## Akun Seed (setelah `npm run db:seed`)
- Admin: `admin@tokokita.com` / `admin123`
- User: `user@tokokita.com` / `user123`

## Commands
```bash
npm run db:generate   # prisma generate
npm run db:push       # prisma db push (tanpa migration)
npm run db:migrate    # prisma migrate dev
npm run db:seed       # tsx prisma/seed.ts
npm run db:studio     # prisma studio
npm run dev           # next dev
```
