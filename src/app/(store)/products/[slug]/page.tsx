import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'
import AddToCartButton from '@/components/product/AddToCartButton'
import ProductCard from '@/components/product/ProductCard'
import ProductImage from '@/components/ui/ProductImage'
import WishlistButton from '@/components/product/WishlistButton'
import ReviewForm from '@/components/review/ReviewForm'
import ReviewList from '@/components/review/ReviewList'
import RatingSummary from '@/components/review/RatingSummary'
import StarRating from '@/components/review/StarRating'
import WishlistStoreInitializer from '@/stores/initializers/WishlistStoreInitializer'
import { getProductMetadata, getProductDetail } from '@/services'
import { buildProductMetadata, buildProductJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo'
import { getAppUrl } from '@/lib/env'
import type { Metadata } from 'next'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductMetadata(slug)
  if (!product) return { title: 'Produk tidak ditemukan' }
  return buildProductMetadata({
    name: product.name,
    description: product.description,
    image: product.image,
    slug,
    price: 0,
    category: { name: '' },
  })
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const session = await auth()
  const userId = session?.user?.id

  const data = await getProductDetail(slug, userId)
  if (!data) notFound()

  const {
    product,
    reviews,
    relatedProducts,
    isWishlisted,
    avgRating,
    totalReviews,
    ratingDistribution,
    userReview,
  } = data

  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= 5

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildProductJsonLd({
              name: product.name,
              description: product.description,
              image: product.image,
              slug: product.slug,
              price: Number(product.price),
              stock: product.stock,
              avgRating: totalReviews > 0 ? avgRating : undefined,
              totalReviews: totalReviews > 0 ? totalReviews : undefined,
              category: product.category,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: 'Beranda', url: getAppUrl() },
              { name: 'Produk', url: `${getAppUrl()}/products` },
              { name: product.category.name, url: `${getAppUrl()}/products?category=${product.category.slug}` },
              { name: product.name, url: `${getAppUrl()}/products/${product.slug}` },
            ])
          ),
        }}
      />
      {/* Sync wishlist ke store untuk WishlistButton */}
      <WishlistStoreInitializer ids={isWishlisted ? [product.id] : []} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">Beranda</Link>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/products" className="hover:text-blue-600 transition-colors">Produk</Link>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link
            href={`/products?category=${product.category.slug}`}
            className="hover:text-blue-600 transition-colors"
          >
            {product.category.name}
          </Link>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600 line-clamp-1">{product.name}</span>
        </nav>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* Image */}
            <div className="relative aspect-square bg-gray-50">
              <ProductImage
                src={product.image}
                alt={product.name}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                containerClassName="h-full"
              />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-full">
                    Stok Habis
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-6 md:p-8 flex flex-col gap-5">
              {/* Category + name */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <Link
                    href={`/products?category=${product.category.slug}`}
                    className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {product.category.name}
                  </Link>
                  {/* Wishlist button */}
                  <WishlistButton
                    productId={product.id}
                    initialWishlisted={isWishlisted}
                    isLoggedIn={!!userId}
                    size="lg"
                    className="border border-gray-200 shrink-0"
                  />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>
              </div>

              {/* Price */}
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatRupiah(Number(product.price))}
                </p>
              </div>

              {/* Rating summary inline */}
              {totalReviews > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(avgRating)} size="sm" />
                  <span className="text-sm font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({totalReviews} ulasan)</span>
                </div>
              )}

              {/* Stock status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-orange-500' : 'bg-green-500'}`} />
                <span className={`text-sm font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                  {isOutOfStock
                    ? 'Stok habis'
                    : isLowStock
                    ? `Sisa ${product.stock} item`
                    : `Stok tersedia (${product.stock})`}
                </span>
              </div>

              {/* Description */}
              {product.description && (
                <div className="border-t border-gray-100 pt-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">Deskripsi Produk</h2>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Weight */}
              {product.weight && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  Berat: {product.weight}g
                </div>
              )}

              {/* Add to cart */}
              <div className="border-t border-gray-100 pt-4 mt-auto">
                <AddToCartButton productId={product.id} stock={product.stock} productName={product.name} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Review Section ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              Ulasan Produk
              {totalReviews > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({totalReviews} ulasan)
                </span>
              )}
            </h2>
          </div>

          <div className="p-6 space-y-8">
            {/* Rating summary */}
            {totalReviews > 0 && (
              <RatingSummary
                average={avgRating}
                total={totalReviews}
                distribution={ratingDistribution}
              />
            )}

            {/* Form review */}
            {userId ? (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  {userReview ? 'Perbarui Ulasan Kamu' : 'Tulis Ulasan'}
                </h3>
                <ReviewForm
                  productId={product.id}
                  existingReview={
                    userReview
                      ? { rating: userReview.rating, comment: userReview.comment }
                      : undefined
                  }
                />
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-6 text-center py-8">
                <p className="text-gray-500 text-sm mb-3">
                  Masuk untuk menulis ulasan
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Masuk Sekarang
                </Link>
              </div>
            )}

            {/* List review */}
            {totalReviews > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Semua Ulasan
                </h3>
                <ReviewList
                  reviews={reviews.map((r) => ({
                    id: r.id,
                    rating: r.rating,
                    comment: r.comment,
                    createdAt: r.createdAt,
                    userId: r.user.id,
                    user: { name: r.user.name },
                  }))}
                  currentUserId={userId}
                />
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Produk Serupa</h2>
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Lihat semua →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
