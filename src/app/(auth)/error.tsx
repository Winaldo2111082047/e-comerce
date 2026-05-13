'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AuthError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Auth Error]', error)
    }
  }, [error])

  return (
    <div className="w-full max-w-sm text-center">
      {/* Icon */}
      <div className="flex justify-center mb-5">
        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg
            className="w-7 h-7 text-red-500 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Terjadi Kesalahan
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Halaman ini tidak dapat dimuat. Silakan coba lagi.
      </p>

      {error.digest && (
        <p className="text-xs text-gray-400 dark:text-gray-600 font-mono mb-5">
          Ref: {error.digest}
        </p>
      )}

      {process.env.NODE_ENV === 'development' && error.message && (
        <div className="mb-5 text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Dev Info:</p>
          <p className="text-xs text-red-600 dark:text-red-300 font-mono break-all">{error.message}</p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Coba Lagi
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full"
        >
          Ke Beranda
        </Link>
      </div>
    </div>
  )
}
