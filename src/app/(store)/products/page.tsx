import { auth } from '@/lib/auth'
import ProductCard from '@/components/product/ProductCard'
import ProductSearch from '@/components/product/ProductSearch'
import ProductSort from '@/components/product/ProductSort'
import FilterSidebar from '@/components/product/FilterSidebar'
import Pagination from '@/components/ui/Pagination'
import WishlistStoreInitializer from '@/stores/initializers/WishlistStoreInitializer'
import Link from 'next/link'
import { getProducts, getActiveCategories, getWishlistIds } from '@/services'
import { buildProductsMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const { q, category, page } = await searchParams
  const categories = category ? await getActiveCategories() : []
  const categoryName = category
    ? categories.find((c) => c.slug === category)?.name
    : undefined
  return buildProductsMetadata({
    categoryName,
    q,
    page: page ? Number(page) : undefined,
  })
}

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    page?: string
    sort?: string
    priceMin?: string
    priceMax?: string
  }>
}

const ITEMS_PER_PAGE = 12

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { q, category, page, sort, priceMin, priceMax } = await searchParams
  const currentPage = Math.max(1, Number(page) || 1)

  const session = await auth()
  const userId = session?.user?.id

  const [{ products, total, totalPages }, categories, wishlistedIds] = await Promise.all([
    getProducts({
      q,
      category,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      sort,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    }),
    getActiveCategories(),
    userId ? getWishlistIds(userId) : Promise.resolve([]),
  ])

  const hasFilter = !!(q || category || priceMin || priceMax)
  const skip = (currentPage - 1) * ITEMS_PER_PAGE

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Sync wishlist IDs ke store — WishlistButton akan pakai ini */}
      <WishlistStoreInitializer ids={wishlistedIds} />
      {/* Page header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {category
                  ? categories.find((c) => c.slug === category)?.name ?? 'Produk'
                  : q
                  ? `Hasil: "${q}"`
                  : 'Semua Produk'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {total} produk ditemukan
                {hasFilter && (
                  <Link href="/products" className="ml-2 text-blue-600 hover:underline text-xs">
                    (reset filter)
                  </Link>
                )}
              </p>
            </div>
            {/* Search — desktop */}
            <div className="hidden sm:block w-72">
              <ProductSearch
                defaultValue={q}
                category={category}
                priceMin={priceMin}
                priceMax={priceMax}
                sort={sort}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search — mobile */}
        <div className="sm:hidden mb-4">
          <ProductSearch
            defaultValue={q}
            category={category}
            priceMin={priceMin}
            priceMax={priceMax}
            sort={sort}
          />
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar — desktop ── */}
          <aside className="hidden md:block w-56 shrink-0">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sticky top-24">
              <FilterSidebar
                categories={categories}
                currentCategory={category}
                currentPriceMin={priceMin}
                currentPriceMax={priceMax}
                q={q}
                sort={sort}
              />
            </div>
          </aside>

          {/* ── Main ── */}
          <div className="flex-1 min-w-0">
            {/* Category chips — mobile */}
            <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-4">
              <Link
                href={q ? `/products?q=${q}` : '/products'}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                Semua
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}${q ? `&q=${q}` : ''}`}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    category === cat.slug
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            {/* Sort bar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 hidden sm:block">
                {total > 0 ? (
                  <>
                    Menampilkan{' '}
                    <span className="font-semibold text-gray-700">
                      {skip + 1}–{Math.min(skip + ITEMS_PER_PAGE, total)}
                    </span>{' '}
                    dari <span className="font-semibold text-gray-700">{total}</span> produk
                  </>
                ) : null}
              </p>
              <ProductSort
                currentSort={sort}
                q={q}
                category={category}
                priceMin={priceMin}
                priceMax={priceMax}
              />
            </div>

            {/* Grid */}
            {products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg font-semibold text-gray-700">Produk tidak ditemukan</p>
                <p className="text-sm text-gray-400 mt-1 mb-2">
                  {q && `Tidak ada hasil untuk "${q}"`}
                  {!q && 'Coba ubah filter atau kategori'}
                </p>
                {hasFilter && (
                  <p className="text-sm text-gray-400 mb-6">
                    Filter aktif:{' '}
                    {[
                      q && `Kata kunci: "${q}"`,
                      category && `Kategori: ${categories.find((c) => c.slug === category)?.name}`,
                      priceMin && `Min: Rp${Number(priceMin).toLocaleString('id-ID')}`,
                      priceMax && `Maks: Rp${Number(priceMax).toLocaleString('id-ID')}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Reset Semua Filter
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    wishlistedIds={wishlistedIds}
                    isLoggedIn={!!userId}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={ITEMS_PER_PAGE}
                  q={q}
                  category={category}
                  sort={sort}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
