/**
 * env.ts
 *
 * Validasi environment variables saat startup.
 * Jika ada yang missing, app langsung crash dengan pesan yang jelas
 * daripada error misterius di runtime.
 *
 * Diimport di src/lib/prisma.ts dan src/lib/auth.ts
 * sehingga validasi terjadi saat module pertama kali di-load.
 */

// ─────────────────────────────────────────────────────────────────────────────
// REQUIRED VARIABLES
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_SERVER_VARS = [
  'DATABASE_URL',
  'AUTH_SECRET',
] as const

const REQUIRED_CLOUDINARY_VARS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATOR
// ─────────────────────────────────────────────────────────────────────────────

type EnvVar = typeof REQUIRED_SERVER_VARS[number] | typeof REQUIRED_CLOUDINARY_VARS[number]

function validateEnv(vars: readonly string[]): void {
  const missing = vars.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `\n\n❌ Missing required environment variables:\n` +
      missing.map((v) => `   - ${v}`).join('\n') +
      `\n\nCopy .env.example to .env.local and fill in the values.\n`
    )
  }
}

/**
 * Validasi semua env vars yang dibutuhkan server.
 * Panggil di awal module yang butuh env vars.
 */
export function validateServerEnv(): void {
  // Hanya validasi di server-side (bukan di browser)
  if (typeof window !== 'undefined') return
  validateEnv(REQUIRED_SERVER_VARS)
}

/**
 * Validasi env vars Cloudinary.
 * Panggil di cloudinary.ts.
 */
export function validateCloudinaryEnv(): void {
  if (typeof window !== 'undefined') return
  validateEnv(REQUIRED_CLOUDINARY_VARS)
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPED ENV ACCESSORS
// Gunakan ini daripada process.env langsung untuk type safety
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ambil env var dengan type safety.
 * Throw jika tidak ada (untuk vars yang wajib ada).
 */
export function getEnv(key: EnvVar): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`)
  }
  return value
}

/**
 * Ambil env var opsional.
 */
export function getOptionalEnv(key: string): string | undefined {
  return process.env[key]
}

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'
export const isTest = process.env.NODE_ENV === 'test'

/**
 * App URL — dipakai untuk absolute URLs (OG images, email links, dll)
 */
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    (isProduction ? 'https://tokokita.vercel.app' : 'http://localhost:3000')
  )
}
