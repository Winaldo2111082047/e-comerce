/**
 * wishlist.store.ts
 *
 * Zustand store untuk wishlist state global.
 *
 * Masalah yang diselesaikan:
 * - WishlistButton di ProductCard masing-masing punya state lokal sendiri
 * - Jika user toggle wishlist di halaman products, halaman wishlist tidak tahu
 * - Setelah navigasi, state lokal hilang dan harus fetch ulang dari server
 *
 * Solusi:
 * - Store menyimpan Set<productId> yang sudah di-wishlist
 * - Diinisialisasi dari server saat halaman products/wishlist dimuat
 * - Toggle update store langsung (optimistic) — semua WishlistButton sync
 * - Persist ke sessionStorage agar tidak hilang saat navigasi antar halaman
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface WishlistState {
  /** Set product IDs yang sudah di-wishlist */
  ids: Set<string>
  /** Total item di wishlist */
  count: number
  /** Apakah store sudah diinisialisasi dari server */
  hydrated: boolean

  /** Inisialisasi dari server — replace semua ids */
  syncFromServer: (ids: string[]) => void
  /** Cek apakah produk ada di wishlist */
  isWishlisted: (productId: string) => boolean
  /** Toggle wishlist — return state baru */
  toggle: (productId: string) => boolean
  /** Tambah ke wishlist */
  add: (productId: string) => void
  /** Hapus dari wishlist */
  remove: (productId: string) => void
  /** Reset semua */
  reset: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// Set tidak bisa di-serialize langsung oleh JSON, jadi kita simpan sebagai array
// ─────────────────────────────────────────────────────────────────────────────

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: new Set<string>(),
      count: 0,
      hydrated: false,

      syncFromServer: (serverIds: string[]) => {
        const ids = new Set(serverIds)
        set({ ids, count: ids.size, hydrated: true })
      },

      isWishlisted: (productId: string) => get().ids.has(productId),

      toggle: (productId: string) => {
        const { ids } = get()
        const newIds = new Set(ids)
        let isNowWishlisted: boolean

        if (newIds.has(productId)) {
          newIds.delete(productId)
          isNowWishlisted = false
        } else {
          newIds.add(productId)
          isNowWishlisted = true
        }

        set({ ids: newIds, count: newIds.size })
        return isNowWishlisted
      },

      add: (productId: string) => {
        const newIds = new Set(get().ids)
        newIds.add(productId)
        set({ ids: newIds, count: newIds.size })
      },

      remove: (productId: string) => {
        const newIds = new Set(get().ids)
        newIds.delete(productId)
        set({ ids: newIds, count: newIds.size })
      },

      reset: () => set({ ids: new Set(), count: 0, hydrated: false }),
    }),
    {
      name: 'tokokita-wishlist',
      storage: createJSONStorage(() =>
        // sessionStorage: hilang saat tab ditutup — tidak expose data sensitif
        typeof window !== 'undefined' ? sessionStorage : localStorage
      ),
      // Serialize Set → Array untuk JSON storage
      partialize: (state) => ({
        ids: Array.from(state.ids),
        count: state.count,
      }),
      // Deserialize Array → Set saat hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // ids tersimpan sebagai array, convert balik ke Set
          state.ids = new Set(state.ids as unknown as string[])
        }
      },
    }
  )
)

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export const useWishlistCount = () => useWishlistStore((s) => s.count)
export const useIsWishlisted = (productId: string) =>
  useWishlistStore((s) => s.ids.has(productId))
