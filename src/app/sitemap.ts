import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/env'
import { prisma } from '@/lib/prisma'

/**
 * Dynamic sitemap — Next.js App Router convention.
 * Accessible at /sitemap.xml
 *
 * Includes:
 * - Static pages (home, products, login, register)
 * - All active product pages
 * - All category filter pages
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = getAppUrl()
  const now = new Date()

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${url}/products`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${url}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${url}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // ── Product pages ─────────────────────────────────────────────────────────
  let productPages: MetadataRoute.Sitemap = []
  let categoryPages: MetadataRoute.Sitemap = []

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.category.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { name: 'asc' },
      }),
    ])

    productPages = products.map((product) => ({
      url: `${url}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    categoryPages = categories.map((cat) => ({
      url: `${url}/products?category=${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))
  } catch {
    // DB tidak tersedia saat build — kembalikan hanya static pages
  }

  return [...staticPages, ...categoryPages, ...productPages]
}
