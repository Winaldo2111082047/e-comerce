import { Suspense } from 'react'
import HeroSection from '@/components/home/HeroSection'
import CategorySection from '@/components/home/CategorySection'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import PromoSection from '@/components/home/PromoSection'
import { HomeSkeleton } from '@/components/ui/Skeleton'
import { getCachedFeaturedProducts, getCachedCategories } from '@/lib/cache'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Beranda',
  description: 'Temukan produk terbaik dengan harga terjangkau di TokoKita. Belanja online aman, cepat, dan terpercaya.',
  alternates: { canonical: '/' },
}

// Revalidate halaman setiap 10 menit — ISR
export const revalidate = 600

async function HomeContent() {
  const [products, categories] = await Promise.all([
    getCachedFeaturedProducts(8),
    getCachedCategories(6),
  ])

  return (
    <>
      <PromoSection />
      <CategorySection categories={categories} />
      <FeaturedProducts products={products} />
    </>
  )
}

export default function HomePage() {
  return (
    <>
      {/* Hero tidak butuh data — render langsung */}
      <HeroSection />
      {/* Konten yang butuh DB — wrapped Suspense */}
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </>
  )
}
