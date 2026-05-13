/**
 * auth-guard.ts
 *
 * Centralized authorization helpers untuk Server Actions dan Route Handlers.
 *
 * PENTING: Proxy (middleware) adalah FIRST LINE of defense — cepat tapi
 * tidak bisa dipercaya sepenuhnya karena berjalan di edge tanpa DB.
 * Guard di sini adalah SECOND LINE of defense — selalu validasi ulang
 * di setiap Server Action / Route Handler yang sensitif.
 *
 * @see https://nextjs.org/docs/app/guides/data-security
 */

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type AuthGuardResult = {
  userId: string
  role: string
  email: string
  name: string
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER ACTION GUARDS
// Gunakan di dalam Server Actions — throw error jika tidak authorized
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pastikan user sudah login.
 * Throw error jika belum — Server Action akan gagal dengan pesan yang aman.
 *
 * @example
 * export async function addToCart(productId: string) {
 *   const { userId } = await requireUser()
 *   // ...
 * }
 */
export async function requireUser(): Promise<AuthGuardResult> {
  const session = await auth()

  if (!session?.user?.id) {
    // Untuk Server Actions yang dipanggil dari form, redirect lebih UX-friendly
    redirect('/login')
  }

  return {
    userId: session.user.id,
    role: session.user.role ?? 'USER',
    email: session.user.email ?? '',
    name: session.user.name ?? '',
  }
}

/**
 * Pastikan user sudah login DAN memiliki role ADMIN.
 * Throw error jika tidak — tidak pernah expose detail ke client.
 *
 * @example
 * export async function deleteProduct(id: string) {
 *   await requireAdmin()
 *   // ...
 * }
 */
export async function requireAdmin(): Promise<AuthGuardResult> {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    // Jangan expose "you need to be admin" — cukup forbidden
    redirect('/?error=forbidden')
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    email: session.user.email ?? '',
    name: session.user.name ?? '',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER GUARDS
// Gunakan di dalam API Route Handlers — return NextResponse jika tidak authorized
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Guard untuk Route Handler — return 401 jika belum login.
 *
 * @example
 * export async function GET() {
 *   const authResult = await guardUser()
 *   if (authResult instanceof NextResponse) return authResult
 *   const { userId } = authResult
 *   // ...
 * }
 */
export async function guardUser(): Promise<AuthGuardResult | NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Login diperlukan.' },
      { status: 401 }
    )
  }

  return {
    userId: session.user.id,
    role: session.user.role ?? 'USER',
    email: session.user.email ?? '',
    name: session.user.name ?? '',
  }
}

/**
 * Guard untuk Route Handler — return 403 jika bukan admin.
 *
 * @example
 * export async function DELETE(req: Request) {
 *   const authResult = await guardAdmin()
 *   if (authResult instanceof NextResponse) return authResult
 *   // ...
 * }
 */
export async function guardAdmin(): Promise<AuthGuardResult | NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Login diperlukan.' },
      { status: 401 }
    )
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Akses ditolak.' },
      { status: 403 }
    )
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    email: session.user.email ?? '',
    name: session.user.name ?? '',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OWNERSHIP GUARD
// Pastikan user hanya bisa akses resource miliknya sendiri
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pastikan user hanya akses resource miliknya, kecuali admin.
 *
 * @example
 * export async function getOrder(orderId: string) {
 *   const order = await prisma.order.findUnique({ where: { id: orderId } })
 *   await requireOwnerOrAdmin(order?.userId)
 *   // ...
 * }
 */
export async function requireOwnerOrAdmin(resourceOwnerId: string | null | undefined): Promise<AuthGuardResult> {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const isAdmin = session.user.role === 'ADMIN'
  const isOwner = session.user.id === resourceOwnerId

  if (!isAdmin && !isOwner) {
    redirect('/?error=forbidden')
  }

  return {
    userId: session.user.id,
    role: session.user.role ?? 'USER',
    email: session.user.email ?? '',
    name: session.user.name ?? '',
  }
}
