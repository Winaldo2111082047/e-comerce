'use client'

import { formatRupiah } from '@/lib/utils'

interface MonthData {
  month: string
  revenue: number
  orders: number
}

interface MonthlyChartProps {
  data: MonthData[]
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const maxOrders = Math.max(...data.map((d) => d.orders), 1)
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = data.reduce((s, d) => s + d.orders, 0)

  // Bulan ini (index terakhir)
  const currentMonth = data[data.length - 1]
  const prevMonth = data[data.length - 2]
  const revenueGrowth = prevMonth?.revenue > 0
    ? ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1)
    : null

  return (
    <div>
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-xs text-emerald-600 font-medium">Total 6 Bulan</p>
          <p className="text-base font-bold text-gray-900 mt-0.5">{formatRupiah(totalRevenue)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-blue-600 font-medium">Total Pesanan</p>
          <p className="text-base font-bold text-gray-900 mt-0.5">{totalOrders}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 font-medium">Bulan Ini</p>
          <p className="text-base font-bold text-gray-900 mt-0.5">{formatRupiah(currentMonth?.revenue ?? 0)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 font-medium">Pertumbuhan</p>
          <p className={`text-base font-bold mt-0.5 ${
            revenueGrowth === null ? 'text-gray-400' :
            Number(revenueGrowth) >= 0 ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {revenueGrowth === null ? '—' : `${Number(revenueGrowth) >= 0 ? '+' : ''}${revenueGrowth}%`}
          </p>
        </div>
      </div>

      {/* Grouped bar chart */}
      <div className="flex items-end gap-3 h-48">
        {data.map((month, i) => {
          const revenueH = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0
          const ordersH = maxOrders > 0 ? (month.orders / maxOrders) * 100 : 0
          const isCurrent = i === data.length - 1

          return (
            <div key={month.month} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg px-2.5 py-2 text-center pointer-events-none whitespace-nowrap z-10 relative">
                <p className="font-semibold text-emerald-400">{formatRupiah(month.revenue)}</p>
                <p className="text-gray-400">{month.orders} pesanan</p>
              </div>

              {/* Bars */}
              <div className="w-full flex items-end gap-0.5" style={{ height: '140px' }}>
                {/* Revenue bar */}
                <div
                  className={`flex-1 rounded-t-md transition-all duration-700 ${
                    isCurrent ? 'bg-emerald-500' : 'bg-emerald-200 group-hover:bg-emerald-400'
                  }`}
                  style={{ height: `${Math.max(revenueH, month.revenue > 0 ? 3 : 0)}%` }}
                  title={`Revenue: ${formatRupiah(month.revenue)}`}
                />
                {/* Orders bar */}
                <div
                  className={`flex-1 rounded-t-md transition-all duration-700 ${
                    isCurrent ? 'bg-blue-500' : 'bg-blue-200 group-hover:bg-blue-400'
                  }`}
                  style={{ height: `${Math.max(ordersH, month.orders > 0 ? 3 : 0)}%` }}
                  title={`Pesanan: ${month.orders}`}
                />
              </div>

              {/* Label */}
              <p className={`text-xs ${isCurrent ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>
                {month.month}
              </p>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 justify-end">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          <span className="text-xs text-gray-500">Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-400" />
          <span className="text-xs text-gray-500">Pesanan</span>
        </div>
      </div>
    </div>
  )
}
