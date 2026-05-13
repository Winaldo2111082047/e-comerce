import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hkdf } from '@panva/hkdf'
import { jwtDecrypt } from 'jose'
import { rateLimit, applyRateLimitHeaders } from '@/lib/rate-limit'

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Halaman yang hanya bisa diakses ADMIN */
const ADMIN_ROUTES = ['/admin']

/** Halaman yang butuh login (user biasa) */
const PROTECTED_ROUTES = ['/cart', '/checkout', '/orders', '/wishlist', '/profile']

/** Halaman auth — redirect ke home jika sudah login */
const AUTH_ROUTES = ['/login', '/register']

/** API routes yang butuh autentikasi */
const PROTECTED_API_ROUTES = ['/api/cart', '/api/orders', '/api/checkout', '/api/wishlist']

/** API routes yang hanya bisa diakses ADMIN */
const ADMIN_API_ROUTES = ['/api/admin']

// ─────────────────────────────────────────────────────────────────────────────
// SESSION DECRYPTION
// NextAuth v5 menggunakan JWE (A256CBC-HS512) dengan HKDF key derivation.
// Kita decrypt manual di proxy karena tidak bisa import @auth/core di edge.
// ─────────────────────────────────────────────────────────────────────────────

type SessionPayload = {
  id?: string
  role?: string
  email?: string
  name?: string
  exp?: number
}

async function getDerivedKey(secret: string, salt: string): Promise<Uint8Array> {
  return hkdf(
    'sha256',
    secret,
    salt,
    `Auth.js Generated Encryption Key (${salt})`,
    64 // A256CBC-HS512 butuh 64 bytes
  )
}

async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const secret = process.env.AUTH_SECRET
  if (!secret) return null

  const isSecure = request.nextUrl.protocol === 'https:'
  const cookieName = isSecure
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token'

  const token = request.cookies.get(cookieName)?.value
  if (!token) return null

  try {
    const encryptionKey = await getDerivedKey(secret, cookieName)
    const { payload } = await jwtDecrypt(token, encryptionKey, {
      clockTolerance: 15,
      keyManagementAlgorithms: ['dir'],
      contentEncryptionAlgorithms: ['A256CBC-HS512', 'A256GCM'],
    })

    // Validasi expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload as SessionPayload
  } catch {
    // Token invalid / expired / tampered — treat as unauthenticated
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY HEADERS
// Best practice: tambahkan security headers ke semua response
// ─────────────────────────────────────────────────────────────────────────────

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Permissions policy — disable unused browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  )
  // XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')
  return response
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST VALIDATION
// Validasi dasar request sebelum diteruskan ke handler
// ─────────────────────────────────────────────────────────────────────────────

const MAX_BODY_SIZE = 10 * 1024 * 1024 // 10MB

