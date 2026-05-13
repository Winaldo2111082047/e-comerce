'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
}

interface FilterSidebarProps {
  categories: Category[]
  currentCategory?: string
  currentPriceMin?: string
  currentPriceMax?: string
  q?: string
  sort?: string
}

// Preset harga cepat
const PRICE_PRESETS = [
  { label: 'Di bawah Rp 100rb', min: '', max: '100000' },
  { label: 'Rp 100rb – 500rb',  min: '100000', max: '500000' },
  { label: 'Rp 500rb – 1jt',    min: '500000', max: '1000000' },
  { label: 'Di atas Rp 1jt',    min: '1000000', max: '' },
]

export default function FilterSidebar({
  categories,
  currentCategory,
  currentPriceMin,
  currentPriceMax,
  q,
  sort,
}: FilterSidebarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const minRef = useRef<HTMLInputElement>(null)
  const maxRef = useRef<HTMLInputElement>(null)
  const [priceError, setPriceError] = useState<string | null>(null)

  const hasActiveFilter = !!(currentCategory || currentPriceMin || currentPriceMax || q)

  function buildUrl(overrides: Record<string, string | undefined> = {}) {
    const params = new URLSearchParams()
    const vals = {
      q,
      category: currentCategory,
      priceMin: currentPriceMin,
      priceMax: currentPriceMax,
      sort: sort !== 'newest' ? sort : undefined,
      ...overrides,
    }
    Object.entries(vals).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    return `/products${params.toString() ? `?${params.toString()}` : ''}`
  }

  function applyPriceFilter() {
    const min = minRef.current?.value.trim() ?? ''
    const max = maxRef.current?.value.trim() ?? ''

    if (min && max && Number(min) > Number(max)) {
      setPriceError('Harga minimum tidak boleh lebih besar dari maksimum.')
      return
    }
    setPriceError(null)
    startTransition(() => {
      router.push(buildUrl({ priceMin: min || undefined, priceMax: max || undefined }))
    })
  }

  function clearPriceFilter() {
    if (minRef.current) minRef.current.value = ''
    if (maxRef.current) maxRef.current.value = ''
    setPriceError(null)
    startTransition(() => {
      router.push(buildUrl({ priceMin: undefined, priceMax: undefined }))
    })
  }

  function applyPreset(min: string, max: string) {
    if (minRef.current) minRef.current.value = min
    if (maxRef.current) maxRef.current.value = max
    setPriceError(null)
    startTransition(() => {
      router.push(buildUrl({ priceMin: min || undefined, priceMax: max || undefined }))
    })
  }

  const isPresetActive = (min: string, max: string) =>
    (currentPriceMin ?? '') === min && (currentPriceMax ?? '') === max

  return (
    <div className={`space-y-5 ${isPending ? 'opacity-70 pointer-events-none' : ''}`}>

      {/* Reset semua filter */}
      {hasActiveFilter && (
        <Link
          href="/products"
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reset semua filter
        </Link>
      )}

      {/* ── Kategori ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Kategori
        </p>
        <ul className="space-y-0.5">
          <li>
            <Link
              href={buildUrl({ category: undefined })}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                !currentCategory
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span>Semua Kategori</span>
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={buildUrl({ category: cat.slug })}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                  currentCategory === cat.slug
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span>{cat.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Filter Harga ── */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Harga
          </p>
          {(currentPriceMin || currentPriceMax) && (
            <button
              onClick={clearPriceFilter}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Preset cepat */}
        <div className="space-y-1 mb-3">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.min, preset.max)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                isPresetActive(preset.min, preset.max)
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Input manual */}
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Min</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                <input
                  ref={minRef}
                  type="number"
                  min="0"
                  step="1000"
                  defaultValue={currentPriceMin}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 pl-7 pr-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </div>
            <span className="text-gray-300 mt-4">–</span>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Max</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                <input
                  ref={maxRef}
                  type="number"
                  min="0"
                  step="1000"
                  defaultValue={currentPriceMax}
                  placeholder="∞"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 pl-7 pr-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {priceError && (
            <p className="text-xs text-red-500">{priceError}</p>
          )}

          <button
            onClick={applyPriceFilter}
            className="w-full bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Terapkan Harga
          </button>
        </div>

        {/* Active price display */}
        {(currentPriceMin || currentPriceMax) && (
          <p className="mt-2 text-xs text-blue-600 font-medium">
            {currentPriceMin && currentPriceMax
              ? `${formatRupiah(Number(currentPriceMin))} – ${formatRupiah(Number(currentPriceMax))}`
              : currentPriceMin
              ? `Min ${formatRupiah(Number(currentPriceMin))}`
              : `Maks ${formatRupiah(Number(currentPriceMax))}`}
          </p>
        )}
      </div>
    </div>
  )
}
