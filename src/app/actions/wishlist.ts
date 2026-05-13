'use server'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'

export async function toggleWishlist(productId: string) {
  const { userId } = await requireUser()

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  })

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } })
    revalidatePath('/wishlist')
    return { wishlisted: false }
  } else {
    await prisma.wishlist.create({ data: { userId, productId } })
    revalidatePath('/wishlist')
    return { wishlisted: true }
  }
}

export async function getWishlistIds(userId: string): Promise<string[]> {
  const items = await prisma.wishlist.findMany({
    where: { userId },
    select: { productId: true },
  })
  return items.map((i) => i.productId)
}