function validateRequest(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname
  const method = request.method

  // Cegah request body terlalu besar
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return NextResponse.json({ error: 'Request terlalu besar.' }, { status: 413 })
  }

  // Cegah path traversal di URL
  if (pathname.includes('..') || pathname.includes('%2e%2e')) {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  // Cegah null bytes di URL
  if (pathname.includes('\x00') || pathname.includes('%00')) {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  // Validasi Content-Type untuk mutasi API
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH'].includes(method)) {
    const ct = request.headers.get('content-type') ?? ''
    const isValid =
      ct.includes('application/json') ||
      ct.includes('multipart/form-data') ||
      ct.includes('application/x-www-form-urlencoded')
    if (!isValid) {
      return NextResponse.json({ error: 'Content-Type tidak didukung.' }, { status: 415 })
    }
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Ambil IP dari request — support proxy/load balancer */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

function matchesAny(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

function redirectTo(url: string, request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL(url, request.url))
  return addSecurityHeaders(response)
}

function forbidden(message = 'Forbidden'): NextResponse {
  const response = NextResponse.json({ error: message }, { status: 403 })
  return addSecurityHeaders(response)
}

function unauthorized(message = 'Unauthorized'): NextResponse {
  const response = NextResponse.json({ error: message }, { status: 401 })
  return addSecurityHeaders(response)
}

function tooManyRequests(retryAfter: number, message: string): NextResponse {
  const response = NextResponse.json(
    { error: 'Too Many Requests', message },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    }
  )
  return addSecurityHeaders(response)
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PROXY FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method
  const isApiRoute = pathname.startsWith('/api/')
  const ip = getClientIp(request)

  // ── 0. Validasi request dasar ──────────────────────────────────────────────
  const validationError = validateRequest(request)
  if (validationError) return addSecurityHeaders(validationError)

  // ── 1. RATE LIMITING — sebelum auth check ─────────────────────────────────

  // Auth endpoints — limit ketat untuk cegah brute force
  if (pathname === '/api/auth/callback/credentials' || pathname.startsWith('/api/auth/signin')) {
    const rl = rateLimit(ip, 'login')
    if (!rl.allowed) {
      return tooManyRequests(
        rl.retryAfter,
        `Terlalu banyak percobaan login. Coba lagi dalam ${rl.retryAfter} detik.`
      )
    }
  }

  // Halaman login/register — limit untuk cegah form spam
  if (pathname === '/login' && method === 'POST') {
    const rl = rateLimit(ip, 'login')
    if (!rl.allowed) {
      return tooManyRequests(rl.retryAfter, `Coba lagi dalam ${rl.retryAfter} detik.`)
    }
  }

  if (pathname === '/register' && method === 'POST') {
    const rl = rateLimit(ip, 'register')
    if (!rl.allowed) {
      return tooManyRequests(rl.retryAfter, `Coba lagi dalam ${rl.retryAfter} detik.`)
    }
  }

  // API publik — limit moderat
  if (isApiRoute) {
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const rl = rateLimit(ip, isMutation ? 'apiMutate' : 'apiPublic')
    if (!rl.allowed) {
      const res = tooManyRequests(
        rl.retryAfter,
        `Rate limit exceeded. Retry after ${rl.retryAfter} seconds.`
      )
      applyRateLimitHeaders(res.headers, rl)
      return res
    }
    // Tambahkan rate limit headers ke response sukses juga
    // (dilakukan di bawah setelah auth check)
  }

  // Global rate limit — cegah DDoS sederhana
  const globalRl = rateLimit(ip, 'global')
  if (!globalRl.allowed) {
    return tooManyRequests(
      globalRl.retryAfter,
      `Terlalu banyak request. Coba lagi dalam ${globalRl.retryAfter} detik.`
    )
  }

  // Decode session dari cookie (tanpa DB call — pure JWT)
  const session = await getSessionFromRequest(request)
  const isLoggedIn = !!session
  const isAdmin = session?.role === 'ADMIN'

  // ── 1. PROTEKSI API ADMIN ──────────────────────────────────────────────────
  if (matchesAny(pathname, ADMIN_API_ROUTES)) {
    if (!isLoggedIn) return unauthorized('Login diperlukan.')
    if (!isAdmin) return forbidden('Akses ditolak. Hanya admin.')
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // ── 2. PROTEKSI API USER ───────────────────────────────────────────────────
  if (matchesAny(pathname, PROTECTED_API_ROUTES)) {
    if (!isLoggedIn) return unauthorized('Login diperlukan.')
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // ── 3. Skip security headers untuk API publik (products, auth) ────────────
  if (isApiRoute) {
    const response = NextResponse.next()
    // Tambahkan rate limit headers agar client bisa monitor
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const rl = rateLimit(ip, isMutation ? 'apiMutate' : 'apiPublic')
    applyRateLimitHeaders(response.headers, rl)
    return addSecurityHeaders(response)
  }

  // ── 4. PROTEKSI HALAMAN ADMIN ──────────────────────────────────────────────
  if (matchesAny(pathname, ADMIN_ROUTES)) {
    if (!isLoggedIn) {
      // Simpan URL tujuan agar bisa redirect balik setelah login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return redirectTo(loginUrl.toString(), request)
    }
    if (!isAdmin) {
      // User login tapi bukan admin — redirect ke home dengan pesan
      return redirectTo('/?error=forbidden', request)
    }
  }

  // ── 5. PROTEKSI HALAMAN USER ───────────────────────────────────────────────
  if (matchesAny(pathname, PROTECTED_ROUTES)) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return redirectTo(loginUrl.toString(), request)
    }
  }

  // ── 6. REDIRECT JIKA SUDAH LOGIN (halaman auth) ───────────────────────────
  if (matchesAny(pathname, AUTH_ROUTES) && isLoggedIn) {
    // Admin langsung ke dashboard, user biasa ke home
    return redirectTo(isAdmin ? '/admin' : '/', request)
  }

  // ── 7. Lanjutkan request + tambahkan security headers ─────────────────────
  const response = NextResponse.next()

  // Inject info session ke request header agar bisa dibaca Server Components
  // tanpa perlu decrypt ulang (opsional, untuk optimasi)
  if (session?.id) {
    response.headers.set('x-user-id', session.id)
    response.headers.set('x-user-role', session.role ?? 'USER')
  }

  return addSecurityHeaders(response)
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHER CONFIG
// Jalankan proxy untuk semua route kecuali static assets
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match semua path kecuali:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata)
     * - public folder (images, icons, dll)
     *
     * Note: _next/data TIDAK dikecualikan secara sengaja agar
     * proteksi halaman juga berlaku untuk RSC data requests.
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
      missing: [
        // Skip untuk prefetch requests yang tidak perlu auth check
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
    // Tetap jalankan untuk prefetch admin/protected routes
    {
      source: '/(admin|cart|checkout|orders|wishlist|profile|api/admin|api/cart|api/orders)(.*)',
    },
  ],
}
