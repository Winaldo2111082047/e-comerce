import { ProductGridSkeleton, Skeleton } from '@/components/ui/Skeleton'

export default function ProductsLoading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="hidden sm:block h-10 w-72 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden md:block w-52 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
              <Skeleton className="h-3 w-16 mb-3" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-xl" />
              ))}
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-9 w-36 rounded-xl" />
            </div>
            <ProductGridSkeleton count={12} />
          </div>
        </div>
      </div>
    </div>
  )
}
