import { Skeleton } from '@/components/ui/Skeleton'

export default function OrderDetailLoading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-44" />
          </div>
        </div>

        <div className="space-y-5">
          {/* Status tracker */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="flex items-center gap-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="flex items-center w-full">
                    {i > 0 && <Skeleton className="flex-1 h-1 rounded-none" />}
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    {i < 4 && <Skeleton className="flex-1 h-1 rounded-none" />}
                  </div>
                  <Skeleton className="h-3 w-14 mt-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-5">
                  <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-20 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Address & Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <Skeleton className="h-5 w-36" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className={`h-4 ${j === 0 ? 'w-3/4' : 'w-full'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
