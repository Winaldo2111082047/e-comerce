'use client'

/**
 * WishlistStoreInitializer
 *
 * Sync wishlist IDs dari server ke Zustand store.
 * Dipanggil di halaman yang menampilkan produk dengan WishlistButton.
 *
 * Penggunaan:
 * ```tsx
 * // Di products/page.tsx atau wishlist/page.tsx (Server Component)
 * <WishlistStoreInitializer ids={wishlistedIds} />
 * ```
 */

import { useEffect } from 'react'
import { useWishlistStore } from '@/stores/wishlist.store'

interface WishlistStoreInitializerProps {
  ids: string[]
}

export default function WishlistStoreInitializer({ ids }: WishlistStoreInitializerProps) {
  const syncFromServer = useWishlistStore((s) => s.syncFromServer)

  useEffect(() => {
    syncFromServer(ids)
  }, [ids, syncFromServer])

  return null
}
