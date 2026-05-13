'use server'

import { prisma } from '@/lib/prisma'
import { requireUser, requireOwnerOrAdmin } from '@/lib/auth-guard'
import { ReviewSchema } from '@/lib/definitions'
import { rateLimit, rateLimitMessage } from '@/lib/rate-limit'
import { revalidatePath } from 'next/cache'

export type ReviewFormState =
  | { errors?: Record<string, string[]>; message?: string; success?: boolean }
  | undefined

export async function submitReview(
  productId: string,
  state: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const { userId } = await requireUser()

  // ── Rate limit: 10 review per user per jam ────────────────────────────────
  const rl = rateLimit(userId, 'review')
  if (!rl.allowed) {
    return { message: rateLimitMessage(rl) }
  }

  // ── Validasi productId ────────────────────────────────────────────────────
  if (!productId || typeof productId !== 'string' || productId.length > 50) {
    return { message: 'Produk tidak valid.' }
  }

  // ── Validasi + sanitasi via Zod ───────────────────────────────────────────
  const parsed = ReviewSchema.safeParse({
    rating: formData.get('rating'),
    comment: formData.get('comment'),
  })

  if (!parsed.success) {
    return {
      errors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v ?? []])
      ) as Record<string, string[]>,
    }
  }

  const { rating, comment } = parsed.data

  // ── Pastikan produk ada ───────────────────────────────────────────────────
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    select: { id: true },
  })
  if (!product) return { message: 'Produk tidak ditemukan.' }

  // ── Upsert review ─────────────────────────────────────────────────────────
  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  })

  if (existing) {
    await prisma.review.update({
      where: { id: existing.id },
      data: { rating, comment: comment || null },
    })
  } else {
    await prisma.review.create({
      data: { userId, productId, rating, comment: comment || null },
    })
  }

  revalidatePath(`/products`)
  return { success: true }
}

export async function deleteReview(reviewId: string) {
  // ── Validasi reviewId ─────────────────────────────────────────────────────
  if (!reviewId || typeof reviewId !== 'string' || reviewId.length > 50) {
    return { error: 'Review tidak valid.' }
  }

  const review = await prisma.review.findUnique({ where: { id: reviewId } })
  if (!review) return { error: 'Review tidak ditemukan.' }

  await requireOwnerOrAdmin(review.userId)

  await prisma.review.delete({ where: { id: reviewId } })
  revalidatePath(`/products`)
  return { success: true }
}
