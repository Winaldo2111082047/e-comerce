import { TableSkeleton } from '@/components/ui/Skeleton'

export default function AdminCategoriesLoading() {
  return <TableSkeleton rows={8} cols={6} />
}
