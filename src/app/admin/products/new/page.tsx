import { prisma } from '@/lib/prisma'
import { createProduct } from '@/app/actions/products'
import ProductForm from '@/components/admin/ProductForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tambah Produk' }

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tambah Produk</h1>
        <p className="text-gray-500 text-sm mt-1">Isi detail produk baru</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <ProductForm action={createProduct} categories={categories} />
      </div>
    </div>
  )
}
