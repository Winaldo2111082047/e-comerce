'use client'

/**
 * CartStoreInitializer
 *
 * Komponen ini menerima cartCount dari Server Component (Navbar.tsx)
 * dan menginisialisasi Zustand cart store.
 *
 * Pattern ini diperlukan karena:
 * - Zustand store hanya bisa diakses di Client Components
 * - Data awal (cartCount) harus dari server untuk SSR yang benar
 * - useRef memastikan sync hanya terjadi sekali per mount, bukan setiap render
 *
 * Penggunaan:
 * ```tsx
 * // Di Navbar.tsx (Server Component)
 * <CartStoreInitializer count={cartCount} />
 * ```
 */

import { useEffect, useRef } from 'react'
import { useCartStore } from '@/stores/cart.store'

interface CartStoreInitializerProps {
  count: number
}

export default function CartStoreInitializer({ count }: CartStoreInitializerProps) {
  const setCount = useCartStore((s) => s.setCount)
  const initialized = useRef(false)

  useEffect(() => {
    // Selalu sync dari server saat komponen mount
    // (bisa berubah jika user buka tab lain)
    setCount(count)
    initialized.current = true
  }, [count, setCount])

  // Komponen ini tidak render apapun
  return null
}
