/**
 * cache.ts
 *
 * Centralized caching strategy untuk TokoKita.
 * Menggunakan Next.js `unstable_cache` untuk server-side caching
 * dengan revalidation berbasis tag.
 *
 * Cache Tags:
 * - 'products'    → semua query produk
 * - 'categories'  → semua query kategori
 * - 'product-[slug]' → detail produk spesifik
 * - 'reviews'     → semua review
 */

import { unstable_cache, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { GetProductsOptions } from '@/services/product.service'

// ─────────────────────────────────────────────────────────────────────────────
// CACHE DURATIONS (seconds)
// ─────────────────────────────────────────────────────────────────────────────

export const CACHE_TTL = {
  /** Kategori jarang berubah — cache 1 jam */
  categories: 3600,
  /** Daftar produk — cache 5 menit */
  products: 300,
  /** Detail produk — cache 10 menit */
  productDetail: 600,
  /** Homepage featured — cache 10 menit */
  featured: 600,
  /** Review — cache 2 menit */
  reviews: 120,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// CACHED QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kategori aktif — di-cache 1 jam, revalidate saat kategori berubah.
 */
export const getCachedCategories = unstable_cache(
  async (limit?: number) => {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      ...(limit ? { take: limit } : {}),
    })
  },
  ['active-categories'],
  {
    revalidate: CACHE_TTL.categories,
    tags: ['categories'],
  }
)

/**
 * Featured products untuk homepage — di-cache 10 menit.
 */
export const getCachedFeaturedProducts = unstable_cache(
  async (limit = 8) => {
    return prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  },
  ['featured-products'],
  {
    revalidate: CACHE_TTL.featured,
    tags: ['products'],
  }
)

/**
 * Metadata produk untuk generateMetadata — di-cache 10 menit.
 */
export const getCachedProductMetadata = unstable_cache(
  async (slug: string) => {
    return prisma.product.findUnique({
      where: { slug },
      select: { name: true, description: true, image: true },
    })
  },
  ['product-metadata'],
  {
    revalidate: CACHE_TTL.productDetail,
    tags: ['products'],
  }
)

/**
 * Daftar produk dengan filter — cache key unik per kombinasi filter.
 */
export function getCachedProducts(options: GetProductsOptions) {
  const {
    q = '',
    category = '',
    priceMin,
    priceMax,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = options

  const cacheKey = `products-${q}-${category}-${priceMin ?? ''}-${priceMax ?? ''}-${sort}-${page}-${limit}`

  return unstable_cache(
    async () => {
      const skip = (page - 1) * limit
      const where = {
        isActive: true,
        ...(q && {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
          ],
        }),
        ...(category && { category: { slug: category } }),
        ...((priceMin !== undefined || priceMax !== undefined) && {
          price: {
            ...(priceMin !== undefined && { gte: priceMin }),
            ...(priceMax !== undefined && { lte: priceMax }),
          },
        }),
      }

      const orderBy = buildOrderBy(sort)

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { category: true },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ])

      return { products, total, totalPages: Math.ceil(total / limit) }
    },
    [cacheKey],
    {
      revalidate: CACHE_TTL.products,
      tags: ['products'],
    }
  )()
}

function buildOrderBy(sort?: string) {
  switch (sort) {
    case 'price_asc':  return { price: 'asc' as const }
    case 'price_desc': return { price: 'desc' as const }
    case 'name_asc':   return { name: 'asc' as const }
    default:           return { createdAt: 'desc' as const }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CACHE INVALIDATION HELPERS
// Dipanggil dari Server Actions setelah mutasi data.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Invalidate semua cache yang berhubungan dengan produk.
 * Panggil setelah create/update/delete produk.
 */
export async function revalidateProductCache(slug?: string) {
  revalidateTag('products')
  if (slug) revalidateTag(`product-${slug}`)
}

export async function revalidateCategoryCache() {
  revalidateTag('categories')
  revalidateTag('products')
}

export async function revalidateReviewCache(productSlug?: string) {
  revalidateTag('reviews')
  if (productSlug) revalidateTag(`product-${productSlug}`)
}
