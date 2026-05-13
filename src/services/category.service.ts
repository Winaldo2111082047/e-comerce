/**
 * category.service.ts
 *
 * Query Prisma untuk Category.
 */

import { prisma } from '@/lib/prisma'
import type { Category } from '@/generated/prisma/client'

/**
 * Ambil semua kategori aktif — untuk homepage dan filter sidebar.
 */
export async function getActiveCategories(limit?: number): Promise<Category[]> {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    ...(limit && { take: limit }),
  })
}

/**
 * Ambil semua kategori untuk admin (termasuk nonaktif).
 */
export async function getAllCategories(): Promise<Category[]> {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  })
}

/**
 * Ambil satu kategori by ID.
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  return prisma.category.findUnique({ where: { id } })
}

/**
 * Ambil satu kategori by slug.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return prisma.category.findUnique({ where: { slug } })
}
