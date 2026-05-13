'use client'

import { useState, useTransition } from 'react'
import { updateOrderStatus } from '@/app/actions/orders'
import { toast } from '@/lib/toast'
import type { OrderStatus } from '@/generated/prisma/client'

interface OrderStatusSelectProps {
  orderId: string
  currentStatus: string
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'PENDING',    label: 'Menunggu Bayar' },
  { value: 'PAID',       label: 'Dibayar' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'SHIPPED',    label: 'Dikirim' },
  { value: 'DELIVERED',  label: 'Selesai' },
  { value: 'CANCELLED',  label: 'Dibatalkan' },
]

const statusColors: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  PAID:       'bg-blue-100 text-blue-700 border-blue-200',
  PROCESSING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  SHIPPED:    'bg-purple-100 text-purple-700 border-purple-200',
  DELIVERED:  'bg-green-100 text-green-700 border-green-200',
  CANCELLED:  'bg-red-100 text-red-700 border-red-200',
}

export default function OrderStatusSelect({ orderId, currentStatus }: OrderStatusSelectProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as OrderStatus
    setStatus(newStatus)
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus)
      const label = statusOptions.find((o) => o.value === newStatus)?.label ?? newStatus
      toast.orderStatusUpdated(label)
    })
  }

  return (
    <div className="relative">
      <select
        value={status}
        onChange={handleChange}
        disabled={isPending}
        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer appearance-none pr-6 transition-all disabled:opacity-60 ${
          statusColors[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
        }`}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {isPending ? (
        <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </div>
  )
}
