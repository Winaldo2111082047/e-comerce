'use client'

import { useRouter } from 'next/navigation'

interface ProductSortProps {
  currentSort?: string
  q?: string
  category?: string
  priceMin?: string
  priceMax?: string
}

const sortOptions = [
  { value: 'newest',     label: 'Terbaru' },
  { value: 'price_asc',  label: 'Harga: Termurah' },
  { value: 'price_desc', label: 'Harga: Termahal' },
  { value: 'name_asc',   label: 'Nama: A–Z' },
]

export default function ProductSort({
  currentSort,
  q,
  category,
  priceMin,
  priceMax,
}: ProductSortProps) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    if (priceMin) params.set('priceMin', priceMin)
    if (priceMax) params.set('priceMax', priceMax)
    if (e.target.value && e.target.value !== 'newest') {
      params.set('sort', e.target.value)
    }
    router.push(`/products?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 hidden sm:block shrink-0">Urutkan:</span>
      <select
        value={currentSort ?? 'newest'}
        onChange={handleChange}
        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
        aria-label="Urutkan produk"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
