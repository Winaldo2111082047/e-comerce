/**
 * product.service.ts
 *
 * Semua query Prisma yang berhubungan dengan Product.
 * Dipanggil dari Server Components (page.tsx) dan generateMetadata.
 *
 * Prinsip:
 * - Hanya READ queries — mutasi tetap di Server Actions
 * - Setiap fungsi punya return type yang jelas
 * - Gunakan select/include yang minimal (ambil hanya yang dibutuhkan)
 */

import { prisma } from '@/lib/prisma'
import type { Category, Product } from '@/generated/prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ProductWithCategory = Product & { category: Category }

export type ProductListItem = {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  image: string | null
  isActive: boolean
  category: { name: string; slug: string }
}

export type ProductDetail = ProductWithCategory & {
  reviews: {
    id: string
    rating: number
    comment: string | null
    createdAt: Date
    user: { id: string; name: string }
  }[]
  relatedProducts: ProductWithCategory[]
  avgRating: number
  totalReviews: number
  ratingDistribution: Record<number, number>
}

export type ProductMetadata = {
  name: string
  description: string | null
  image: string | null
} | null

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ambil metadata produk untuk generateMetadata().
 * Hanya select field yang dibutuhkan — lebih efisien.
 */
export async function getProductMetadata(slug: string): Promise<ProductMetadata> {
  return prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true, image: true },
  })
}

/**
 * Ambil detail produk lengkap beserta reviews dan produk terkait.
 * Menggabungkan 3 query terpisah menjadi satu fungsi yang kohesif.
 */
export async function getProductDetail(
  slug: string,
  userId?: string
): Promise<{
  product: ProductWithCategory
  reviews: ProductDetail['reviews']
  relatedProducts: ProductWithCategory[]
  isWishlisted: boolean
  avgRating: number
  totalReviews: number
  ratingDistribution: Record<number, number>
  userReview: ProductDetail['reviews'][number] | undefined
} | null> {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: { category: true },
  })

  if (!product) return null

  // Jalankan semua query paralel — lebih cepat dari sequential
  const [reviews, relatedProducts, wishlistEntry] = await Promise.all([
    prisma.review.findMany({
      where: { productId: product.id },
      // Select hanya field yang dibutuhkan — hindari ambil semua kolom
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // batasi jumlah review yang di-load
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId,
        NOT: { id: product.id },
      },
      include: { category: true },
      take: 4,
      orderBy: { createdAt: 'desc' },
    }),
    userId
      ? prisma.wishlist.findUnique({
          where: { userId_productId: { userId, productId: product.id } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ])

  const totalReviews = reviews.length
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

  const ratingDistribution = [1, 2, 3, 4, 5].reduce(
    (acc, star) => {
      acc[star] = reviews.filter((r) => r.rating === star).length
      return acc
    },
    {} as Record<number, number>
  )

  const userReview = userId ? reviews.find((r) => r.user.id === userId) : undefined

  return {
    product,
    reviews,
    relatedProducts,
    isWishlisted: !!wishlistEntry,
    avgRating,
    totalReviews,
    ratingDistribution,
    userReview,
  }
}

/**
 * Ambil semua produk untuk admin — dengan kategori.
 */
export async function getAdminProducts(): Promise<ProductWithCategory[]> {
  return prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Ambil produk untuk halaman products dengan filter & pagination.
 */
export interface GetProductsOptions {
  q?: string
  category?: string
  priceMin?: number
  priceMax?: number
  sort?: string
  page?: number
  limit?: number
}

export async function getProducts(options: GetProductsOptions = {}): Promise<{
  products: ProductWithCategory[]
  total: number
  totalPages: number
}> {
  const { q, category, priceMin, priceMax, sort, page = 1, limit = 12 } = options
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
}

function buildOrderBy(sort?: string) {
  switch (sort) {
    case 'price_asc':  return { price: 'asc' as const }
    case 'price_desc': return { price: 'desc' as const }
    case 'name_asc':   return { name: 'asc' as const }
    default:           return { createdAt: 'desc' as const }
  }
}

/**
 * Ambil produk featured untuk homepage.
 */
export async function getFeaturedProducts(limit = 8): Promise<ProductWithCategory[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
