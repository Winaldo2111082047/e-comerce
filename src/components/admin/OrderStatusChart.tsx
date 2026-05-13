'use client'

interface StatusData {
  status: string
  count: number
  label: string
}

interface OrderStatusChartProps {
  data: StatusData[]
  total: number
}

const statusColors: Record<string, string> = {
  PENDING:    '#f59e0b',
  PAID:       '#3b82f6',
  PROCESSING: '#6366f1',
  SHIPPED:    '#8b5cf6',
  DELIVERED:  '#10b981',
  CANCELLED:  '#ef4444',
}

export default function OrderStatusChart({ data, total }: OrderStatusChartProps) {
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <p className="text-4xl mb-2">📋</p>
        <p className="text-sm">Belum ada pesanan</p>
      </div>
    )
  }

  // Donut chart via SVG
  const size = 140
  const cx = size / 2
  const cy = size / 2
  const r = 52
  const strokeWidth = 20
  const circumference = 2 * Math.PI * r

  let cumulativePercent = 0
  const segments = data.map((item) => {
    const pct = item.count / total
    const offset = circumference * (1 - cumulativePercent)
    const dash = circumference * pct
    cumulativePercent += pct
    return { ...item, pct, offset, dash }
  })

  return (
    <div>
      {/* Donut */}
      <div className="flex justify-center mb-5">
        <div className="relative">
          <svg width={size} height={size} className="-rotate-90">
            {/* Background circle */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth={strokeWidth}
            />
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={statusColors[seg.status] ?? '#9ca3af'}
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
                strokeDashoffset={seg.offset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-400">Pesanan</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {data.map((item) => {
          const pct = total > 0 ? ((item.count / total) * 100).toFixed(0) : '0'
          return (
            <div key={item.status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: statusColors[item.status] ?? '#9ca3af' }}
              />
              <span className="text-xs text-gray-600 flex-1">{item.label}</span>
              <span className="text-xs font-semibold text-gray-900">{item.count}</span>
              <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
