'use client'

import Link from 'next/link'
import { useState } from 'react'
import { deleteProduct, toggleProductActive } from '@/app/actions/products'
import { toast } from '@/lib/toast'

// Hanya plain serializable fields — tidak pakai Prisma type langsung
interface ProductActionsProps {
  product: {
    id: string
    name: string
    isActive: boolean
  }
}

export default function ProductActions({ product }: ProductActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const result = await deleteProduct(product.id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.productDeleted(product.name)
    }
    setLoading(false)
    setShowConfirm(false)
  }

  async function handleToggle() {
    setLoading(true)
    await toggleProductActive(product.id, !product.isActive)
    toast.productToggled(product.name, !product.isActive)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Toggle active */}
      <button
        onClick={handleToggle}
        disabled={loading}
        title={product.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          product.isActive
            ? 'text-green-600 hover:bg-green-50'
            : 'text-gray-400 hover:bg-gray-100'
        }`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>

      {/* Edit */}
      <Link
        href={`/admin/products/${product.id}/edit`}
        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
        title="Edit"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </Link>

      {/* Delete */}
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        title="Hapus"
        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 mb-2">Hapus Produk?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <strong>{product.name}</strong> akan dihapus permanen dan tidak bisa dikembalikan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
