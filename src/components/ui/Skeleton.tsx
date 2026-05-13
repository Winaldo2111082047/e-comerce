import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * Base skeleton block dengan shimmer animation.
 * Tailwind v4: animasi shimmer via CSS custom property.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-gray-200',
        'before:absolute before:inset-0',
        'before:bg-linear-to-r before:from-transparent before:via-white/60 before:to-transparent',
        'before:animate-[shimmer_1.5s_infinite]',
        className
      )}
    />
  )
}

/** Skeleton untuk product card */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Image */}
      <Skeleton className="aspect-square w-full rounded-none" />
      {/* Info */}
      <div className="p-3.5 space-y-2.5">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-24 mt-1" />
      </div>
    </div>
  )
}

/** Skeleton grid produk */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Skeleton halaman detail produk */
export function ProductDetailSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Image */}
        <Skeleton className="aspect-square w-full rounded-none" />
        {/* Info */}
        <div className="p-6 md:p-8 space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-4 w-28" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="pt-4 space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Skeleton row tabel */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <Skeleton className={`h-4 ${i === 0 ? 'w-32' : i === cols - 1 ? 'w-16' : 'w-24'}`} />
        </td>
      ))}
    </tr>
  )
}

/** Skeleton tabel admin */
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-5 py-3">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Skeleton stat card dashboard */
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-8 w-28 mb-1" />
      <Skeleton className="h-3 w-20 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

/** Skeleton dashboard admin */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <Skeleton className="h-5 w-48 mb-1" />
          <Skeleton className="h-3 w-32 mb-6" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <Skeleton className="h-5 w-36 mb-1" />
          <Skeleton className="h-3 w-28 mb-6" />
          <Skeleton className="h-36 w-36 rounded-full mx-auto mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <TableSkeleton rows={5} cols={4} />
    </div>
  )
}

/** Skeleton cart item */
export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-5">
      <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-3 mt-3">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <Skeleton className="h-5 w-20 shrink-0" />
    </div>
  )
}

/** Skeleton order card */
export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="w-12 h-12 rounded-xl" />
        ))}
        <div className="ml-auto space-y-1">
          <Skeleton className="h-3 w-10 ml-auto" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <div className="border-t border-gray-50 pt-3 flex justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

/** Skeleton homepage — untuk Suspense fallback */
export function HomeSkeleton() {
  return (
    <div className="space-y-0">
      {/* PromoSection skeleton */}
      <div className="bg-white dark:bg-gray-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
      {/* CategorySection skeleton */}
      <div className="bg-white dark:bg-gray-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
      {/* FeaturedProducts skeleton */}
      <div className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  )
}
