import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hkdf } from '@panva/hkdf'
import { jwtDecrypt } from 'jose'

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE PROTECTION - TokoKita E-Commerce
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * NextAuth v5 Session Decryption
 * - Encryption: A256CBC-HS512 (JWE)
 * - Key derivation: HKDF-SHA256
 * - Cookie: authjs.session-token (http) | __Secure-authjs.session-token (https)
 */

interface SessionPayload {
  id?: string
  role?: string
  email?: string
  name?: string
  exp?: number
  iat?: number
}

/**
 * Derive encryption key for NextAuth session decryption
 */
async function getDerivedKey(secret: string, salt: string): Promise<Uint8Array> {
  return hkdf(
    'sha256',
    secret,
    salt,
    `Auth.js Generated Encryption Key (${salt})`,
    64 // A256CBC-HS512 requires 64 bytes
  )
}

/**
 * Extract and decrypt NextAuth session from request cookies
 */
async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    console.warn('AUTH_SECRET not found in environment variables')
    return null
  }

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
    return payload as SessionPayload
  } catch (error) {
    console.warn('Failed to decrypt session token:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

/**
 * Create redirect response with return URL
 */
function createRedirect(request: NextRequest, destination: string, preserveReturnUrl = true): NextResponse {
  const url = new URL(destination, request.url)
  
  if (preserveReturnUrl && destination === '/login') {
    url.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search)
  }
  
  return NextResponse.redirect(url)
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy (basic)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )
  
  return response
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const fullPath = pathname + search
  
  // Skip middleware for static files and API routes (except protected ones)
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Get session
  const session = await getSessionFromRequest(request)
  const isLoggedIn = !!session
  const isAdmin = session?.role === 'ADMIN'
  const isUser = session?.role === 'USER'

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ADMIN ROUTES PROTECTION
  // ─────────────────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      return createRedirect(request, '/login')
    }
    
    if (!isAdmin) {
      return createRedirect(request, '/', false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. USER PROTECTED ROUTES
  // ─────────────────────────────────────────────────────────────────────────────
  const userProtectedRoutes = [
    '/cart',
    '/checkout',
    '/orders',
    '/profile',
    '/wishlist'
  ]
  
  const isUserProtected = userProtectedRoutes.some(route => pathname.startsWith(route))
  
  if (isUserProtected && !isLoggedIn) {
    return createRedirect(request, '/login')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. API ROUTES PROTECTION
  // ─────────────────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    // Admin API routes
    if (pathname.startsWith('/api/admin/')) {
      if (!isLoggedIn || !isAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Admin access required' },
          { status: 401 }
        )
      }
    }
    
    // User API routes
    const userApiRoutes = ['/api/cart/', '/api/orders/', '/api/profile/', '/api/wishlist/']
    const isUserApiProtected = userApiRoutes.some(route => pathname.startsWith(route))
    
    if (isUserApiProtected && !isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. AUTH REDIRECT (Logged in users)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')
    const redirectTo = callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. ROLE-BASED REDIRECTS
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Redirect admin to dashboard if accessing root
  if (isAdmin && pathname === '/') {
    return createRedirect(request, '/admin', false)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. SECURITY HEADERS & RESPONSE
  // ─────────────────────────────────────────────────────────────────────────────
  const response = NextResponse.next()
  
  // Add security headers
  addSecurityHeaders(response)
  
  // Add user context headers for debugging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-User-Id', session?.id || 'anonymous')
    response.headers.set('X-User-Role', session?.role || 'guest')
  }

  return response
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - API auth routes (handled by NextAuth)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}