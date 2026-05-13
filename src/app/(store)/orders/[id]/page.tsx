import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { formatRupiah, formatDate } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { getOrderDetail } from '@/services'
import type { Metadata } from 'next'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Detail Pesanan' }

const statusConfig: Record<string, { label: string; color: string; step: number }> = {
  PENDING:    { label: 'Menunggu Pembayaran', color: 'text-yellow-600', step: 1 },
  PAID:       { label: 'Pembayaran Diterima', color: 'text-blue-600',   step: 2 },
  PROCESSING: { label: 'Sedang Diproses',     color: 'text-indigo-600', step: 3 },
  SHIPPED:    { label: 'Dalam Pengiriman',    color: 'text-purple-600', step: 4 },
  DELIVERED:  { label: 'Pesanan Selesai',     color: 'text-green-600',  step: 5 },
  CANCELLED:  { label: 'Dibatalkan',          color: 'text-red-600',    step: 0 },
}

const paymentMethodLabel: Record<string, string> = {
  BANK_TRANSFER: 'Transfer Bank',
  E_WALLET: 'E-Wallet',
  QRIS: 'QRIS',
  COD: 'Bayar di Tempat (COD)',
  CREDIT_CARD: 'Kartu Kredit',
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const order = await getOrderDetail(id, session.user.id)
  if (!order) notFound()

  const status = statusConfig[order.status] ?? { label: order.status, color: 'text-gray-600', step: 0 }
  const steps = ['Pesanan Dibuat', 'Pembayaran', 'Diproses', 'Dikirim', 'Selesai']

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/orders" className="p-2 rounded-xl hover:bg-gray-200 transition-colors text-gray-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Detail Pesanan</h1>
            <p className="text-sm font-mono text-gray-500">{order.orderNumber}</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Status tracker */}
          {order.status !== 'CANCELLED' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-900">Status Pesanan</h2>
                <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
              </div>
              <div className="flex items-center gap-0 mt-4">
                {steps.map((step, i) => {
                  const stepNum = i + 1
                  const isDone = status.step >= stepNum
                  const isCurrent = status.step === stepNum
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center">
                      <div className="flex items-center w-full">
                        {i > 0 && (
                          <div className={`flex-1 h-1 ${isDone ? 'bg-blue-500' : 'bg-gray-200'}`} />
                        )}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isDone
                              ? 'bg-blue-600 text-white'
                              : isCurrent
                              ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {isDone && !isCurrent ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            stepNum
                          )}
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`flex-1 h-1 ${status.step > stepNum ? 'bg-blue-500' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <p className={`text-xs mt-2 text-center leading-tight ${isDone ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                        {step}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {order.status === 'CANCELLED' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 font-medium">
              ❌ Pesanan ini telah dibatalkan
            </div>
          )}

          {/* Payment info */}
          {order.status === 'PENDING' && order.payment && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
              <h2 className="font-semibold text-yellow-800 mb-2">⏳ Menunggu Pembayaran</h2>
              <p className="text-sm text-yellow-700 mb-3">
                Selesaikan pembayaran sebelum{' '}
                <strong>
                  {order.payment.expiredAt ? formatDate(order.payment.expiredAt) : '24 jam'}
                </strong>
              </p>
              <div className="bg-white rounded-xl p-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Metode</span>
                  <span className="font-semibold">{paymentMethodLabel[order.payment.method] ?? order.payment.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Bayar</span>
                  <span className="font-bold text-gray-900">{formatRupiah(Number(order.payment.amount))}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order items */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Produk Dipesan</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 p-5">
                  <Link href={`/products/${item.product.slug}`} className="shrink-0">
                    <div className="relative w-16 h-16 bg-gray-100 rounded-xl overflow-hidden">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300 text-xl">📦</div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 line-clamp-2">{item.productName}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.quantity}× {formatRupiah(Number(item.pricePerItem))}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900 shrink-0">
                    {formatRupiah(Number(item.subtotal))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Alamat Pengiriman</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">{order.snapRecipient}</p>
              <p>{order.snapPhone}</p>
              <p>{order.snapAddress}</p>
              <p>{order.snapCity}, {order.snapProvince} {order.snapPostalCode}</p>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Rincian Pembayaran</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({order.items.length} produk)</span>
                <span>{formatRupiah(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Ongkos kirim</span>
                <span>{Number(order.shippingCost) === 0 ? 'Gratis' : formatRupiah(Number(order.shippingCost))}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-lg">{formatRupiah(Number(order.totalAmount))}</span>
              </div>
            </div>
          </div>

          {/* Order info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Informasi Pesanan</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">No. Pesanan</p>
                <p className="font-mono font-semibold text-gray-800">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-gray-400">Tanggal</p>
                <p className="font-medium text-gray-800">{formatDate(order.createdAt)}</p>
              </div>
              {order.payment && (
                <div>
                  <p className="text-gray-400">Metode Bayar</p>
                  <p className="font-medium text-gray-800">
                    {paymentMethodLabel[order.payment.method] ?? order.payment.method}
                  </p>
                </div>
              )}
              {order.notes && (
                <div className="col-span-2">
                  <p className="text-gray-400">Catatan</p>
                  <p className="font-medium text-gray-800">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
