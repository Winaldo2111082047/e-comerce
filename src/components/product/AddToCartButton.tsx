'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { addToCart } from '@/app/actions/cart'
import { toast } from '@/lib/toast'
import { useCartStore } from '@/stores/cart.store'

interface AddToCartButtonProps {
  productId: string
  stock: number
  productName?: string
}

export default function AddToCartButton({ productId, stock, productName }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { increment } = useCartStore()

  async function handleAddToCart() {
    setLoading(true)
    try {
      const result = await addToCart(productId, quantity)
      if (result?.error) {
        toast.addToCartError(result.error)
      } else {
        toast.addToCartSuccess(productName)
        // Update cart badge di navbar secara instan — tanpa router.refresh()
        increment()
        router.refresh()
      }
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (stock === 0) {
    return (
      <Button variant="secondary" disabled className="w-full">
        Stok Habis
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Jumlah:</span>
        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Kurangi jumlah"
          >
            −
          </button>
          <span className="px-4 py-2 text-sm font-medium min-w-12 text-center text-gray-900 dark:text-white">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Tambah jumlah"
          >
            +
          </button>
        </div>
      </div>

      <Button onClick={handleAddToCart} loading={loading} size="lg" className="w-full">
        Tambah ke Keranjang
      </Button>
    </div>
  )
}
