/**
 * cart.service.ts
 *
 * Query Prisma untuk Cart — hanya READ.
 * Mutasi (add, update, remove) tetap di Server Actions.
 */

import { prisma } from '@/lib/prisma'

export type CartWithItems = {
  id: string
  items: {
    id: string
    quantity: number
    product: {
      id: string
      name: string
      slug: string
      price: number
      stock: number
      image: string | null
      category: { name: string }
    }
  }[]
}

/**
 * Ambil cart user beserta items dan produk.
 * Serialize Decimal → number untuk Client Components.
 */
export async function getCartWithItems(userId: string): Promise<CartWithItems | null> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: { category: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!cart) return null

  return {
    id: cart.id,
    items: cart.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: Number(item.product.price), // Decimal → number
        stock: item.product.stock,
        image: item.product.image,
        category: { name: item.product.category.name },
      },
    })),
  }
}

/**
 * Ambil jumlah item di cart (untuk badge navbar).
 */
export async function getCartItemCount(userId: string): Promise<number> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { _count: { select: { items: true } } },
  })
  return cart?._count.items ?? 0
}
