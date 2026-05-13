/**
 * order.service.ts
 *
 * Semua query Prisma yang berhubungan dengan Order.
 * Dipanggil dari Server Components (page.tsx).
 */

import { prisma } from '@/lib/prisma'
import type { Order, OrderItem, Payment, User, OrderStatus } from '@/generated/prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — pakai tipe Prisma langsung, hindari manual type yang bisa mismatch
// ─────────────────────────────────────────────────────────────────────────────

export type OrderListItem = Pick<Order, 'id' | 'orderNumber' | 'status' | 'totalAmount' | 'createdAt'> & {
  items: (Pick<OrderItem, 'id' | 'productName'> & {
    product: { image: string | null }
  })[]
  payment: Pick<Payment, 'method' | 'status'> | null
}

export type OrderDetail = Order & {
  items: (OrderItem & {
    product: { slug: string; image: string | null }
  })[]
  payment: Payment | null
}

export type AdminOrderListItem = Pick<Order, 'id' | 'orderNumber' | 'status' | 'totalAmount' | 'createdAt'> & {
  user: Pick<User, 'name' | 'email'>
  items: Pick<OrderItem, 'id'>[]
  payment: Pick<Payment, 'method' | 'status'> | null
}

// ─────────────────────────────────────────────────────────────────────────────
// USER QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ambil semua pesanan milik user tertentu.
 */
export async function getUserOrders(userId: string): Promise<OrderListItem[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: { product: { select: { image: true } } },
        take: 3,
      },
      payment: { select: { method: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return orders
}

/**
 * Ambil detail satu pesanan.
 * Return null jika tidak ditemukan atau bukan milik userId.
 */
export async function getOrderDetail(
  orderId: string,
  userId: string
): Promise<OrderDetail | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: { select: { slug: true, image: true } } },
      },
      payment: true,
    },
  })

  if (!order || order.userId !== userId) return null
  return order
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export interface GetAdminOrdersOptions {
  status?: OrderStatus
  page?: number
  limit?: number
}

export type AdminOrdersResult = {
  orders: AdminOrderListItem[]
  total: number
  totalPages: number
  statusCounts: Record<string, number>
}

/**
 * Ambil daftar pesanan untuk admin dengan filter status dan pagination.
 * Menggabungkan 3 query (orders, count, statusCounts) menjadi satu fungsi.
 */
export async function getAdminOrders(
  options: GetAdminOrdersOptions = {}
): Promise<AdminOrdersResult> {
  const { status, page = 1, limit = 15 } = options
  const skip = (page - 1) * limit

  const where = status ? { status } : {}

  const [orders, total, statusGroups] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { id: true } },
        payment: { select: { method: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ])

  const statusCounts = Object.fromEntries(
    statusGroups.map((s) => [s.status, s._count.status])
  )

  return {
    orders,
    total,
    totalPages: Math.ceil(total / limit),
    statusCounts,
  }
}
