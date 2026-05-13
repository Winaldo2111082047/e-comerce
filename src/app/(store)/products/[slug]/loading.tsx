import { ProductDetailSkeleton, ProductGridSkeleton, Skeleton } from '@/components/ui/Skeleton'

export default function ProductDetailLoading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              {i < 3 && <Skeleton className="h-3 w-3 rounded-full" />}
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="mb-8">
          <ProductDetailSkeleton />
        </div>

        {/* Related products */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-20" />
          </div>
          <ProductGridSkeleton count={4} />
        </div>
      </div>
    </div>
  )
}
