import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { updateProduct } from '@/app/actions/products'
import ProductForm from '@/components/admin/ProductForm'
import type { Metadata } from 'next'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Edit Produk' }

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ])

  if (!product) notFound()

  // Bind the product id into the action
  const updateProductWithId = updateProduct.bind(null, id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Produk</h1>
        <p className="text-gray-500 text-sm mt-1">{product.name}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <ProductForm action={updateProductWithId} categories={categories} product={product} />
      </div>
    </div>
  )
}
