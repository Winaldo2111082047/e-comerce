import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatRupiah, formatDate } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { getUserOrders } from '@/services'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pesanan Saya',
  robots: { index: false, follow: false },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-700' },
  PAID:       { label: 'Sudah Dibayar',       color: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: 'Diproses',            color: 'bg-indigo-100 text-indigo-700' },
  SHIPPED:    { label: 'Dikirim',             color: 'bg-purple-100 text-purple-700' },
  DELIVERED:  { label: 'Selesai',             color: 'bg-green-100 text-green-700' },
  CANCELLED:  { label: 'Dibatalkan',          color: 'bg-red-100 text-red-700' },
}

export default async function OrdersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const orders = await getUserOrders(session.user.id)

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pesanan Saya</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg font-semibold text-gray-700 mb-2">Belum ada pesanan</p>
            <p className="text-gray-400 mb-6">Yuk mulai belanja!</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' }
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-mono text-sm font-semibold text-gray-700">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Product thumbnails */}
                  <div className="flex items-center gap-2 mb-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="relative w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0"
                      >
                        {item.product.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.productName}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-300 text-xs">
                            📦
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length === 3 && (
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-500 font-medium">
                        +lagi
                      </div>
                    )}
                    <div className="ml-auto text-right">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="font-bold text-gray-900">
                        {formatRupiah(Number(order.totalAmount))}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-3">
                    <span>
                      {order.payment?.method?.replace('_', ' ')} ·{' '}
                      {order.payment?.status === 'SUCCESS' ? '✅ Lunas' : '⏳ Belum dibayar'}
                    </span>
                    <span className="text-blue-600 font-medium">Lihat detail →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
