# ✅ TokoKita — Pre-Deployment Testing Checklist

> Jalankan semua checklist ini sebelum deploy ke production.
> Gunakan akun seed: **admin@tokokita.com / admin123** dan **user@tokokita.com / user123**

---

## 📋 CARA PAKAI

Tandai setiap item dengan:
- `[x]` — PASS ✅
- `[!]` — FAIL ❌ (catat bug di bagian Bug Log)
- `[-]` — SKIP (tidak relevan / belum diimplementasi)

---

## 1. 🔐 AUTHENTICATION

### Register
- [ ] Form register tampil dengan benar di `/register`
- [ ] Validasi: nama < 2 karakter → error "Nama minimal 2 karakter"
- [ ] Validasi: email format salah → error "Format email tidak valid"
- [ ] Validasi: password < 8 karakter → error "Password minimal 8 karakter"
- [ ] Validasi: password tanpa angka → error "Password harus mengandung angka"
- [ ] Password strength indicator muncul saat mengetik
- [ ] Register berhasil → redirect ke `/login?registered=1`
- [ ] Register dengan email yang sudah ada → error "Email sudah terdaftar"
- [ ] Rate limit: register 6x berturut-turut → error rate limit
- [ ] Input dengan HTML tags (`<script>alert(1)</script>`) → tersanitasi, tidak XSS

### Login
- [ ] Form login tampil dengan benar di `/login`
- [ ] Login dengan email/password salah → error "Email atau password salah"
- [ ] Login berhasil sebagai USER → redirect ke `/`
- [ ] Login berhasil sebagai ADMIN → redirect ke `/`
- [ ] Toggle show/hide password berfungsi
- [ ] Rate limit: login 11x berturut-turut → countdown timer muncul, form disabled
- [ ] Setelah rate limit, countdown timer berjalan mundur
- [ ] Setelah login, tombol "Masuk" di navbar berubah jadi nama user

### Logout
- [ ] Klik "Keluar" di dropdown navbar → logout berhasil
- [ ] Setelah logout, redirect ke `/`
- [ ] Setelah logout, halaman protected (`/cart`, `/orders`) redirect ke `/login`

### Session Persistence
- [ ] Refresh halaman → tetap login
- [ ] Buka tab baru → tetap login
- [ ] Tutup browser, buka lagi → tetap login (JWT persistent)

---

## 2. 🛡️ MIDDLEWARE & SECURITY

### Route Protection
- [ ] Akses `/cart` tanpa login → redirect ke `/login?callbackUrl=/cart`
- [ ] Akses `/checkout` tanpa login → redirect ke `/login`
- [ ] Akses `/orders` tanpa login → redirect ke `/login`
- [ ] Akses `/wishlist` tanpa login → redirect ke `/login`
- [ ] Akses `/admin` tanpa login → redirect ke `/login?callbackUrl=/admin`
- [ ] Akses `/admin` sebagai USER biasa → redirect ke `/?error=forbidden`
- [ ] Akses `/admin` sebagai ADMIN → berhasil masuk dashboard

### Auth Redirect
- [ ] Akses `/login` saat sudah login sebagai USER → redirect ke `/`
- [ ] Akses `/register` saat sudah login → redirect ke `/`
- [ ] Akses `/login` saat sudah login sebagai ADMIN → redirect ke `/admin`

### API Protection
- [ ] `GET /api/products` tanpa auth → 200 OK (public)
- [ ] `POST /api/products` tanpa auth → 401 Unauthorized
- [ ] `POST /api/products` sebagai USER → 403 Forbidden
- [ ] `POST /api/products` sebagai ADMIN → 405 (gunakan Server Actions)

### Security Headers
- [ ] Response header `X-Frame-Options: DENY` ada
- [ ] Response header `X-Content-Type-Options: nosniff` ada
- [ ] Response header `Referrer-Policy` ada
- [ ] Response header `X-RateLimit-Limit` ada di API responses

### Input Security
- [ ] Form dengan `<script>alert(1)</script>` → tidak ada XSS
- [ ] Form dengan SQL injection (`' OR 1=1 --`) → tidak ada error DB
- [ ] Form dengan null bytes (`\x00`) → tersanitasi
- [ ] Form dengan string sangat panjang (10000 karakter) → truncated/rejected

