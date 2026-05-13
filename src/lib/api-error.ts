import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// ERROR TYPES
// ─────────────────────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} tidak ditemukan.`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Login diperlukan.') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Akses ditolak.') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Data tidak valid.') {
    super(message, 422, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

type ApiSuccessResponse<T> = {
  success: true
  data: T
  message?: string
}

type ApiErrorResponse = {
  success: false
  error: string
  code?: string
  details?: unknown
}

/**
 * Buat response sukses yang konsisten untuk API routes.
 */
export function apiSuccess<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data, message }, { status })
}

/**
 * Buat response error yang konsisten untuk API routes.
 */
export function apiError(
  message: string,
  status = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code && { code }),
      ...(process.env.NODE_ENV === 'development' && details && { details }),
    },
    { status }
  )
}

/**
 * Handler terpusat untuk error di API routes.
 * Tangkap semua jenis error dan kembalikan response yang konsisten.
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   return handleApiError(async () => {
 *     const data = await getProducts()
 *     return apiSuccess(data)
 *   })
 * }
 */
export async function handleApiError(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler()
  } catch (error) {
    // Error yang kita throw sendiri
    if (error instanceof AppError) {
      return apiError(error.message, error.statusCode, error.code)
    }

    // Prisma errors
    if (error instanceof Error) {
      // Record not found
      if (error.message.includes('Record to update not found') ||
          error.message.includes('Record to delete not found')) {
        return apiError('Data tidak ditemukan.', 404, 'NOT_FOUND')
      }
      // Unique constraint violation
      if (error.message.includes('Unique constraint failed')) {
        return apiError('Data sudah ada.', 409, 'CONFLICT')
      }
    }

    // Unknown error
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', error)
    }

    return apiError('Terjadi kesalahan server.', 500, 'INTERNAL_ERROR')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER ACTION ERROR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pesan error yang user-friendly untuk Server Actions.
 * Konversi error teknis ke pesan yang bisa dibaca user.
 */
export function getActionErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message

  if (error instanceof Error) {
    // Prisma unique constraint
    if (error.message.includes('Unique constraint failed')) {
      return 'Data sudah ada. Gunakan nilai yang berbeda.'
    }
    // Prisma not found
    if (error.message.includes('Record to update not found')) {
      return 'Data tidak ditemukan atau sudah dihapus.'
    }
    // Network / DB connection
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      return 'Tidak dapat terhubung ke server. Coba lagi nanti.'
    }
  }

  return 'Terjadi kesalahan. Silakan coba lagi.'
}
