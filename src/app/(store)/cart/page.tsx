import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatRupiah } from '@/lib/utils'
import CartItemRow from '@/components/cart/CartItemRow'
import CartSummary from '@/components/cart/CartSummary'
import Link from 'next/link'
import { getCartWithItems } from '@/services'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Keranjang Belanja',
  robots: { index: false, follow: false },
}

export default async function CartPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const cart = await getCartWithItems(session.user.id)
  const items = cart?.items ?? []

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  // Bentuk yang diharapkan CartItemRow
  const serializedItems = items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      stock: item.product.stock,
      image: item.product.image,
      categoryName: item.product.category.name,
    },
  }))

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Keranjang Belanja</h1>
          {totalItems > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {totalItems}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-20 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Keranjang masih kosong</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Temukan produk yang kamu suka dan tambahkan ke keranjang.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── Cart Items ── */}
            <div className="flex-1 min-w-0">
              {/* Items header */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-semibold text-gray-900">
                    {totalItems} item dipilih
                  </p>
                  <p className="text-sm text-gray-500">
                    Subtotal: <span className="font-semibold text-gray-900">{formatRupiah(subtotal)}</span>
                  </p>
                </div>

                <div className="divide-y divide-gray-50">
                  {serializedItems.map((item) => (
                    <CartItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>

              {/* Continue shopping */}
              <div className="mt-4">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Lanjut Belanja
                </Link>
              </div>
            </div>

            {/* ── Order Summary ── */}
            <div className="lg:w-80 shrink-0">
              <CartSummary subtotal={subtotal} totalItems={totalItems} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
