'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useTransition, useEffect, useCallback } from 'react'

interface ProductSearchProps {
  defaultValue?: string
  category?: string
  priceMin?: string
  priceMax?: string
  sort?: string
  debounceMs?: number
}

export default function ProductSearch({
  defaultValue,
  category,
  priceMin,
  priceMax,
  sort,
  debounceMs = 400,
}: ProductSearchProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Helper: build URL dengan semua params yang aktif
  const buildUrl = useCallback(
    (q: string) => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (category) params.set('category', category)
      if (priceMin) params.set('priceMin', priceMin)
      if (priceMax) params.set('priceMax', priceMax)
      if (sort && sort !== 'newest') params.set('sort', sort)
      // Reset ke halaman 1 saat search berubah
      const qs = params.toString()
      return `/products${qs ? `?${qs}` : ''}`
    },
    [category, priceMin, priceMax, sort]
  )

  // Debounce: navigate saat user berhenti mengetik
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        router.push(buildUrl(value.trim()))
      })
    }, debounceMs)
  }

  // Submit langsung (Enter / klik search)
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = inputRef.current?.value.trim() ?? ''
    startTransition(() => {
      router.push(buildUrl(q))
    })
  }

  function handleClear() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (inputRef.current) inputRef.current.value = ''
    startTransition(() => {
      router.push(buildUrl(''))
    })
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="relative" role="search">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        defaultValue={defaultValue}
        placeholder="Cari produk..."
        aria-label="Cari produk"
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
      />
      {/* Clear button */}
      {defaultValue && !isPending && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Hapus pencarian"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {/* Loading spinner */}
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="h-4 w-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
    </form>
  )
}
