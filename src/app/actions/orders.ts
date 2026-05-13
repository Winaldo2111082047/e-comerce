'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import type { OrderStatus } from '@/generated/prisma/client'

async function requireAdminLocal() {
  return requireAdmin()
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdminLocal()

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  })

  // Jika status PAID, update payment status juga
  if (status === 'PAID') {
    await prisma.payment.updateMany({
      where: { orderId },
      data: { status: 'SUCCESS', paidAt: new Date() },
    })
  }

  // Jika CANCELLED, kembalikan stok
  if (status === 'CANCELLED') {
    const items = await prisma.orderItem.findMany({ where: { orderId } })
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}
