/**
 * seo.ts
 *
 * Centralized SEO helpers untuk TokoKita.
 * Semua metadata, OG, dan structured data dibuat dari sini.
 */

import type { Metadata } from 'next'
import { getAppUrl } from '@/lib/env'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_NAME = 'TokoKita'
export const SITE_DESCRIPTION =
  'Temukan produk terbaik dengan harga terjangkau di TokoKita. Belanja online aman, cepat, dan terpercaya.'
export const SITE_LOCALE = 'id_ID'
export const SITE_TWITTER = '@tokokita'

// ─────────────────────────────────────────────────────────────────────────────
// BASE METADATA — dipakai di root layout
// ─────────────────────────────────────────────────────────────────────────────

export function buildBaseMetadata(): Metadata {
  const url = getAppUrl()

  return {
    metadataBase: new URL(url),
    title: {
      template: `%s | ${SITE_NAME}`,
      default: `${SITE_NAME} — Belanja Online Terpercaya`,
    },
    description: SITE_DESCRIPTION,
    keywords: [
      'belanja online',
      'toko online',
      'e-commerce',
      'produk murah',
      'tokokita',
      'jual beli online',
    ],
    authors: [{ name: SITE_NAME, url }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: SITE_LOCALE,
      url,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — Belanja Online Terpercaya`,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: `${url}/og-default.png`,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — Belanja Online Terpercaya`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_TWITTER,
      creator: SITE_TWITTER,
      title: `${SITE_NAME} — Belanja Online Terpercaya`,
      description: SITE_DESCRIPTION,
      images: [`${url}/og-default.png`],
    },
    alternates: {
      canonical: url,
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
    },
    verification: {
      // Isi setelah verifikasi Google Search Console
      // google: 'your-google-verification-code',
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE METADATA BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Metadata untuk halaman produk detail.
 */
export function buildProductMetadata(product: {
  name: string
  description: string | null
  image: string | null
  slug: string
  price: number
  category: { name: string }
}): Metadata {
  const url = getAppUrl()
  const pageUrl = `${url}/products/${product.slug}`
  const description = product.description
    ? product.description.slice(0, 160)
    : `Beli ${product.name} dengan harga terbaik di ${SITE_NAME}.`

  return {
    title: product.name,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: 'website',
      url: pageUrl,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      title: `${product.name} | ${SITE_NAME}`,
      description,
      images: product.image
        ? [
            {
              url: product.image,
              width: 800,
              height: 800,
              alt: product.name,
            },
          ]
        : [{ url: `${url}/og-default.png`, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_TWITTER,
      title: `${product.name} | ${SITE_NAME}`,
      description,
      images: product.image ? [product.image] : [`${url}/og-default.png`],
    },
  }
}

/**
 * Metadata untuk halaman kategori / daftar produk.
 */
export function buildProductsMetadata(opts: {
  categoryName?: string
  q?: string
  page?: number
}): Metadata {
  const url = getAppUrl()
  const { categoryName, q, page } = opts

  let title = 'Semua Produk'
  let description = `Temukan ribuan produk pilihan di ${SITE_NAME}. Filter, bandingkan, dan belanja dengan mudah.`

  if (categoryName) {
    title = `Produk ${categoryName}`
    description = `Jelajahi koleksi ${categoryName} terbaik di ${SITE_NAME} dengan harga terjangkau.`
  } else if (q) {
    title = `Hasil pencarian: "${q}"`
    description = `Hasil pencarian untuk "${q}" di ${SITE_NAME}.`
  }

  if (page && page > 1) title = `${title} — Halaman ${page}`

  return {
    title,
    description,
    alternates: {
      canonical: `${url}/products`,
    },
    openGraph: {
      type: 'website',
      url: `${url}/products`,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      title: `${title} | ${SITE_NAME}`,
      description,
    },
    // Halaman filter/search tidak perlu diindex
    robots: q || page
      ? { index: false, follow: true }
      : { index: true, follow: true },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON-LD STRUCTURED DATA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * JSON-LD untuk halaman produk (Product schema).
 * Membantu Google menampilkan rich results (harga, rating, stok).
 */
export function buildProductJsonLd(product: {
  name: string
  description: string | null
  image: string | null
  slug: string
  price: number
  stock: number
  avgRating?: number
  totalReviews?: number
  category: { name: string }
}) {
  const url = getAppUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: product.image ?? undefined,
    url: `${url}/products/${product.slug}`,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    category: product.category.name,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IDR',
      price: product.price,
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
      url: `${url}/products/${product.slug}`,
    },
    ...(product.avgRating && product.totalReviews
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.avgRating.toFixed(1),
            reviewCount: product.totalReviews,
            bestRating: '5',
            worstRating: '1',
          },
        }
      : {}),
  }
}

/**
 * JSON-LD untuk homepage (WebSite + SearchAction schema).
 * Memungkinkan Google menampilkan sitelinks search box.
 */
export function buildWebsiteJsonLd() {
  const url = getAppUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url,
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * JSON-LD untuk BreadcrumbList.
 */
export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * JSON-LD untuk Organization.
 */
export function buildOrganizationJsonLd() {
  const url = getAppUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url,
    logo: `${url}/logo.png`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Indonesian',
    },
  }
}
