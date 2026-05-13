'use client'

import { useActionState, useState } from 'react'
import { submitReview } from '@/app/actions/reviews'
import StarRating from './StarRating'

interface ReviewFormProps {
  productId: string
  existingReview?: { rating: number; comment: string | null }
  onSuccess?: () => void
}

export default function ReviewForm({ productId, existingReview }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [charCount, setCharCount] = useState(existingReview?.comment?.length ?? 0)

  const boundAction = submitReview.bind(null, productId)
  const [state, action, pending] = useActionState(boundAction, undefined)

  const isEdit = !!existingReview

  return (
    <form action={action} className="space-y-4">
      {state?.message && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}
      {state?.success && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          ✅ Review berhasil {isEdit ? 'diperbarui' : 'dikirim'}!
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        {/* Hidden input untuk form submission */}
        <input type="hidden" name="rating" value={rating} />
        <div className="flex items-center gap-3">
          <StarRating value={rating} onChange={setRating} size="lg" />
          <span className="text-sm text-gray-500">
            {rating === 0 && 'Pilih rating'}
            {rating === 1 && 'Sangat Buruk'}
            {rating === 2 && 'Buruk'}
            {rating === 3 && 'Cukup'}
            {rating === 4 && 'Bagus'}
            {rating === 5 && 'Sangat Bagus'}
          </span>
        </div>
        {state?.errors?.rating && (
          <p className="mt-1 text-xs text-red-600">{state.errors.rating[0]}</p>
        )}
      </div>

      {/* Komentar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
            Komentar <span className="text-gray-400 font-normal">(opsional)</span>
          </label>
          <span className={`text-xs ${charCount > 900 ? 'text-orange-500' : 'text-gray-400'}`}>
            {charCount}/1000
          </span>
        </div>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          maxLength={1000}
          defaultValue={existingReview?.comment ?? ''}
          placeholder="Bagikan pengalamanmu dengan produk ini..."
          onChange={(e) => setCharCount(e.target.value.length)}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
        />
        {state?.errors?.comment && (
          <p className="mt-1 text-xs text-red-600">{state.errors.comment[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || rating === 0}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Mengirim...
          </>
        ) : (
          isEdit ? 'Perbarui Review' : 'Kirim Review'
        )}
      </button>
    </form>
  )
}
