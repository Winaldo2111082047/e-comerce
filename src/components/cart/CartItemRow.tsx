'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { formatRupiah } from '@/lib/utils'
import { updateCartItem, removeFromCart } from '@/app/actions/cart'
import { toast } from '@/lib/toast'
import { useCartStore } from '@/stores/cart.store'

// Plain serializable type — tidak pakai Prisma Decimal
export interface CartItemData {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    stock: number
    image: string | null
    categoryName: string
  }
}

interface CartItemRowProps {
  item: CartItemData
}

export default function CartItemRow({ item }: CartItemRowProps) {
  const [quantity, setQuantity] = useState(item.quantity)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const { decrement } = useCartStore()

  function handleQuantityChange(newQty: number) {
    if (newQty < 1 || newQty > item.product.stock) return
    setError(null)
    setQuantity(newQty)
    startTransition(async () => {
      const result = await updateCartItem(item.id, newQty)
      if (result?.error) {
        setError(result.error)
        setQuantity(item.quantity)
        toast.error(result.error)
      } else {
        toast.cartUpdated()
      }
    })
  }

  function handleRemove() {
    startTransition(async () => {
      await removeFromCart(item.id)
      // Update cart badge di navbar secara instan
      decrement()
      toast.removeFromCartSuccess()
    })
  }

  const subtotal = item.product.price * quantity

  return (
    <div className={`flex gap-4 p-5 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
      {/* Image */}
      <Link href={`/products/${item.product.slug}`} className="shrink-0">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
          {item.product.image ? (
            <Image
              src={item.product.image}
              alt={item.product.name}
              fill
              sizes="96px"
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-blue-600 font-medium mb-0.5">{item.product.categoryName}</p>
        <Link
          href={`/products/${item.product.slug}`}
          className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors line-clamp-2 text-sm sm:text-base"
        >
          {item.product.name}
        </Link>
        <p className="text-sm text-gray-500 mt-1">
          {formatRupiah(item.product.price)} / pcs
        </p>

        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 mt-3">
          {/* Quantity */}
          <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isPending || quantity <= 1}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors text-lg font-medium"
              aria-label="Kurangi"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-semibold text-gray-900">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isPending || quantity >= item.product.stock}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors text-lg font-medium"
              aria-label="Tambah"
            >
              +
            </button>
          </div>

          {/* Remove */}
          <button
            onClick={handleRemove}
            disabled={isPending}
            className="flex items-center gap-1 text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus
          </button>
        </div>
      </div>

      {/* Subtotal */}
      <div className="shrink-0 text-right">
        <p className="font-bold text-gray-900">{formatRupiah(subtotal)}</p>
        {quantity > 1 && (
          <p className="text-xs text-gray-400 mt-0.5">{quantity}× {formatRupiah(item.product.price)}</p>
        )}
      </div>
    </div>
  )
}
