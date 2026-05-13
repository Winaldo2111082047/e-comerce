import { toast as sonner } from 'sonner'

/**
 * Reusable toast helpers untuk TokoKita.
 * Semua toast di-centralize di sini agar konsisten.
 */
export const toast = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  loginSuccess: (name?: string) =>
    sonner.success(`Selamat datang${name ? `, ${name}` : ''}! 👋`, {
      description: 'Kamu berhasil masuk.',
    }),

  loginError: (message = 'Email atau password salah.') =>
    sonner.error('Login gagal', { description: message }),

  registerSuccess: () =>
    sonner.success('Akun berhasil dibuat! 🎉', {
      description: 'Silakan masuk dengan akun baru kamu.',
    }),

  logoutSuccess: () =>
    sonner.success('Berhasil keluar', {
      description: 'Sampai jumpa lagi!',
    }),

  // ── Cart ──────────────────────────────────────────────────────────────────
  addToCartSuccess: (productName?: string) =>
    sonner.success('Ditambahkan ke keranjang 🛒', {
      description: productName ? `"${productName}" berhasil ditambahkan.` : undefined,
    }),

  addToCartError: (message = 'Gagal menambahkan ke keranjang.') =>
    sonner.error('Gagal', { description: message }),

  removeFromCartSuccess: () =>
    sonner.success('Produk dihapus dari keranjang'),

  cartUpdated: () =>
    sonner.success('Keranjang diperbarui'),

  // ── Checkout ──────────────────────────────────────────────────────────────
  checkoutSuccess: (orderNumber?: string) =>
    sonner.success('Pesanan berhasil dibuat! 🎊', {
      description: orderNumber ? `No. pesanan: ${orderNumber}` : 'Segera selesaikan pembayaran.',
      duration: 6000,
    }),

  checkoutError: (message = 'Gagal membuat pesanan.') =>
    sonner.error('Checkout gagal', { description: message }),

  // ── Product (Admin) ───────────────────────────────────────────────────────
  productCreated: (name?: string) =>
    sonner.success('Produk berhasil ditambahkan ✅', {
      description: name ? `"${name}" sudah tersedia di toko.` : undefined,
    }),

  productUpdated: (name?: string) =>
    sonner.success('Produk berhasil diperbarui', {
      description: name ? `"${name}" telah disimpan.` : undefined,
    }),

  productDeleted: (name?: string) =>
    sonner.success('Produk dihapus', {
      description: name ? `"${name}" telah dihapus.` : undefined,
    }),

  productToggled: (name: string, isActive: boolean) =>
    sonner.success(`Produk ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`, {
      description: `"${name}" sekarang ${isActive ? 'aktif' : 'nonaktif'}.`,
    }),

  // ── Category (Admin) ──────────────────────────────────────────────────────
  categoryCreated: (name?: string) =>
    sonner.success('Kategori berhasil dibuat', {
      description: name ? `"${name}" sudah tersedia.` : undefined,
    }),

  categoryUpdated: () => sonner.success('Kategori berhasil diperbarui'),

  categoryDeleted: () => sonner.success('Kategori berhasil dihapus'),

  // ── Order (Admin) ─────────────────────────────────────────────────────────
  orderStatusUpdated: (status: string) =>
    sonner.success('Status pesanan diperbarui', {
      description: `Status diubah ke "${status}".`,
    }),

  // ── Upload ────────────────────────────────────────────────────────────────
  uploadSuccess: () =>
    sonner.success('Gambar berhasil diupload 📸'),

  uploadError: (message = 'Gagal upload gambar.') =>
    sonner.error('Upload gagal', { description: message }),

  // ── Generic ───────────────────────────────────────────────────────────────
  success: (message: string, description?: string) =>
    sonner.success(message, { description }),

  error: (message: string, description?: string) =>
    sonner.error(message, { description }),

  info: (message: string, description?: string) =>
    sonner.info(message, { description }),

  warning: (message: string, description?: string) =>
    sonner.warning(message, { description }),

  loading: (message: string) =>
    sonner.loading(message),

  /**
   * Promise toast — otomatis tampil loading → success/error
   * @example
   * toast.promise(deleteProduct(id), {
   *   loading: 'Menghapus...',
   *   success: 'Produk dihapus',
   *   error: 'Gagal menghapus',
   * })
   */
  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) =>
    sonner.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    }),

  /**
   * Tampilkan error dari Server Action / API secara otomatis.
   * Konversi error teknis ke pesan yang user-friendly.
   */
  actionError: (error: unknown, fallback = 'Terjadi kesalahan. Silakan coba lagi.') => {
    const message =
      error instanceof Error
        ? error.message.includes('fetch') || error.message.includes('network')
          ? 'Koneksi bermasalah. Periksa internet kamu.'
          : error.message.length < 100
          ? error.message
          : fallback
        : fallback
    return sonner.error('Gagal', { description: message })
  },
}
