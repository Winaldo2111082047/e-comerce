'use client'

import { useActionState, useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ProductSchema, type FormState } from '@/lib/definitions'
import type { Category, Product } from '@/generated/prisma/client'

interface ProductFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  categories: Category[]
  product?: Product
}

// Validasi satu field secara client-side
function validateField(name: string, value: string): string | null {
  const partial: Record<string, unknown> = {
    name: 'placeholder',
    description: 'placeholder placeholder placeholder placeholder',
    price: 1,
    stock: 0,
    categoryId: 'placeholder',
  }
  partial[name] = name === 'price' || name === 'stock' ? Number(value) : value

  const result = ProductSchema.safeParse(partial)
  if (result.success) return null

  const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>
  return fieldErrors[name]?.[0] ?? null
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ProductForm({ action, categories, product }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [preview, setPreview] = useState<string | null>(product?.image ?? null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [clientErrors, setClientErrors] = useState<Record<string, string | null>>({})
  const [charCount, setCharCount] = useState(product?.description?.length ?? 0)
  const fileRef = useRef<HTMLInputElement>(null)
  const isEdit = !!product

  // Sync server errors ke client errors saat pertama kali
  useEffect(() => {
    if (state?.errors) {
      const mapped: Record<string, string | null> = {}
      for (const [k, v] of Object.entries(state.errors)) {
        mapped[k] = v?.[0] ?? null
      }
      setClientErrors(mapped)
    }
  }, [state])

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    const error = validateField(name, value)
    setClientErrors((prev) => ({ ...prev, [name]: error }))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    if (name === 'description') setCharCount(value.length)
    // Clear error saat user mulai mengetik
    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi tipe file
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Format tidak didukung. Gunakan JPG, PNG, atau WebP.')
      e.target.value = ''
      return
    }
    // Validasi ukuran
    if (file.size > MAX_FILE_SIZE) {
      setImageError('Ukuran file maksimal 5MB.')
      e.target.value = ''
      return
    }

    setImageError(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  function handleRemoveImage() {
    setPreview(null)
    setImageError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  // Gabungkan error: client-side override server-side
  function getError(field: string): string | null {
    const serverErrors = state?.errors as Record<string, string[] | undefined> | undefined
    return clientErrors[field] ?? serverErrors?.[field]?.[0] ?? null
  }

  const inputClass = (field: string) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
      getError(field)
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100'
    }`

  return (
    <form action={formAction} className="space-y-6">
      {/* Global error */}
      {state?.message && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: main fields ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              defaultValue={product?.name}
              placeholder="Contoh: Smartphone Android 5G"
              className={inputClass('name')}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            {getError('name') && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {getError('name')}
              </p>
            )}
          </div>

          {/* Deskripsi */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Deskripsi <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${charCount < 20 ? 'text-red-500' : 'text-gray-400'}`}>
                {charCount}/2000 {charCount < 20 && `(min. 20)`}
              </span>
            </div>
            <textarea
              name="description"
              defaultValue={product?.description ?? ''}
              rows={4}
              placeholder="Deskripsikan produk secara detail (minimal 20 karakter)..."
              className={`${inputClass('description')} resize-none`}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            {getError('description') && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {getError('description')}
              </p>
            )}
          </div>

          {/* Harga & Stok */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Harga (Rp) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Rp</span>
                <input
                  name="price"
                  type="number"
                  min="1"
                  step="100"
                  defaultValue={product ? Number(product.price) : ''}
                  placeholder="50000"
                  className={`${inputClass('price')} pl-9`}
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </div>
              {getError('price') && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {getError('price')}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Stok <span className="text-red-500">*</span>
              </label>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={product?.stock ?? 0}
                className={inputClass('stock')}
                onBlur={handleBlur}
                onChange={handleChange}
              />
              {getError('stock') && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {getError('stock')}
                </p>
              )}
            </div>
          </div>

          {/* Kategori & Berat */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                defaultValue={product?.categoryId ?? ''}
                className={`${inputClass('categoryId')} bg-white`}
                onBlur={handleBlur}
                onChange={handleChange}
              >
                <option value="">Pilih kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {getError('categoryId') && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {getError('categoryId')}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Berat (gram)
              </label>
              <input
                name="weight"
                type="number"
                min="0"
                defaultValue={product?.weight ?? ''}
                placeholder="500"
                className={inputClass('weight')}
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* ── Right: image upload ── */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Gambar Produk {!isEdit && <span className="text-red-500">*</span>}
            </label>

            <div
              onClick={() => fileRef.current?.click()}
              className={`relative aspect-square rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-colors group ${
                imageError
                  ? 'border-red-400 bg-red-50'
                  : preview
                  ? 'border-blue-300 bg-blue-50/20'
                  : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30'
              }`}
            >
              {preview ? (
                <>
                  <Image src={preview} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-semibold">Ganti Gambar</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 p-4">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Klik untuk upload</p>
                  <p className="text-xs text-center">JPG, PNG, WebP · Maks. 5MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {imageError && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {imageError}
              </p>
            )}

            {preview && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus gambar
              </button>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700 space-y-1.5">
            <p className="font-semibold">Tips Gambar Produk:</p>
            <p>• Rasio 1:1 (persegi) — tampil lebih rapi</p>
            <p>• Resolusi minimal 500×500px</p>
            <p>• Format: JPG, PNG, atau WebP</p>
            <p>• Ukuran maks: 5MB</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={pending || !!imageError}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Menyimpan...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
            </>
          )}
        </button>
        <Link
          href="/admin/products"
          className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Batal
        </Link>
      </div>
    </form>
  )
}
