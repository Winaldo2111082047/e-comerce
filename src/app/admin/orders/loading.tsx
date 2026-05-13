import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton'

export default function AdminOrdersLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-36" />
      </div>
      {/* Filter tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-xl shrink-0" />
        ))}
      </div>
      <TableSkeleton rows={10} cols={7} />
    </div>
  )
}
