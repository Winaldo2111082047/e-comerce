import { formatRupiah, formatDate } from '@/lib/utils'
import OrderStatusSelect from '@/components/admin/OrderStatusSelect'
import Link from 'next/link'
import { getAdminOrders } from '@/services'
import type { Metadata } from 'next'
import type { OrderStatus } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Kelola Pesanan' }

interface AdminOrdersPageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

const ITEMS_PER_PAGE = 15

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Menunggu Bayar', color: 'bg-yellow-100 text-yellow-700' },
  PAID:       { label: 'Dibayar',        color: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: 'Diproses',       color: 'bg-indigo-100 text-indigo-700' },
  SHIPPED:    { label: 'Dikirim',        color: 'bg-purple-100 text-purple-700' },
  DELIVERED:  { label: 'Selesai',        color: 'bg-green-100 text-green-700' },
  CANCELLED:  { label: 'Dibatalkan',     color: 'bg-red-100 text-red-700' },
}

const allStatuses = Object.keys(statusConfig)

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const { status, page } = await searchParams
  const currentPage = Math.max(1, Number(page) || 1)

  const validStatus = status && allStatuses.includes(status)
    ? (status as OrderStatus)
    : undefined

  const { orders, total, totalPages, statusCounts } = await getAdminOrders({
    status: validStatus,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  })

  const countMap = statusCounts

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
          <p className="text-gray-500 text-sm mt-1">{total} pesanan ditemukan</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        <Link
          href="/admin/orders"
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            !status ? 'bg-slate-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Semua ({Object.values(countMap).reduce((a, b) => a + b, 0)})
        </Link>
        {allStatuses.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              status === s ? 'bg-slate-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {statusConfig[s].label} ({countMap[s] ?? 0})
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 font-medium">Tidak ada pesanan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">No. Pesanan</th>
                  <th className="px-5 py-3 text-left font-medium">Pelanggan</th>
                  <th className="px-5 py-3 text-left font-medium">Item</th>
                  <th className="px-5 py-3 text-left font-medium">Total</th>
                  <th className="px-5 py-3 text-left font-medium">Pembayaran</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const s = statusConfig[order.status]
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs font-semibold text-gray-700">
                          {order.orderNumber}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900 text-xs">{order.user.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-36">{order.user.email}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600 text-xs">
                        {order.items.length} item
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900 text-xs">
                        {formatRupiah(Number(order.totalAmount))}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-gray-500">
                          <p>{order.payment?.method?.replace('_', ' ') ?? '—'}</p>
                          <p className={order.payment?.status === 'SUCCESS' ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                            {order.payment?.status === 'SUCCESS' ? '✅ Lunas' : '⏳ Pending'}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <OrderStatusSelect
                          orderId={order.id}
                          currentStatus={order.status}
                        />
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?${new URLSearchParams({
                ...(status && { status }),
                page: String(p),
              })}`}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                p === currentPage
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
