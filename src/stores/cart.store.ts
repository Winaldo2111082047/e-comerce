/**
 * cart.store.ts
 *
 * Zustand store untuk cart count di navbar.
 *
 * Masalah yang diselesaikan:
 * - Cart badge di navbar hanya update setelah full page refresh
 * - Setiap addToCart() memanggil router.refresh() yang lambat
 * - Tidak ada feedback instan saat item ditambah/dihapus
 *
 * Solusi:
 * - Store ini menyimpan cart count secara global
 * - Diinisialisasi dari server (Navbar.tsx) via CartStoreInitializer
 * - Update optimistis saat addToCart/removeFromCart dipanggil
 * - Navbar badge langsung update tanpa refresh
 */

import { create } from 'zustand'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface CartState {
  /** Jumlah item unik di cart (bukan total quantity) */
  count: number
  /** Set count dari server — dipanggil saat hydration */
  setCount: (count: number) => void
  /** Increment saat item berhasil ditambah */
  increment: (by?: number) => void
  /** Decrement saat item dihapus */
  decrement: (by?: number) => void
  /** Reset ke 0 saat cart dikosongkan */
  reset: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>((set) => ({
  count: 0,

  setCount: (count) => set({ count: Math.max(0, count) }),

  increment: (by = 1) =>
    set((state) => ({ count: state.count + by })),

  decrement: (by = 1) =>
    set((state) => ({ count: Math.max(0, state.count - by) })),

  reset: () => set({ count: 0 }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS — memoized untuk performa
// ─────────────────────────────────────────────────────────────────────────────

/** Ambil cart count saja — cegah re-render jika state lain berubah */
export const useCartCount = () => useCartStore((s) => s.count)
