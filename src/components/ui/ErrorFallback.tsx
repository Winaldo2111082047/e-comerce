import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ErrorVariant = 'page' | 'section' | 'inline'

interface ErrorFallbackProps {
  /** Judul error yang ditampilkan */
  title?: string
  /** Pesan deskripsi error */
  message?: string
  /** Ukuran tampilan: page = full screen, section = card, inline = compact */
  variant?: ErrorVariant
  /** Callback untuk retry */
  onRetry?: () => void
  /** Link kembali (opsional) */
  backHref?: string
  backLabel?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ErrorFallback({
  title = 'Terjadi Kesalahan',
  message = 'Tidak dapat memuat konten ini. Silakan coba lagi.',
  variant = 'section',
  onRetry,
  backHref,
  backLabel = 'Kembali',
}: ErrorFallbackProps) {
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm">
        <svg
          className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-red-700 dark:text-red-300">{title}</p>
          <p className="text-red-600 dark:text-red-400 text-xs mt-0.5">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
          >
            Coba lagi
          </button>
        )}
      </div>
    )
  }

  const wrapperClass =
    variant === 'page'
      ? 'min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4'
      : 'py-16 flex items-center justify-center px-4'

  return (
    <div className={wrapperClass}>
      <div className="max-w-sm w-full text-center">
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

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Coba Lagi
            </button>
          )}
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              {backLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