---

## 3. 🏠 HOMEPAGE

- [ ] Hero section tampil dengan benar
- [ ] Promo section (features strip) tampil
- [ ] Category section tampil dengan kategori dari DB
- [ ] Featured products tampil (8 produk terbaru)
- [ ] Klik kategori → navigasi ke `/products?category=slug`
- [ ] Klik produk → navigasi ke `/products/slug`
- [ ] Dark mode: semua section tampil dengan benar di dark mode

---

## 4. 🛍️ PRODUK

### Halaman Daftar Produk (`/products`)
- [ ] Grid produk tampil dengan benar
- [ ] Search: ketik kata kunci → hasil filter sesuai
- [ ] Search: kata kunci tidak ada → "Produk tidak ditemukan"
- [ ] Filter kategori: klik kategori → produk terfilter
- [ ] Filter harga: isi min/max → produk terfilter
- [ ] Sort: "Harga Terendah" → urutan benar
- [ ] Sort: "Harga Tertinggi" → urutan benar
- [ ] Sort: "Nama A-Z" → urutan benar
- [ ] Pagination: klik halaman 2 → produk halaman 2 tampil
- [ ] Reset filter: klik "reset filter" → semua filter hilang
- [ ] URL params: `/products?q=laptop&category=elektronik` → filter aktif
- [ ] Wishlist button muncul saat hover ProductCard (jika login)
- [ ] Produk stok habis: badge "Stok Habis" tampil

### Halaman Detail Produk (`/products/[slug]`)
- [ ] Gambar produk tampil
- [ ] Nama, harga, deskripsi tampil dengan benar
- [ ] Kategori badge tampil dan bisa diklik
- [ ] Stok tersedia: tombol "Tambah ke Keranjang" aktif
- [ ] Stok habis: tombol "Stok Habis" disabled
- [ ] Stok menipis (≤5): badge "Sisa X item" tampil
- [ ] Quantity selector: +/- berfungsi, tidak bisa melebihi stok
- [ ] Wishlist button: toggle add/remove (jika login)
- [ ] Wishlist button: redirect ke login jika belum login
- [ ] Rating summary tampil jika ada review
- [ ] Review list tampil
- [ ] Form review tampil jika sudah login
- [ ] Produk terkait tampil (4 produk dari kategori sama)
- [ ] Breadcrumb navigasi berfungsi

---

## 5. 🛒 CART

### Add to Cart
- [ ] Klik "Tambah ke Keranjang" → toast sukses muncul
- [ ] Cart badge di navbar increment (+1) secara instan (tanpa refresh)
- [ ] Tambah produk yang sama → quantity bertambah
- [ ] Tambah melebihi stok → error "Stok tidak mencukupi"
- [ ] Tambah tanpa login → redirect ke `/login`

### Halaman Cart (`/cart`)
- [ ] Semua item tampil dengan gambar, nama, harga
- [ ] Quantity +/- berfungsi
- [ ] Quantity tidak bisa < 1
- [ ] Quantity tidak bisa > stok produk
- [ ] Update quantity → subtotal item berubah
- [ ] Hapus item → item hilang dari list
- [ ] Hapus item → cart badge di navbar decrement
- [ ] Cart kosong → empty state tampil
- [ ] Subtotal total dihitung dengan benar
- [ ] Tombol "Lanjut ke Checkout" → navigasi ke `/checkout`

---

## 6. 💳 CHECKOUT

### Halaman Checkout (`/checkout`)
- [ ] Redirect ke `/cart` jika cart kosong
- [ ] Redirect ke `/login` jika belum login
- [ ] Order summary tampil dengan item dan total yang benar
- [ ] Form validasi: nama penerima kosong → error
- [ ] Form validasi: nomor telepon format salah → error
- [ ] Form validasi: kode pos bukan 5 digit → error
- [ ] Form validasi: metode pembayaran tidak dipilih → error
- [ ] Semua field diisi dengan benar → order berhasil dibuat
- [ ] Setelah order berhasil → redirect ke `/orders/[id]`
- [ ] Setelah order berhasil → cart dikosongkan
- [ ] Setelah order berhasil → stok produk berkurang
- [ ] Rate limit: checkout 6x berturut-turut → error rate limit

