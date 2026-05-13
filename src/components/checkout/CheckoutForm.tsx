'use client'

import { useActionState } from 'react'
import { createOrder } from '@/app/actions/checkout'
import Input from '@/components/ui/Input'

const paymentMethods = [
  {
    value: 'BANK_TRANSFER',
    label: 'Transfer Bank',
    desc: 'BCA, Mandiri, BNI, BRI',
    icon: '🏦',
  },
  {
    value: 'E_WALLET',
    label: 'E-Wallet',
    desc: 'GoPay, OVO, DANA, ShopeePay',
    icon: '📱',
  },
  {
    value: 'QRIS',
    label: 'QRIS',
    desc: 'Scan QR dari semua aplikasi',
    icon: '📷',
  },
  {
    value: 'COD',
    label: 'Bayar di Tempat (COD)',
    desc: 'Bayar saat barang tiba',
    icon: '💵',
  },
]

export default function CheckoutForm() {
  const [state, action, pending] = useActionState(createOrder, undefined)

  return (
    <form action={action} className="space-y-5">
      {state?.message && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Alamat Pengiriman */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
          Alamat Pengiriman
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="recipient"
              name="recipient"
              label="Nama Penerima"
              placeholder="John Doe"
              required
              error={state?.errors?.recipient?.[0]}
            />
            <Input
              id="phone"
              name="phone"
              type="tel"
              label="Nomor Telepon"
              placeholder="08123456789"
              required
              error={state?.errors?.phone?.[0]}
            />
          </div>

          <Input
            id="street"
            name="street"
            label="Alamat Jalan"
            placeholder="Jl. Contoh No. 123, RT 01/RW 02"
            required
            error={state?.errors?.street?.[0]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="city"
              name="city"
              label="Kota / Kabupaten"
              placeholder="Jakarta Selatan"
              required
              error={state?.errors?.city?.[0]}
            />
            <Input
              id="province"
              name="province"
              label="Provinsi"
              placeholder="DKI Jakarta"
              required
              error={state?.errors?.province?.[0]}
            />
            <Input
              id="postalCode"
              name="postalCode"
              label="Kode Pos"
              placeholder="12345"
              maxLength={5}
              required
              error={state?.errors?.postalCode?.[0]}
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
              Catatan (opsional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Contoh: Titip ke satpam jika tidak ada di rumah"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Metode Pembayaran */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
          Metode Pembayaran
        </h2>

        {state?.errors?.paymentMethod && (
          <p className="text-xs text-red-600 mb-3">{state.errors.paymentMethod[0]}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paymentMethods.map((method) => (
            <label
              key={method.value}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 cursor-pointer hover:border-blue-300 has-checked:border-blue-500 has-checked:bg-blue-50 transition-all"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.value}
                className="accent-blue-600"
                defaultChecked={method.value === 'BANK_TRANSFER'}
              />
              <span className="text-2xl">{method.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{method.label}</p>
                <p className="text-xs text-gray-500">{method.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold text-base hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm shadow-blue-200"
      >
        {pending ? (
          <>
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Memproses Pesanan...
          </>
        ) : (
          <>
            Buat Pesanan
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </>
        )}
      </button>
    </form>
  )
}
