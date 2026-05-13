import { prisma } from '@/lib/prisma'

/**
 * Generate order number: ORD-YYYYMMDD-XXXX
 * XXXX = 4-digit sequential number per hari
 */
export async function generateOrderNumber(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '') // "20260509"

  // Hitung order hari ini
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

  const count = await prisma.order.count({
    where: { createdAt: { gte: startOfDay, lt: endOfDay } },
  })

  const seq = String(count + 1).padStart(4, '0')
  return `ORD-${dateStr}-${seq}`
}