---

## 7. 📦 ORDERS

### Daftar Pesanan (`/orders`)
- [ ] Semua pesanan user tampil
- [ ] Status badge tampil dengan warna yang benar
- [ ] Thumbnail produk tampil
- [ ] Total harga tampil dengan benar
- [ ] Klik pesanan → navigasi ke detail

### Detail Pesanan (`/orders/[id]`)
- [ ] Status tracker tampil (step 1-5)
- [ ] Info pembayaran tampil untuk status PENDING
- [ ] Daftar produk dengan gambar, nama, qty, harga
- [ ] Alamat pengiriman tampil
- [ ] Rincian pembayaran (subtotal, ongkir, total)
- [ ] Akses order milik user lain → 404

---

## 8. ❤️ WISHLIST

- [ ] Toggle wishlist di ProductCard → state berubah instan (optimistic)
- [ ] Toggle wishlist di product detail → state berubah instan
- [ ] Semua WishlistButton di halaman yang sama sync (satu toggle, semua update)
- [ ] Halaman `/wishlist` tampil semua produk yang di-wishlist
- [ ] Remove dari wishlist di halaman wishlist → produk hilang
- [ ] Wishlist kosong → empty state tampil
- [ ] Klik "Beli Sekarang" → navigasi ke product detail

---

## 9. ⭐ REVIEW

- [ ] Form review tampil di product detail (jika login)
- [ ] Rating bintang: klik bintang → rating terpilih
- [ ] Submit review tanpa rating → error "Rating minimal 1 bintang"
- [ ] Submit review berhasil → review muncul di list
- [ ] Submit review kedua kali → update review yang ada (upsert)
- [ ] Hapus review → review hilang (hanya owner)
- [ ] Rate limit: 11 review dalam 1 jam → error rate limit

---

## 10. 👑 ADMIN DASHBOARD

### Dashboard (`/admin`)
- [ ] Stats cards tampil (revenue, orders, customers, products)
- [ ] Sales chart 7 hari tampil
- [ ] Order status chart tampil
- [ ] Monthly stats chart tampil
- [ ] Recent orders table tampil
- [ ] Top products tampil
- [ ] Low stock products tampil

### Kelola Produk (`/admin/products`)
- [ ] Daftar semua produk tampil
- [ ] Tambah produk: form tampil di `/admin/products/new`
- [ ] Tambah produk: validasi nama < 3 karakter → error
- [ ] Tambah produk: validasi deskripsi < 20 karakter → error
- [ ] Tambah produk: validasi harga negatif → error
- [ ] Tambah produk: upload gambar JPG/PNG/WebP → berhasil
- [ ] Tambah produk: upload file bukan gambar → error
- [ ] Tambah produk: upload gambar > 5MB → error
- [ ] Tambah produk berhasil → redirect ke `/admin/products`
- [ ] Edit produk: data lama ter-prefill di form
- [ ] Edit produk: simpan perubahan → data terupdate
- [ ] Toggle aktif/nonaktif produk → status berubah
- [ ] Hapus produk → produk hilang dari list
- [ ] Produk nonaktif tidak muncul di halaman publik

### Kelola Kategori (`/admin/categories`)
- [ ] Daftar kategori tampil dengan jumlah produk
- [ ] Tambah kategori: nama duplikat → error
- [ ] Tambah kategori berhasil → muncul di list
- [ ] Edit kategori: data lama ter-prefill
- [ ] Hapus kategori yang punya produk → error (tidak bisa dihapus)
- [ ] Hapus kategori kosong → berhasil

### Kelola Pesanan (`/admin/orders`)
- [ ] Daftar semua pesanan tampil
- [ ] Filter tab per status berfungsi
- [ ] Count per status akurat
- [ ] Pagination berfungsi
- [ ] Update status pesanan → status berubah
- [ ] Update status ke PAID → payment status jadi SUCCESS
- [ ] Update status ke CANCELLED → stok produk dikembalikan

---

## 11. 🌙 DARK MODE

