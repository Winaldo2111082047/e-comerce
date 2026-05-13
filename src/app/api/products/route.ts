import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { guardAdmin } from '@/lib/auth-guard'
import { handleApiError, apiSuccess } from '@/lib/api-error'

const ITEMS_PER_PAGE = 12

function buildOrderBy(sort?: string) {
  switch (sort) {
    case 'price_asc':  return { price: 'asc' as const }
    case 'price_desc': return { price: 'desc' as const }
    case 'name_asc':   return { name: 'asc' as const }
    default:           return { createdAt: 'desc' as const }
  }
}

/**
 * GET /api/products
 * Query params: q, category, page, sort, limit
 *
 * Dipakai oleh infinite scroll client component.
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const { searchParams } = request.nextUrl
    const q = searchParams.get('q') ?? undefined
    const category = searchParams.get('category') ?? undefined
    const sort = searchParams.get('sort') ?? undefined
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(48, Number(searchParams.get('limit')) || ITEMS_PER_PAGE)
    const skip = (page - 1) * limit

    const where = {
      isActive: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { description: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
      ...(category && { category: { slug: category } }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: buildOrderBy(sort),
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stock: true,
          image: true,
          isActive: true,
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages

    return apiSuccess({
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage: page > 1,
      },
    })
  })
}

/**
 * POST /api/products — hanya admin
 * Contoh penggunaan guardAdmin di Route Handler
 */
export async function POST(request: NextRequest) {
  const authResult = await guardAdmin()
  if (authResult instanceof NextResponse) return authResult

  // authResult.userId, authResult.role tersedia di sini
  return NextResponse.json({ error: 'Gunakan Server Actions untuk mutasi produk.' }, { status: 405 })
}

/**
 * DELETE /api/products — hanya admin
 */
export async function DELETE(request: NextRequest) {
  const authResult = await guardAdmin()
  if (authResult instanceof NextResponse) return authResult

  return NextResponse.json({ error: 'Gunakan Server Actions untuk mutasi produk.' }, { status: 405 })
}
