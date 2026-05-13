/**
 * wishlist.service.ts
 *
 * Query Prisma untuk Wishlist — hanya READ.
 */

import { prisma } from '@/lib/prisma'

/**
 * Ambil semua product IDs yang ada di wishlist user.
 * Dipakai untuk inisialisasi WishlistStore.
 */
export async function getWishlistIds(userId: string): Promise<string[]> {
  const items = await prisma.wishlist.findMany({
    where: { userId },
    select: { productId: true },
  })
  return items.map((i) => i.productId)
}

/**
 * Cek apakah satu produk ada di wishlist user.
 */
export async function isProductWishlisted(
  userId: string,
  productId: string
): Promise<boolean> {
  const entry = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  })
  return !!entry
}

/**
 * Ambil wishlist lengkap dengan data produk.
 */
export async function getWishlistWithProducts(userId: string) {
  return prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        include: { category: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}