- [ ] Toggle dark/light/system di navbar berfungsi
- [ ] Preferensi tersimpan (refresh halaman → tema sama)
- [ ] System mode: ikuti OS preference
- [ ] Navbar: background, text, border tampil benar di dark mode
- [ ] Homepage: semua section tampil benar di dark mode
- [ ] Halaman produk: card, filter, pagination tampil benar
- [ ] Cart page: item rows, summary tampil benar
- [ ] Checkout page: form, summary tampil benar
- [ ] Admin dashboard: sidebar, cards, table tampil benar
- [ ] Form login/register tampil benar di dark mode
- [ ] Dropdown user menu tampil benar di dark mode
- [ ] Toast notifications tampil benar di dark mode
- [ ] Transisi smooth saat toggle (150ms)

---

## 12. 📱 RESPONSIVE MOBILE

### Breakpoints yang dites: 375px (iPhone SE), 390px (iPhone 14), 768px (iPad)

- [ ] Navbar: hamburger menu muncul di mobile
- [ ] Navbar: mobile menu buka/tutup dengan benar
- [ ] Navbar: search icon di mobile navigasi ke `/products`
- [ ] Homepage: hero section responsive
- [ ] Homepage: category grid 2 kolom di mobile
- [ ] Homepage: product grid 2 kolom di mobile
- [ ] Products page: filter sidebar tersembunyi di mobile
- [ ] Products page: category chips horizontal scroll di mobile
- [ ] Products page: sort dropdown tampil di mobile
- [ ] Product detail: gambar full width di mobile
- [ ] Product detail: info di bawah gambar (bukan samping)
- [ ] Cart: item rows tampil dengan benar di mobile
- [ ] Cart: summary di bawah items di mobile
- [ ] Checkout: form full width di mobile
- [ ] Admin: sidebar tersembunyi, mobile header tampil
- [ ] Admin: table horizontal scroll di mobile
- [ ] Semua tombol mudah di-tap (min 44px touch target)
- [ ] Tidak ada horizontal overflow di semua halaman

---

## 13. ⚡ PERFORMANCE

### Core Web Vitals (gunakan Chrome DevTools → Lighthouse)
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID/INP (Interaction to Next Paint) < 200ms
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] Lighthouse Performance score ≥ 80

### Images
- [ ] Gambar produk menggunakan `next/image` (lazy loading)
- [ ] Gambar hero menggunakan `priority` prop
- [ ] Gambar Cloudinary menggunakan format WebP/AVIF otomatis
- [ ] Tidak ada gambar yang melebihi container

### Network
- [ ] Halaman homepage load < 3s (koneksi 4G)
- [ ] API `/api/products` response < 500ms
- [ ] Tidak ada request yang gagal di Network tab

### Bundle
- [ ] `npm run build` berhasil tanpa error
- [ ] Tidak ada warning "Large page data" di build output

---

## 14. 🔍 SEO & METADATA

- [ ] `<title>` unik di setiap halaman
- [ ] Homepage: title "Beranda — Belanja Online Terpercaya"
- [ ] Product detail: title = nama produk
- [ ] Admin pages: title "Dashboard Admin", "Kelola Produk", dll
- [ ] `<meta description>` ada di product detail
- [ ] OG image ada di product detail (jika ada gambar)
- [ ] `robots.txt` tidak memblokir halaman publik
- [ ] Canonical URL benar

---

## 15. 🗄️ DATABASE

- [ ] Seed data berhasil: `npm run db:seed`
- [ ] Admin user ada: `admin@tokokita.com`
- [ ] User biasa ada: `user@tokokita.com`
- [ ] Kategori seed ada (minimal 3)
- [ ] Produk seed ada (minimal 5)
- [ ] Relasi produk-kategori benar
- [ ] Cascade delete: hapus user → cart, wishlist, review ikut terhapus
- [ ] Unique constraint: satu user satu review per produk
- [ ] Unique constraint: satu user satu wishlist entry per produk
- [ ] Transaction checkout: jika gagal di tengah → tidak ada data partial

---

## 16. 🌐 API ENDPOINTS

