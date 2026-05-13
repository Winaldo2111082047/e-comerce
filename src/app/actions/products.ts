'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { ProductSchema, type FormState } from '@/lib/definitions'
import { slugify } from '@/lib/utils'
import { uploadImage, deleteImage, getPublicId } from '@/lib/cloudinary'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── CREATE ────────────────────────────────────────────────────────────────────
export async function createProduct(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin()

  const parsed = ProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    stock: formData.get('stock'),
    categoryId: formData.get('categoryId'),
    weight: formData.get('weight'),
  })

  if (!parsed.success) {
    return {
      errors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v ?? []])
      ) as Record<string, string[]>,
    }
  }

  const { name, description, price, stock, categoryId, weight } = parsed.data

  // Handle image upload
  let imageUrl: string | undefined
  const imageFile = formData.get('image') as File | null
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadImage(imageFile)
    } catch {
      return { message: 'Gagal upload gambar. Coba lagi.' }
    }
  }

  // Generate unique slug
  let slug = slugify(name)
  const existing = await prisma.product.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      stock,
      categoryId,
      weight: weight ?? null,
      image: imageUrl,
      isActive: true,
    },
  })

  revalidatePath('/admin/products')
  revalidatePath('/')
  revalidatePath('/products')
  redirect('/admin/products')
}

// ── UPDATE ────────────────────────────────────────────────────────────────────
export async function updateProduct(
  id: string,
  state: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin()

  const parsed = ProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    stock: formData.get('stock'),
    categoryId: formData.get('categoryId'),
    weight: formData.get('weight'),
  })

  if (!parsed.success) {
    return {
      errors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v ?? []])
      ) as Record<string, string[]>,
    }
  }

  const { name, description, price, stock, categoryId, weight } = parsed.data

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return { message: 'Produk tidak ditemukan.' }

  // Handle image upload
  let imageUrl = product.image
  const imageFile = formData.get('image') as File | null
  if (imageFile && imageFile.size > 0) {
    try {
      // Delete old image from Cloudinary if exists
      if (product.image?.includes('cloudinary.com')) {
        await deleteImage(getPublicId(product.image)).catch(() => {})
      }
      imageUrl = await uploadImage(imageFile)
    } catch {
      return { message: 'Gagal upload gambar. Coba lagi.' }
    }
  }

  // Update slug only if name changed
  let slug = product.slug
  if (name !== product.name) {
    slug = slugify(name)
    const conflict = await prisma.product.findFirst({
      where: { slug, NOT: { id } },
    })
    if (conflict) slug = `${slug}-${Date.now()}`
  }

  await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      price,
      stock,
      categoryId,
      weight: weight ?? null,
      image: imageUrl,
    },
  })

  revalidatePath('/admin/products')
  revalidatePath(`/products/${slug}`)
  revalidatePath('/')
  redirect('/admin/products')
}

// ── TOGGLE ACTIVE ─────────────────────────────────────────────────────────────
export async function toggleProductActive(id: string, isActive: boolean) {
  await requireAdmin()
  await prisma.product.update({ where: { id }, data: { isActive } })
  revalidatePath('/admin/products')
  revalidatePath('/')
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function deleteProduct(id: string) {
  await requireAdmin()

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return { error: 'Produk tidak ditemukan.' }

  // Delete image from Cloudinary
  if (product.image?.includes('cloudinary.com')) {
    await deleteImage(getPublicId(product.image)).catch(() => {})
  }

  await prisma.product.delete({ where: { id } })

  revalidatePath('/admin/products')
  revalidatePath('/')
  return { success: true }
}
