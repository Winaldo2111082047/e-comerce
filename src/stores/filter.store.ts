/**
 * filter.store.ts
 *
 * Zustand store untuk filter produk.
 *
 * Masalah yang diselesaikan:
 * - Filter state hilang saat user navigasi ke product detail lalu back
 * - Tidak ada "pending state" — setiap perubahan filter langsung trigger navigation
 * - Tidak bisa undo filter yang baru diapply
 *
 * Solusi:
 * - Store menyimpan filter state lokal (draft) sebelum di-apply ke URL
 * - Persist ke sessionStorage agar tidak hilang saat back navigation
 * - URL tetap sebagai source of truth untuk SSR/SEO
 * - Store hanya untuk UX enhancement (pending state, draft filters)
 *
 * Catatan arsitektur:
 * URL params = source of truth untuk server rendering
 * Store = UI state untuk client-side UX (draft, pending, history)
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface FilterValues {
  q: string
  category: string
  priceMin: string
  priceMax: string
  sort: string
}

interface FilterState {
  /** Filter yang sedang aktif (sync dengan URL) */
  active: FilterValues
  /** Filter draft — belum di-apply ke URL */
  draft: FilterValues
  /** Apakah ada perubahan draft yang belum di-apply */
  isDirty: boolean

  /** Sync active filter dari URL params (dipanggil di page) */
  syncFromUrl: (params: Partial<FilterValues>) => void
  /** Update draft filter */
  setDraft: (key: keyof FilterValues, value: string) => void
  /** Apply draft ke URL — return URL string */
  buildUrl: () => string
  /** Reset draft ke active */
  discardDraft: () => void
  /** Reset semua filter */
  reset: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT VALUES
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: FilterValues = {
  q: '',
  category: '',
  priceMin: '',
  priceMax: '',
  sort: 'newest',
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      active: { ...DEFAULT_FILTERS },
      draft: { ...DEFAULT_FILTERS },
      isDirty: false,

      syncFromUrl: (params) => {
        const active: FilterValues = {
          q: params.q ?? '',
          category: params.category ?? '',
          priceMin: params.priceMin ?? '',
          priceMax: params.priceMax ?? '',
          sort: params.sort ?? 'newest',
        }
        set({ active, draft: { ...active }, isDirty: false })
      },

      setDraft: (key, value) => {
        const draft = { ...get().draft, [key]: value }
        const active = get().active
        const isDirty = Object.keys(draft).some(
          (k) => draft[k as keyof FilterValues] !== active[k as keyof FilterValues]
        )
        set({ draft, isDirty })
      },

      buildUrl: () => {
        const { draft } = get()
        const params = new URLSearchParams()
        if (draft.q) params.set('q', draft.q)
        if (draft.category) params.set('category', draft.category)
        if (draft.priceMin) params.set('priceMin', draft.priceMin)
        if (draft.priceMax) params.set('priceMax', draft.priceMax)
        if (draft.sort && draft.sort !== 'newest') params.set('sort', draft.sort)
        const qs = params.toString()
        return `/products${qs ? `?${qs}` : ''}`
      },

      discardDraft: () => {
        const { active } = get()
        set({ draft: { ...active }, isDirty: false })
      },

      reset: () =>
        set({
          active: { ...DEFAULT_FILTERS },
          draft: { ...DEFAULT_FILTERS },
          isDirty: false,
        }),
    }),
    {
      name: 'tokokita-filters',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : localStorage
      ),
      // Hanya persist active filter — draft tidak perlu
      partialize: (state) => ({ active: state.active }),
    }
  )
)

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export const useActiveFilters = () => useFilterStore((s) => s.active)
export const useDraftFilters = () => useFilterStore((s) => s.draft)
export const useFilterIsDirty = () => useFilterStore((s) => s.isDirty)

/** Hitung jumlah filter aktif (selain sort) */
export const useActiveFilterCount = () =>
  useFilterStore((s) => {
    const { q, category, priceMin, priceMax } = s.active
    return [q, category, priceMin, priceMax].filter(Boolean).length
  })
