'use server'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth-guard'
import { CheckoutSchema, type FormState } from '@/lib/definitions'
import { generateOrderNumber } from '@/lib/order'
import { rateLimit, rateLimitMessage } from '@/lib/rate-limit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { PaymentMethod } from '@/generated/prisma/client'

export async function createOrder(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const { userId } = await requireUser()

  // ── Rate limit: 5 checkout per user per 10 menit ──────────────────────────
  const rl = rateLimit(userId, 'checkout')
  if (!rl.allowed) {
    return { message: rateLimitMessage(rl) }
  }

  // Validate form
  const parsed = CheckoutSchema.safeParse({
    recipient: formData.get('recipient'),
    phone: formData.get('phone'),
    street: formData.get('street'),
    city: formData.get('city'),
    province: formData.get('province'),
    postalCode: formData.get('postalCode'),
    notes: formData.get('notes'),
    paymentMethod: formData.get('paymentMethod'),
  })

  if (!parsed.success) {
    return {
      errors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v ?? []])
      ) as Record<string, string[]>,
    }
  }

  const { recipient, phone, street, city, province, postalCode, notes, paymentMethod } =
    parsed.data

  // Get cart with items
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  })

  if (!cart || cart.items.length === 0) {
    return { message: 'Keranjang belanja kosong.' }
  }

  // Validate stock for all items
  for (const item of cart.items) {
    if (!item.product.isActive) {
      return { message: `Produk "${item.product.name}" sudah tidak tersedia.` }
    }
    if (item.product.stock < item.quantity) {
      return {
        message: `Stok "${item.product.name}" tidak mencukupi. Tersisa ${item.product.stock}.`,
      }
    }
  }

  // Calculate totals
  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  )
  const shippingCost = 0
  const totalAmount = subtotal + shippingCost

  const orderNumber = await generateOrderNumber()

  let orderId: string

  try {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'PENDING',
          subtotal,
          shippingCost,
          totalAmount,
          notes: notes || null,
          snapRecipient: recipient,
          snapPhone: phone,
          snapAddress: street,
          snapCity: city,
          snapProvince: province,
          snapPostalCode: postalCode,
        },
      })

      // 2. Create order items (snapshot harga & nama produk)
      await tx.orderItem.createMany({
        data: cart.items.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          pricePerItem: Number(item.product.price),
          subtotal: Number(item.product.price) * item.quantity,
          productName: item.product.name,
          productImage: item.product.image,
        })),
      })

      // 3. Kurangi stok produk
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // 4. Create payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: totalAmount,
          method: paymentMethod as PaymentMethod,
          status: 'PENDING',
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 jam
        },
      })

      // 5. Kosongkan cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

      return newOrder
    })

    orderId = order.id
  } catch {
    return { message: 'Terjadi kesalahan saat membuat pesanan. Coba lagi.' }
  }

  revalidatePath('/cart')
  revalidatePath('/orders')
  redirect(`/orders/${orderId}`)
}
