import { createCategory } from '@/app/actions/categories'
import CategoryForm from '@/components/admin/CategoryForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tambah Kategori' }

export default function NewCategoryPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tambah Kategori</h1>
        <p className="text-gray-500 text-sm mt-1">Buat kategori produk baru</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <CategoryForm action={createCategory} />
      </div>
    </div>
  )
}
