/**
 * stores/index.ts
 *
 * Barrel export untuk semua Zustand stores.
 * Import dari sini untuk konsistensi:
 *
 * @example
 * import { useCartStore, useCartCount } from '@/stores'
 * import { useWishlistStore, useIsWishlisted } from '@/stores'
 * import { useFilterStore, useActiveFilters } from '@/stores'
 */

// Cart
export { useCartStore, useCartCount } from './cart.store'

// Wishlist
export {
  useWishlistStore,
  useWishlistCount,
  useIsWishlisted,
} from './wishlist.store'

// Filters
export {
  useFilterStore,
  useActiveFilters,
  useDraftFilters,
  useFilterIsDirty,
  useActiveFilterCount,
} from './filter.store'

// UI
export {
  useUIStore,
  useIsMobileFilterOpen,
  useIsSearchOpen,
} from './ui.store'
