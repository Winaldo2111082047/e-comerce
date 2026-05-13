'use client'

import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'

interface CartSummaryProps {
  subtotal: number
  totalItems: number
}

export default function CartSummary({ subtotal, totalItems }: CartSummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sticky top-24">
      <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-5">Ringkasan Pesanan</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Subtotal ({totalItems} item)</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Ongkos kirim</span>
          <span className="text-green-600 font-medium">Dihitung saat checkout</span>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 my-4" />

      <div className="flex justify-between font-bold text-gray-900 dark:text-white mb-5">
        <span>Total</span>
        <span className="text-lg">{formatRupiah(subtotal)}</span>
      </div>

      <Link
        href="/checkout"
        className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
      >
        Lanjut ke Checkout
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>

      <p className="text-xs text-gray-400 text-center mt-3">
        Pembayaran aman &amp; terenkripsi
      </p>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        {['Pengiriman Cepat', 'Garansi Uang Kembali'].map((badge) => (
          <div key={badge} className="flex items-center gap-1 text-xs text-gray-400">
            <svg className="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {badge}
          </div>
        ))}
      </div>
    </div>
  )
}
