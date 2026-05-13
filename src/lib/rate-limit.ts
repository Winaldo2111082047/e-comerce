/**
 * rate-limit.ts
 *
 * Rate limiting production-ready untuk TokoKita.
 *
 * Algoritma: Sliding Window Counter
 * - Lebih akurat dari Fixed Window (tidak ada burst di batas window)
 * - Lebih efisien dari Sliding Window Log (tidak simpan semua timestamps)
 *
 * Storage: In-memory Map dengan auto-cleanup
 * - Cukup untuk single-instance / single-region deployment
 * - Interface RateLimitStore memudahkan swap ke Redis/Upstash kapan saja
 *
 * Penggunaan:
 * 1. Di proxy.ts  → rate limit per IP sebelum request masuk ke handler
 * 2. Di Server Actions → rate limit per user/IP untuk aksi spesifik
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  /** Apakah request diizinkan */
  allowed: boolean
  /** Sisa request yang diizinkan dalam window saat ini */
  remaining: number
  /** Timestamp (ms) kapan window reset */
  resetAt: number
  /** Total limit dalam window */
  limit: number
  /** Berapa detik lagi sampai reset (untuk Retry-After header) */
  retryAfter: number
}

export interface RateLimitConfig {
  /** Maksimum request dalam window */
  limit: number
  /** Durasi window dalam milliseconds */
  windowMs: number
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDING WINDOW STORE (in-memory)
// ─────────────────────────────────────────────────────────────────────────────

interface WindowEntry {
  /** Count di window sebelumnya (untuk sliding calculation) */
  prevCount: number
  /** Count di window saat ini */
  currCount: number
  /** Timestamp awal window saat ini */
  windowStart: number
}

const store = new Map<string, WindowEntry>()

// Auto-cleanup setiap 10 menit — hapus entries yang sudah expired
// Cegah memory leak pada traffic tinggi
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
  if (cleanupInterval !== null) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      // Entry expired jika sudah 2 window berlalu
      const windowMs = now - entry.windowStart
      if (windowMs > 2 * 60 * 60 * 1000) { // 2 jam sebagai max window
        store.delete(key)
      }
    }
  }, 10 * 60 * 1000)

  // Jangan block process exit
  if (typeof cleanupInterval === 'object' && cleanupInterval?.unref) {
    cleanupInterval.unref()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDING WINDOW ALGORITHM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sliding Window Counter rate limiter.
 *
 * Formula: estimatedCount = prevCount * (1 - elapsed/windowMs) + currCount
 *
 * Contoh dengan limit=10, window=60s:
 * - prevCount=8, elapsed=30s → prevWeight = 8 * 0.5 = 4
 * - currCount=3 → estimated = 4 + 3 = 7 → masih allowed
 *
 * @param key       - unique identifier (misal: "login:192.168.1.1")
 * @param config    - { limit, windowMs }
 */
function slidingWindow(key: string, config: RateLimitConfig): RateLimitResult {
  ensureCleanup()

  const { limit, windowMs } = config
  const now = Date.now()

  const entry = store.get(key)

  if (!entry) {
    // Request pertama
    store.set(key, { prevCount: 0, currCount: 1, windowStart: now })
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
      limit,
      retryAfter: 0,
    }
  }

  const elapsed = now - entry.windowStart

  if (elapsed >= windowMs) {
    // Window baru dimulai
    // Geser: curr → prev, reset curr
    const newEntry: WindowEntry = {
      prevCount: elapsed < windowMs * 2 ? entry.currCount : 0,
      currCount: 1,
      windowStart: now,
    }
    store.set(key, newEntry)
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
      limit,
      retryAfter: 0,
    }
  }

  // Dalam window yang sama — hitung sliding estimate
  const prevWeight = 1 - elapsed / windowMs
  const estimated = Math.floor(entry.prevCount * prevWeight) + entry.currCount

  if (estimated >= limit) {
    // Rate limit exceeded
    const resetAt = entry.windowStart + windowMs
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      limit,
      retryAfter: Math.ceil((resetAt - now) / 1000),
    }
  }

  // Increment counter
  entry.currCount++
  return {
    allowed: true,
    remaining: Math.max(0, limit - estimated - 1),
    resetAt: entry.windowStart + windowMs,
    limit,
    retryAfter: 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMIT CONFIGS
// Semua konfigurasi terpusat di sini — mudah di-tune
// ─────────────────────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  /** Login: 10x per 15 menit per IP */
  login: { limit: 10, windowMs: 15 * 60 * 1000 },

  /** Register: 5x per 10 menit per IP */
  register: { limit: 5, windowMs: 10 * 60 * 1000 },

  // ── API publik ─────────────────────────────────────────────────────────────
  /** GET /api/products: 120x per menit per IP */
  apiPublic: { limit: 120, windowMs: 60 * 1000 },

  /** POST/PUT/DELETE API: 30x per menit per IP */
  apiMutate: { limit: 30, windowMs: 60 * 1000 },

  // ── User actions ──────────────────────────────────────────────────────────
  /** Checkout: 5x per 10 menit per user */
  checkout: { limit: 5, windowMs: 10 * 60 * 1000 },

  /** Review: 10x per jam per user */
  review: { limit: 10, windowMs: 60 * 60 * 1000 },

  /** Add to cart: 60x per menit per user */
  cart: { limit: 60, windowMs: 60 * 1000 },

  /** Wishlist toggle: 30x per menit per user */
  wishlist: { limit: 30, windowMs: 60 * 1000 },

  // ── Global fallback ────────────────────────────────────────────────────────
  /** Default untuk semua request: 200x per menit per IP */
  global: { limit: 200, windowMs: 60 * 1000 },
} as const

