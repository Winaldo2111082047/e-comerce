'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { CategorySchema, type FormState } from '@/lib/definitions'
import { slugify } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCategory(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin()

  const parsed = CategorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  })

  if (!parsed.success) {
    return {
      errors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v ?? []])
      ) as Record<string, string[]>,
    }
  }

  const { name, description } = parsed.data
  const slug = slugify(name)

  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) {
    return { errors: { name: ['Nama kategori sudah digunakan.'] } }
  }

  await prisma.category.create({ data: { name, slug, description } })

  revalidatePath('/admin/categories')
  revalidatePath('/')
  redirect('/admin/categories')
}

export async function updateCategory(
  id: string,
  state: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin()

  const parsed = CategorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  })

  if (!parsed.success) {
    return {
      errors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v ?? []])
      ) as Record<string, string[]>,
    }
  }

  const { name, description } = parsed.data

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) return { message: 'Kategori tidak ditemukan.' }

  let slug = category.slug
  if (name !== category.name) {
    slug = slugify(name)
    const conflict = await prisma.category.findFirst({
      where: { slug, NOT: { id } },
    })
    if (conflict) {
      return { errors: { name: ['Nama kategori sudah digunakan.'] } }
    }
  }

  await prisma.category.update({
    where: { id },
    data: { name, slug, description },
  })

  revalidatePath('/admin/categories')
  revalidatePath('/')
  redirect('/admin/categories')
}

export async function deleteCategory(id: string) {
  await requireAdmin()

  const productCount = await prisma.product.count({ where: { categoryId: id } })
  if (productCount > 0) {
    return { error: `Tidak bisa dihapus. Ada ${productCount} produk di kategori ini.` }
  }

  await prisma.category.delete({ where: { id } })
  revalidatePath('/admin/categories')
  revalidatePath('/')
  return { success: true }
}