### `GET /api/products`
- [ ] Response 200 dengan array products
- [ ] Query `?q=laptop` → filter by name
- [ ] Query `?category=elektronik` → filter by category slug
- [ ] Query `?sort=price_asc` → sorted by price ascending
- [ ] Query `?page=2&limit=12` → pagination benar
- [ ] Response include `pagination` object
- [ ] Decimal price di-serialize ke number (bukan string)

### `POST /api/products` (protected)
- [ ] Tanpa auth → 401
- [ ] Sebagai USER → 403
- [ ] Response 405 (gunakan Server Actions)

---

## 17. 🔄 STATE MANAGEMENT (Zustand)

- [ ] Cart badge update instan saat add to cart (tanpa refresh)
- [ ] Cart badge update instan saat remove from cart
- [ ] Wishlist state sync antar semua WishlistButton di halaman yang sama
- [ ] Wishlist state persist saat navigasi antar halaman (sessionStorage)
- [ ] Filter state persist saat back navigation dari product detail
- [ ] Cart store diinisialisasi dari server saat halaman load

---

## 18. 🏗️ BUILD & DEPLOYMENT

- [ ] `npm run build` berhasil tanpa error
- [ ] `npm run build` berhasil tanpa TypeScript errors
- [ ] `npm run lint` berhasil (0 errors)
- [ ] Tidak ada `console.log` yang tertinggal di production code
- [ ] `.env` tidak di-commit ke git
- [ ] `.env.local` tidak di-commit ke git
- [ ] `AUTH_SECRET` production berbeda dari development
- [ ] `DATABASE_URL` production mengarah ke database production
- [ ] `prisma migrate deploy` berhasil di production database

---

## 🐛 BUG LOG

Catat semua bug yang ditemukan di sini:

| # | Halaman | Deskripsi Bug | Severity | Status |
|---|---------|---------------|----------|--------|
| 1 | | | High/Med/Low | Open/Fixed |
| 2 | | | | |
| 3 | | | | |

**Severity:**
- **High** — Fitur utama tidak berfungsi, data loss, security issue
- **Medium** — Fitur tidak berfungsi tapi ada workaround
- **Low** — UI/UX issue, typo, minor visual bug

---

## 🔒 SECURITY CHECKLIST

- [ ] Semua Server Actions punya auth guard (`requireUser` / `requireAdmin`)
- [ ] Ownership check: user hanya bisa akses data miliknya
- [ ] Rate limiting aktif di login, register, checkout, review
- [ ] Input sanitasi aktif (HTML strip, null bytes, path traversal)
- [ ] Zod validation di semua form inputs
- [ ] Password di-hash dengan bcrypt (cost factor 12)
- [ ] JWT secret kuat (min 32 chars, random)
- [ ] Tidak ada secret di client-side code
- [ ] `NEXT_PUBLIC_` hanya untuk data yang aman di-expose
- [ ] SQL injection tidak mungkin (Prisma parameterized queries)
- [ ] File upload: validasi tipe, ukuran, magic bytes
- [ ] Security headers aktif (X-Frame-Options, HSTS, dll)
- [ ] Middleware protection aktif untuk semua protected routes

---

## 📊 HASIL TESTING

| Kategori | Total | Pass | Fail | Skip |
|----------|-------|------|------|------|
| Authentication | 16 | | | |
| Middleware & Security | 18 | | | |
| Homepage | 7 | | | |
| Produk | 22 | | | |
| Cart | 12 | | | |
| Checkout | 11 | | | |
| Orders | 10 | | | |
| Wishlist | 8 | | | |
| Review | 7 | | | |
| Admin Dashboard | 24 | | | |
| Dark Mode | 16 | | | |
| Responsive Mobile | 18 | | | |
| Performance | 10 | | | |
| SEO & Metadata | 8 | | | |
| Database | 10 | | | |
| API Endpoints | 8 | | | |
| State Management | 6 | | | |
| Build & Deployment | 9 | | | |
| **TOTAL** | **220** | | | |

---

## ✅ SIGN-OFF

- [ ] Semua High severity bugs sudah fixed
- [ ] Build production berhasil
- [ ] Testing dilakukan di Chrome, Firefox, Safari
- [ ] Testing dilakukan di mobile (iOS + Android)
- [ ] Siap deploy ke production

**Tanggal testing:** _______________
**Tested by:** _______________
**Build version:** _______________