export type RateLimitAction = keyof typeof RATE_LIMITS

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check rate limit untuk aksi tertentu.
 *
 * @param identifier - IP address atau user ID
 * @param action     - nama aksi dari RATE_LIMITS
 *
 * @example
 * // Di Server Action
 * const result = rateLimit('192.168.1.1', 'login')
 * if (!result.allowed) {
 *   return { message: `Coba lagi dalam ${result.retryAfter} detik.` }
 * }
 */
export function rateLimit(
  identifier: string,
  action: RateLimitAction
): RateLimitResult {
  const config = RATE_LIMITS[action]
  const key = `${action}:${identifier}`
  return slidingWindow(key, config)
}

/**
 * Check rate limit dengan config custom.
 * Untuk kasus yang tidak ada di RATE_LIMITS.
 */
export function rateLimitCustom(
  identifier: string,
  action: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${action}:${identifier}`
  return slidingWindow(key, config)
}

/**
 * Reset rate limit untuk identifier + action tertentu.
 * Berguna untuk testing atau admin override.
 */
export function resetRateLimit(identifier: string, action: string): void {
  store.delete(`${action}:${identifier}`)
}

/**
 * Ambil status rate limit tanpa increment counter.
 * Berguna untuk menampilkan info ke user.
 */
export function getRateLimitStatus(
  identifier: string,
  action: RateLimitAction
): { remaining: number; resetAt: number } | null {
  const key = `${action}:${identifier}`
  const entry = store.get(key)
  if (!entry) return null

  const { limit, windowMs } = RATE_LIMITS[action]
  const now = Date.now()
  const elapsed = now - entry.windowStart

  if (elapsed >= windowMs) return null

  const prevWeight = 1 - elapsed / windowMs
  const estimated = Math.floor(entry.prevCount * prevWeight) + entry.currCount

  return {
    remaining: Math.max(0, limit - estimated),
    resetAt: entry.windowStart + windowMs,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE HELPERS
// Buat response dengan standard rate limit headers (RFC 6585)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tambahkan standard rate limit headers ke response.
 *
 * Headers yang ditambahkan:
 * - X-RateLimit-Limit: total limit
 * - X-RateLimit-Remaining: sisa request
 * - X-RateLimit-Reset: timestamp reset (Unix seconds)
 * - Retry-After: detik sampai bisa retry (hanya jika blocked)
 */
export function applyRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
): void {
  headers.set('X-RateLimit-Limit', String(result.limit))
  headers.set('X-RateLimit-Remaining', String(result.remaining))
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))
  if (!result.allowed) {
    headers.set('Retry-After', String(result.retryAfter))
  }
}

/**
 * Format pesan error rate limit yang user-friendly.
 */
export function rateLimitMessage(result: RateLimitResult): string {
  if (result.retryAfter < 60) {
    return `Terlalu banyak percobaan. Coba lagi dalam ${result.retryAfter} detik.`
  }
  const minutes = Math.ceil(result.retryAfter / 60)
  return `Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.`
}
