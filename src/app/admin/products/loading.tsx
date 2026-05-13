import { TableSkeleton } from '@/components/ui/Skeleton'

export default function AdminProductsLoading() {
  return <TableSkeleton rows={10} cols={6} />
}
