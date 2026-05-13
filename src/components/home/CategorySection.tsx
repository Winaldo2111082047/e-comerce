import Link from 'next/link'
import type { Category } from '@/generated/prisma/client'

// Emoji map per slug kategori
const categoryIcons: Record<string, string> = {
  elektronik: '💻',
  fashion: '👗',
  'rumah-tangga': '🏠',
  olahraga: '⚽',
  kecantikan: '💄',
  makanan: '🍔',
  buku: '📚',
  mainan: '🧸',
}

const categoryColors: Record<string, string> = {
  elektronik: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30',
  fashion: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/30',
  'rumah-tangga': 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30',
  olahraga: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-100 dark:hover:bg-green-900/30',
  kecantikan: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30',
  makanan: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30',
  buku: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
  mainan: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800 hover:border-red-300 dark:hover:border-red-600 hover:bg-red-100 dark:hover:bg-red-900/30',
}

const defaultColor = 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'

interface CategorySectionProps {
  categories: Category[]
}

export default function CategorySection({ categories }: CategorySectionProps) {
  if (categories.length === 0) return null

  return (
    <section className="bg-white dark:bg-gray-950 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Jelajahi</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Kategori Produk</h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Lihat semua
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const icon = categoryIcons[cat.slug] ?? '🏷️'
            const color = categoryColors[cat.slug] ?? defaultColor
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={`group flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${color}`}
              >
                <span className="text-3xl">{icon}</span>
                <span className="text-xs sm:text-sm font-semibold text-center leading-tight">
                  {cat.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
