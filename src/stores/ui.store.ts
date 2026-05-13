/**
 * ui.store.ts
 *
 * Zustand store untuk UI state global.
 *
 * Menyimpan state UI yang perlu dishare antar komponen:
 * - Mobile filter sidebar open/close
 * - Search overlay state
 * - Toast/notification queue (jika tidak pakai sonner)
 */

import { create } from 'zustand'

interface UIState {
  /** Mobile filter sidebar */
  isMobileFilterOpen: boolean
  openMobileFilter: () => void
  closeMobileFilter: () => void
  toggleMobileFilter: () => void

  /** Search overlay (mobile) */
  isSearchOpen: boolean
  openSearch: () => void
  closeSearch: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isMobileFilterOpen: false,
  openMobileFilter: () => set({ isMobileFilterOpen: true }),
  closeMobileFilter: () => set({ isMobileFilterOpen: false }),
  toggleMobileFilter: () =>
    set((s) => ({ isMobileFilterOpen: !s.isMobileFilterOpen })),

  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
}))

// Selectors
export const useIsMobileFilterOpen = () =>
  useUIStore((s) => s.isMobileFilterOpen)
export const useIsSearchOpen = () => useUIStore((s) => s.isSearchOpen)
