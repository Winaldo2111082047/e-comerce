import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { updateCategory } from '@/app/actions/categories'
import CategoryForm from '@/components/admin/CategoryForm'
import type { Metadata } from 'next'

interface EditCategoryPageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Edit Kategori' }

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) notFound()

  const updateCategoryWithId = updateCategory.bind(null, id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Kategori</h1>
        <p className="text-gray-500 text-sm mt-1">{category.name}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <CategoryForm action={updateCategoryWithId} category={category} />
      </div>
    </div>
  )
}
