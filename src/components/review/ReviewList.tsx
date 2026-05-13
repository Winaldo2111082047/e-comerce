'use client'

import { useState, useTransition } from 'react'
import { formatDate } from '@/lib/utils'
import { deleteReview } from '@/app/actions/reviews'
import { toast } from '@/lib/toast'
import StarRating from './StarRating'

interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
  userId: string          // untuk cek kepemilikan
  user: { name: string | null }
}

interface ReviewListProps {
  reviews: ReviewItem[]
  currentUserId?: string  // ID user yang login — tampilkan tombol hapus hanya untuk review miliknya
}

export default function ReviewList({ reviews, currentUserId }: ReviewListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(reviewId: string) {
    setDeletingId(reviewId)
    startTransition(async () => {
      const result = await deleteReview(reviewId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Review dihapus')
      }
      setDeletingId(null)
    })
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-4xl mb-2">💬</p>
        <p className="text-sm">Belum ada review. Jadilah yang pertama!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const isOwner = currentUserId === review.userId
        const isDeleting = deletingId === review.id && isPending

        return (
          <div
            key={review.id}
            className={`bg-gray-50 rounded-2xl p-4 transition-opacity ${isDeleting ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {review.user.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{review.user.name}</p>
                  <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StarRating value={review.rating} size="sm" />
                {isOwner && (
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={isDeleting}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                    aria-label="Hapus review"
                    title="Hapus review"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {review.comment && (
              <p className="mt-3 text-sm text-gray-600 leading-relaxed pl-12">
                {review.comment}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
