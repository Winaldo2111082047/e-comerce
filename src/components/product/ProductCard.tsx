import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'
import ProductImage from '@/components/ui/ProductImage'
import WishlistButton from '@/components/product/WishlistButton'
import type { Product, Category } from '@/generated/prisma/client'

interface ProductCardProps {
  product: Product & { category: Category }
  wishlistedIds?: string[]   // set of product IDs yang sudah di-wishlist user
  isLoggedIn?: boolean
}

export default function ProductCard({
  product,
  wishlistedIds = [],
  isLoggedIn = false,
}: ProductCardProps) {
  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= 5
  const isWishlisted = wishlistedIds.includes(product.id)

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:shadow-gray-200/60 dark:hover:shadow-gray-900/60 hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 dark:bg-gray-800 overflow-hidden">
        <ProductImage
          src={product.image}
          alt={product.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="group-hover:scale-105 transition-transform duration-500"
          containerClassName="h-full"
        />

        {/* Wishlist button — top right */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <WishlistButton
            productId={product.id}
            initialWishlisted={isWishlisted}
            isLoggedIn={isLoggedIn}
            size="sm"
          />
        </div>

        {/* Badges */}
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

      {/* Info */}
      <div className="p-3.5">
        <p className="text-xs font-medium text-blue-600 mb-1">{product.category.name}</p>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 mb-2.5 leading-snug group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-base font-bold text-gray-900 dark:text-white">
          {formatRupiah(Number(product.price))}
        </p>
      </div>
    </Link>
  )
}
