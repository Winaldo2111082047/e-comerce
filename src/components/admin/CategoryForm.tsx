'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { FormState } from '@/lib/definitions'
import type { Category } from '@/generated/prisma/client'

interface CategoryFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  category?: Category
}

export default function CategoryForm({ action, category }: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const isEdit = !!category

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      {state?.message && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nama Kategori <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          defaultValue={category?.name}
          placeholder="Contoh: Elektronik"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {state?.errors?.name && (
          <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
        <textarea
          name="description"
          defaultValue={category?.description ?? ''}
          rows={3}
          placeholder="Deskripsi singkat kategori..."
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {pending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Kategori'}
        </button>
        <Link
          href="/admin/categories"
          className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Batal
        </Link>
      </div>
    </form>
  )
}
