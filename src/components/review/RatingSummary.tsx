import StarRating from './StarRating'

interface RatingSummaryProps {
  average: number
  total: number
  distribution: Record<number, number> // { 5: 10, 4: 5, 3: 2, 2: 1, 1: 0 }
}

export default function RatingSummary({ average, total, distribution }: RatingSummaryProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {/* Average score */}
      <div className="text-center shrink-0">
        <p className="text-5xl font-bold text-gray-900">{average.toFixed(1)}</p>
        <StarRating value={Math.round(average)} size="md" />
        <p className="text-sm text-gray-400 mt-1">{total} ulasan</p>
      </div>

      {/* Distribution bars */}
      <div className="flex-1 w-full space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] ?? 0
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-3 shrink-0">{star}</span>
              <svg className="h-3.5 w-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-6 text-right shrink-0">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
