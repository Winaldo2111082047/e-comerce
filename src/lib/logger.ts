/**
 * logger.ts
 *
 * Centralized error logging untuk TokoKita.
 * - Development: log ke console
 * - Production: siap di-extend ke Sentry / Datadog / LogRocket
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  path?: string
  action?: string
  [key: string]: unknown
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const ctx = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`
}

/**
 * Log info — untuk event penting (checkout, order created, dll)
 */
export function logInfo(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === 'development') {
    console.info(formatMessage('info', message, context))
  }
  // Production: kirim ke logging service
}

/**
 * Log warning — untuk kondisi tidak normal tapi tidak crash
 */
export function logWarn(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(formatMessage('warn', message, context))
  }
  // Production: kirim ke logging service
}

/**
 * Log error — untuk error yang perlu diinvestigasi
 */
export function logError(error: unknown, context?: LogContext): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  if (process.env.NODE_ENV === 'development') {
    console.error(formatMessage('error', message, context))
    if (stack) console.error(stack)
  }

  // Production: kirim ke Sentry / error tracking service
  // Contoh integrasi Sentry:
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { extra: context })
  // }
}

/**
 * Log Server Action error — wrapper untuk try/catch di actions
 */
export function logActionError(
  actionName: string,
  error: unknown,
  userId?: string
): void {
  logError(error, {
    action: actionName,
    userId,
    path: 'server-action',
  })
}
