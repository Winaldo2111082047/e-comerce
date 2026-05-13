'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import ProductImage from '@/components/ui/ProductImage'
import { formatRupiah } from '@/lib/utils'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

interface ProductItem {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  image: string | null
  category: { name: string; slug: string }
}

interface InfiniteProductGridProps {
  initialProducts: ProductItem[]
  initialHasNextPage: boolean
  q?: string
  category?: string
  sort?: string
}

export default function InfiniteProductGrid({
  initialProducts,
  initialHasNextPage,
  q,
  category,
  sort,
}: InfiniteProductGridProps) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts)
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasNextPage) return
    setLoading(true)

    const nextPage = page + 1
    const params = new URLSearchParams({ page: String(nextPage) })
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    if (sort) params.set('sort', sort)

    try {
      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error('Fetch failed')
      const json = await res.json()

      // Support both wrapped { success, data } and legacy flat response
      const data = json.success ? json.data : json

      setProducts((prev) => [...prev, ...data.products])
      setPage(nextPage)
      setHasNextPage(data.pagination.hasNextPage)
    } catch {
      // Gagal load — user bisa scroll lagi untuk retry
    } finally {
      setLoading(false)
    }
  }, [loading, hasNextPage, page, q, category, sort])

  // Intersection Observer — trigger loadMore saat sentinel masuk viewport
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '200px' } // Mulai load 200px sebelum sentinel terlihat
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  // Reset saat filter berubah
  useEffect(() => {
    setProducts(initialProducts)
    setPage(1)
    setHasNextPage(initialHasNextPage)
  }, [initialProducts, initialHasNextPage])

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((product) => {
          const isOutOfStock = product.stock === 0
          const isLowStock = product.stock > 0 && product.stock <= 5

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="relative aspect-square bg-gray-50 overflow-hidden">
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="group-hover:scale-105 transition-transform duration-500"
                  containerClassName="h-full"
                />
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                    <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Stok Habis
                    </span>
                  </div>
                )}
                {isLowStock && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      Sisa {product.stock}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3.5">
                <p className="text-xs font-medium text-blue-600 mb-1">{product.category.name}</p>
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2.5 leading-snug group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-base font-bold text-gray-900">
                  {formatRupiah(product.price)}
                </p>
              </div>
            </Link>
          )
        })}

        {/* Loading skeletons */}
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>

      {/* Sentinel — Intersection Observer target */}
      {hasNextPage && (
        <div ref={sentinelRef} className="h-4 mt-4" aria-hidden="true" />
      )}

      {/* End of results */}
      {!hasNextPage && products.length > 0 && (
        <p className="text-center text-sm text-gray-400 mt-8 py-4">
          ✓ Semua produk sudah ditampilkan
        </p>
      )}
    </div>
  )
}
