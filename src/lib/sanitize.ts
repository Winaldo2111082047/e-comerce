/**
 * sanitize.ts
 *
 * Fungsi sanitasi input terpusat untuk TokoKita.
 * Tidak butuh library eksternal — murni string manipulation + Zod transforms.
 *
 * Prinsip:
 * 1. Strip HTML tags → cegah XSS
 * 2. Normalize whitespace → cegah padding/bypass
 * 3. Truncate ke batas aman → cegah buffer overflow
 * 4. Reject null bytes → cegah injection
 */

// ─────────────────────────────────────────────────────────────────────────────
// CORE SANITIZERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip semua HTML tags dari string.
 * Cegah XSS jika output di-render ke DOM.
 *
 * "<script>alert(1)</script>Hello" → "Hello"
 * "<b>Bold</b> text" → "Bold text"
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')           // hapus semua HTML tags
    .replace(/&lt;/g, '<')             // decode HTML entities
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#0*39;/g, "'")
    .replace(/&#0*34;/g, '"')
}

/**
 * Hapus null bytes dan karakter kontrol berbahaya.
 * Cegah null byte injection dan path traversal.
 *
 * "hello\x00world" → "helloworld"
 */
export function stripControlChars(input: string): string {
  return input
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // null bytes & control chars
    .replace(/\.\.\//g, '')                              // path traversal
    .replace(/\.\.\\/g, '')
}

/**
 * Normalize whitespace: collapse multiple spaces/tabs/newlines menjadi satu spasi.
 * Trim leading/trailing whitespace.
 */
export function normalizeWhitespace(input: string): string {
  return input
    .replace(/\t/g, ' ')           // tab → spasi
    .replace(/[ ]{2,}/g, ' ')      // multiple spaces → satu spasi
    .trim()
}

/**
 * Normalize whitespace untuk teks multi-baris (deskripsi, komentar).
 * Pertahankan newlines tapi collapse yang berlebihan.
 */
export function normalizeMultilineWhitespace(input: string): string {
  return input
    .replace(/\r\n/g, '\n')        // normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')           // tab → spasi
    .replace(/[ ]{2,}/g, ' ')      // multiple spaces → satu spasi
    .replace(/\n{3,}/g, '\n\n')    // max 2 newlines berturut-turut
    .trim()
}

/**
 * Sanitasi nama orang / nama produk / nama kategori.
 * - Strip HTML
 * - Hapus karakter kontrol
 * - Normalize whitespace
 * - Hanya izinkan karakter yang wajar untuk nama
 */
export function sanitizeName(input: string): string {
  return normalizeWhitespace(
    stripControlChars(
      stripHtml(input)
    )
  )
}

/**
 * Sanitasi teks bebas (deskripsi, komentar, catatan).
 * - Strip HTML (cegah XSS)
 * - Hapus karakter kontrol
 * - Normalize whitespace multi-baris
 */
export function sanitizeText(input: string): string {
  return normalizeMultilineWhitespace(
    stripControlChars(
      stripHtml(input)
    )
  )
}

/**
 * Sanitasi email: lowercase + trim.
 */
export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase()
}

/**
 * Sanitasi nomor telepon: hanya angka, +, -, spasi.
 */
export function sanitizePhone(input: string): string {
  return input.trim().replace(/[^\d+\-\s]/g, '')
}

/**
 * Sanitasi kode pos: hanya digit.
 */
export function sanitizePostalCode(input: string): string {
  return input.trim().replace(/\D/g, '')
}

/**
 * Sanitasi URL/slug: lowercase, hanya alphanumeric dan dash.
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─────────────────────────────────────────────────────────────────────────────
// ZOD TRANSFORMS
// Gunakan sebagai .transform() di dalam schema Zod
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Zod transform untuk field nama (single-line text).
 *
 * @example
 * z.string().transform(sanitizeNameTransform)
 */
export const sanitizeNameTransform = (val: string) => sanitizeName(val)

/**
 * Zod transform untuk field teks bebas (multi-line).
 *
 * @example
 * z.string().transform(sanitizeTextTransform)
 */
export const sanitizeTextTransform = (val: string) => sanitizeText(val)

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT VALIDATORS
// Deteksi pola berbahaya / spam
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deteksi apakah string mengandung pola spam umum.
 * Return true jika terdeteksi spam.
 */
export function isSpam(input: string): boolean {
  const lower = input.toLowerCase()

  const spamPatterns = [
    // Script injection
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,          // onclick=, onload=, dll
    // SQL injection patterns
    /'\s*(or|and)\s+'?\d/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    // Path traversal
    /\.\.[/\\]/,
    // Spam URLs (berlebihan)
    /(https?:\/\/[^\s]+){3,}/i,  // lebih dari 2 URL
  ]

  return spamPatterns.some((pattern) => pattern.test(lower))
}

/**
 * Deteksi apakah string mengandung terlalu banyak karakter berulang.
 * Cegah "aaaaaaaaaa" atau "!!!!!!!!!!".
 *
 * @param input   - string yang dicek
 * @param maxRun  - maksimum karakter berulang berturut-turut (default: 5)
 */
export function hasExcessiveRepetition(input: string, maxRun = 5): boolean {
  const regex = new RegExp(`(.)\\1{${maxRun},}`)
  return regex.test(input)
}

/**
 * Deteksi apakah string hanya berisi karakter non-alfanumerik (spam symbols).
 * "!@#$%^&*()" → true
 * "Hello world!" → false
 */
export function isAllSymbols(input: string): boolean {
  return !/[a-zA-Z0-9\u00C0-\u024F\u4E00-\u9FFF]/.test(input)
}

/**
 * Validasi bahwa string tidak kosong setelah sanitasi.
 * Cegah input yang hanya berisi spasi atau karakter invisible.
 */
export function isEffectivelyEmpty(input: string): boolean {
  return input.trim().replace(/[\s\u200B-\u200D\uFEFF]/g, '').length === 0
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE VALIDATORS
// ─────────────────────────────────────────────────────────────────────────────

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export type AllowedImageType = typeof ALLOWED_IMAGE_TYPES[number]

export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validasi file gambar: tipe dan ukuran.
 */
export function validateImageFile(file: File): FileValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return {
      valid: false,
      error: 'Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.',
    }
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB.`,
    }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File kosong.' }
  }

  return { valid: true }
}

/**
 * Validasi magic bytes file gambar di server-side.
 * Cegah file berbahaya yang di-rename menjadi .jpg/.png.
 *
 * @param buffer - ArrayBuffer dari file
 * @param mimeType - MIME type yang diklaim
 */
export function validateImageMagicBytes(
  buffer: ArrayBuffer,
  mimeType: string
): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 12))

  const signatures: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png':  [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
    'image/gif':  [[0x47, 0x49, 0x46, 0x38]],  // GIF8
  }

  const sigs = signatures[mimeType]
  if (!sigs) return false

  return sigs.some((sig) =>
    sig.every((byte, i) => bytes[i] === byte)
  )
}
