import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'
import ProductImage from '@/components/ui/ProductImage'
import WishlistButton from '@/components/product/WishlistButton'
import WishlistStoreInitializer from '@/stores/initializers/WishlistStoreInitializer'
import { getWishlistWithProducts, getWishlistIds } from '@/services'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wishlist Saya',
  robots: { index: false, follow: false },
}

export default async function WishlistPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [wishlistItems, wishlistedIds] = await Promise.all([
    getWishlistWithProducts(session.user.id),
    getWishlistIds(session.user.id),
  ])

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sync wishlist IDs ke store */}
      <WishlistStoreInitializer ids={wishlistedIds} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wishlist Saya</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {wishlistItems.length} produk tersimpan
            </p>
          </div>
          {wishlistItems.length > 0 && (
            <Link
              href="/products"
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Lanjut belanja →
            </Link>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-20 px-4">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="h-10 w-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Wishlist masih kosong</h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto">
              Simpan produk favoritmu agar mudah ditemukan nanti.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Jelajahi Produk
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {wishlistItems.map(({ product }) => {
              const isOutOfStock = product.stock === 0
              const isLowStock = product.stock > 0 && product.stock <= 5

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                >
                  {/* Image */}
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-xs font-medium text-blue-600 mb-1">
                      {product.category.name}
                    </p>
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-base font-bold text-gray-900 mb-3">
                      {formatRupiah(Number(product.price))}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/products/${product.slug}`}
                        className="flex-1 text-center bg-blue-600 text-white text-sm font-semibold py-2 rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        {isOutOfStock ? 'Lihat Produk' : 'Beli Sekarang'}
                      </Link>
                      <WishlistButton
                        productId={product.id}
                        initialWishlisted={wishlistedIds.includes(product.id)}
                        isLoggedIn={true}
                        size="md"
                        className="border border-gray-200 hover:border-red-200"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
