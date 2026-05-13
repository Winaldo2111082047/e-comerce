'use client'

import { formatRupiah } from '@/lib/utils'

interface DayData {
  date: string
  revenue: number
  orders: number
}

interface SalesChartProps {
  data: DayData[]
}

export default function SalesChart({ data }: SalesChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = data.reduce((s, d) => s + d.orders, 0)

  return (
    <div>
      {/* Summary */}
      <div className="flex gap-6 mb-6">
        <div>
          <p className="text-xs text-gray-400">Total 7 Hari</p>
          <p className="text-lg font-bold text-gray-900">{formatRupiah(totalRevenue)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Total Pesanan</p>
          <p className="text-lg font-bold text-gray-900">{totalOrders}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-40">
        {data.map((day, i) => {
          const heightPct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
          const isToday = i === data.length - 1
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 text-center pointer-events-none whitespace-nowrap">
                <p className="font-semibold">{formatRupiah(day.revenue)}</p>
                <p className="text-gray-400">{day.orders} pesanan</p>
              </div>

              {/* Bar */}
              <div className="w-full flex items-end" style={{ height: '120px' }}>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    isToday ? 'bg-blue-600' : 'bg-blue-200 group-hover:bg-blue-400'
                  }`}
                  style={{ height: `${Math.max(heightPct, day.revenue > 0 ? 4 : 0)}%` }}
                />
              </div>

              {/* Label */}
              <p className={`text-xs ${isToday ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                {day.date}
              </p>
            </div>
          )
        })}
      </div>

      {/* Y-axis hint */}
      <div className="flex justify-between mt-2 text-xs text-gray-300">
        <span>Rp 0</span>
        <span>{formatRupiah(maxRevenue)}</span>
      </div>
    </div>
  )
}
