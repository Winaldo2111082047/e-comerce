import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  itemsPerPage?: number
  // URL params to preserve
  q?: string
  category?: string
  sort?: string
  // Base path — default '/products'
  basePath?: string
}

export function buildPaginationHref(
  page: number,
  basePath = '/products',
  params: { q?: string; category?: string; sort?: string } = {}
) {
  const p = new URLSearchParams()
  if (params.q) p.set('q', params.q)
  if (params.category) p.set('category', params.category)
  if (params.sort && params.sort !== 'newest') p.set('sort', params.sort)
  if (page > 1) p.set('page', String(page))
  const qs = p.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}

/** Build page number array with ellipsis */
function buildPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  q,
  category,
  sort,
  basePath = '/products',
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = buildPages(currentPage, totalPages)
  const params = { q, category, sort }

  const btnBase =
    'inline-flex items-center justify-center h-9 min-w-9 rounded-xl text-sm font-medium transition-colors select-none'

  // Range info
  const from = itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null
  const to = itemsPerPage && totalItems
    ? Math.min(currentPage * itemsPerPage, totalItems)
    : null

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Range info */}
      {from && to && totalItems && (
        <p className="text-sm text-gray-500">
          Menampilkan{' '}
          <span className="font-semibold text-gray-700">{from}–{to}</span>
          {' '}dari{' '}
          <span className="font-semibold text-gray-700">{totalItems}</span> produk
        </p>
      )}

      <nav aria-label="Navigasi halaman" className="flex items-center gap-1.5">
        {/* First */}
        {currentPage > 2 && (
          <Link
            href={buildPaginationHref(1, basePath, params)}
            className={cn(btnBase, 'px-2.5 bg-white border border-gray-200 text-gray-500 hover:bg-gray-50')}
            aria-label="Halaman pertama"
            title="Halaman pertama"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </Link>
        )}

        {/* Prev */}
        {currentPage > 1 ? (
          <Link
            href={buildPaginationHref(currentPage - 1, basePath, params)}
            className={cn(btnBase, 'px-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50')}
            aria-label="Halaman sebelumnya"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <span className={cn(btnBase, 'px-3 bg-white border border-gray-100 text-gray-300 cursor-not-allowed')}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </span>
        )}

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === '...' ? (
            <span
              key={`ellipsis-${i}`}
              className={cn(btnBase, 'text-gray-400 cursor-default')}
            >
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildPaginationHref(p, basePath, params)}
              className={cn(
                btnBase,
                p === currentPage
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 pointer-events-none'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300'
              )}
              aria-current={p === currentPage ? 'page' : undefined}
              aria-label={`Halaman ${p}`}
            >
              {p}
            </Link>
          )
        )}

        {/* Next */}
        {currentPage < totalPages ? (
          <Link
            href={buildPaginationHref(currentPage + 1, basePath, params)}
            className={cn(btnBase, 'px-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50')}
            aria-label="Halaman berikutnya"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <span className={cn(btnBase, 'px-3 bg-white border border-gray-100 text-gray-300 cursor-not-allowed')}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}

        {/* Last */}
        {currentPage < totalPages - 1 && (
          <Link
            href={buildPaginationHref(totalPages, basePath, params)}
            className={cn(btnBase, 'px-2.5 bg-white border border-gray-200 text-gray-500 hover:bg-gray-50')}
            aria-label="Halaman terakhir"
            title="Halaman terakhir"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </nav>

      {/* Page indicator */}
      <p className="text-xs text-gray-400">
        Halaman {currentPage} dari {totalPages}
      </p>
    </div>
  )
}
