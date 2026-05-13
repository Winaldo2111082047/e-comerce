'use server'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth-guard'
import { rateLimit, rateLimitMessage } from '@/lib/rate-limit'
import { revalidatePath } from 'next/cache'

export async function addToCart(productId: string, quantity: number = 1) {
  const { userId } = await requireUser()

  // ── Rate limit: 60 add-to-cart per user per menit ─────────────────────────
  const rl = rateLimit(userId, 'cart')
  if (!rl.allowed) {
    return { error: rateLimitMessage(rl) }
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || !product.isActive) {
    return { error: 'Produk tidak ditemukan.' }
  }
  if (product.stock < quantity) {
    return { error: 'Stok tidak mencukupi.' }
  }

  // Get or create cart
  let cart = await prisma.cart.findUnique({ where: { userId } })
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } })
  }

  // Upsert cart item
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  })

  if (existing) {
    const newQty = existing.quantity + quantity
    if (newQty > product.stock) {
      return { error: 'Jumlah melebihi stok tersedia.' }
    }
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
    })
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    })
  }

  revalidatePath('/cart')
  return { success: true }
}

export async function updateCartItem(cartItemId: string, quantity: number) {
  const { userId } = await requireUser()

  if (quantity <= 0) {
    // Pastikan item milik user ini sebelum delete
    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, cart: { userId } },
    })
    if (!item) return { error: 'Item tidak ditemukan.' }
    await prisma.cartItem.delete({ where: { id: cartItemId } })
  } else {
    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, cart: { userId } },
      include: { product: true },
    })
    if (!item) return { error: 'Item tidak ditemukan.' }
    if (quantity > item.product.stock) {
      return { error: 'Jumlah melebihi stok tersedia.' }
    }
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    })
  }

  revalidatePath('/cart')
  return { success: true }
}

export async function removeFromCart(cartItemId: string) {
  const { userId } = await requireUser()

  // Ownership check — pastikan item milik user ini
  const item = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cart: { userId } },
  })
  if (!item) return { error: 'Item tidak ditemukan.' }

  await prisma.cartItem.delete({ where: { id: cartItemId } })
  revalidatePath('/cart')
  return { success: true }
}

export async function clearCart() {
  const { userId } = await requireUser()

  const cart = await prisma.cart.findUnique({ where: { userId } })
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  }

  revalidatePath('/cart')
  return { success: true }
}

export async function getCartCount(userId: string): Promise<number> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { _count: { select: { items: true } } },
  })
  return cart?._count.items ?? 0
}
