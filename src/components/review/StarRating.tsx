'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number           // nilai saat ini (0–5)
  onChange?: (v: number) => void  // undefined = read-only
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
}

export default function StarRating({
  value,
  onChange,
  size = 'md',
  showValue = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const isInteractive = !!onChange
  const display = isInteractive ? (hovered || value) : value

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= display
        return (
          <button
            key={star}
            type={isInteractive ? 'button' : undefined}
            onClick={isInteractive ? () => onChange(star) : undefined}
            onMouseEnter={isInteractive ? () => setHovered(star) : undefined}
            onMouseLeave={isInteractive ? () => setHovered(0) : undefined}
            disabled={!isInteractive}
            aria-label={isInteractive ? `Beri ${star} bintang` : `${star} bintang`}
            className={cn(
              'transition-transform',
              isInteractive && 'hover:scale-110 cursor-pointer',
              !isInteractive && 'cursor-default'
            )}
          >
            <svg
              className={cn(
                sizeMap[size],
                'transition-colors',
                filled ? 'text-amber-400' : 'text-gray-200',
                isInteractive && !filled && 'hover:text-amber-300'
              )}
              fill={filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={filled ? 0 : 1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        )
      })}
      {showValue && value > 0 && (
        <span className="ml-1.5 text-sm font-semibold text-gray-700">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}
