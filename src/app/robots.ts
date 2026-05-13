import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/env'

/**
 * Dynamic robots.txt — Next.js App Router convention.
 * Accessible at /robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  const url = getAppUrl()

  return {
    rules: [
      {
        // Semua bot: izinkan halaman publik
        userAgent: '*',
        allow: [
          '/',
          '/products',
          '/products/',
        ],
        disallow: [
          '/admin',
          '/admin/',
          '/cart',
          '/checkout',
          '/orders',
          '/wishlist',
          '/profile',
          '/api/',
          '/_next/',
        ],
      },
      {
        // Blokir bot yang agresif / scraper
        userAgent: [
          'AhrefsBot',
          'SemrushBot',
          'DotBot',
          'MJ12bot',
          'BLEXBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: `${url}/sitemap.xml`,
    host: url,
  }
}
