import { z } from 'zod'
import {
  sanitizeNameTransform,
  sanitizeTextTransform,
  sanitizeEmail,
  sanitizePhone,
  sanitizePostalCode,
  isSpam,
  hasExcessiveRepetition,
  isEffectivelyEmpty,
} from '@/lib/sanitize'

// ─────────────────────────────────────────────────────────────────────────────
// ZOD REFINEMENTS — reusable
// ─────────────────────────────────────────────────────────────────────────────

/** Cegah input yang hanya spasi / invisible chars */
const notEffectivelyEmpty = (val: string) => !isEffectivelyEmpty(val)

/** Cegah pola spam / injection */
const noSpam = (val: string) => !isSpam(val)

/** Cegah karakter berulang berlebihan */
const noExcessiveRepetition = (val: string) => !hasExcessiveRepetition(val)

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Nama minimal 2 karakter.' })
    .max(100, { message: 'Nama maksimal 100 karakter.' })
    .transform(sanitizeNameTransform)
    .refine(notEffectivelyEmpty, { message: 'Nama tidak boleh kosong.' })
    .refine(noSpam, { message: 'Nama mengandung karakter tidak valid.' })
    .refine(noExcessiveRepetition, { message: 'Nama tidak valid.' }),
  email: z
    .string()
    .min(1, { message: 'Email wajib diisi.' })
    .max(255, { message: 'Email terlalu panjang.' })
    .transform(sanitizeEmail)
    .pipe(z.string().email({ message: 'Format email tidak valid.' })),
  password: z
    .string()
    .min(8, { message: 'Password minimal 8 karakter.' })
    .max(72, { message: 'Password maksimal 72 karakter.' })
    .regex(/[a-zA-Z]/, { message: 'Password harus mengandung huruf.' })
    .regex(/[0-9]/, { message: 'Password harus mengandung angka.' }),
})

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email wajib diisi.' })
    .max(255)
    .transform(sanitizeEmail)
    .pipe(z.string().email({ message: 'Format email tidak valid.' })),
  password: z.string().min(1, { message: 'Password wajib diisi.' }).max(72),
})

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT
// ─────────────────────────────────────────────────────────────────────────────

export const ProductSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Nama produk minimal 3 karakter.' })
    .max(200, { message: 'Nama produk maksimal 200 karakter.' })
    .transform(sanitizeNameTransform)
    .refine(notEffectivelyEmpty, { message: 'Nama produk tidak boleh kosong.' })
    .refine(noSpam, { message: 'Nama produk mengandung karakter tidak valid.' })
    .refine(noExcessiveRepetition, { message: 'Nama produk tidak valid.' }),
  description: z
    .string()
    .min(20, { message: 'Deskripsi minimal 20 karakter.' })
    .max(2000, { message: 'Deskripsi maksimal 2000 karakter.' })
    .transform(sanitizeTextTransform)
    .refine(notEffectivelyEmpty, { message: 'Deskripsi tidak boleh kosong.' })
    .refine(noSpam, { message: 'Deskripsi mengandung konten tidak valid.' })
    .refine(noExcessiveRepetition, { message: 'Deskripsi tidak valid.' }),
  price: z.coerce
    .number({ message: 'Harga harus berupa angka.' })
    .positive({ message: 'Harga harus lebih dari 0.' })
    .max(999_999_999, { message: 'Harga terlalu besar.' }),
  stock: z.coerce
    .number({ message: 'Stok harus berupa angka.' })
    .int({ message: 'Stok harus bilangan bulat.' })
    .min(0, { message: 'Stok tidak boleh negatif.' })
    .max(999_999, { message: 'Stok terlalu besar.' }),
  categoryId: z
    .string()
    .min(1, { message: 'Kategori wajib dipilih.' })
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, { message: 'ID kategori tidak valid.' }),
  weight: z.coerce
    .number()
    .int()
    .min(0, { message: 'Berat tidak boleh negatif.' })
    .max(999_999)
    .optional()
    .nullable(),
})

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY
// ─────────────────────────────────────────────────────────────────────────────

export const CategorySchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Nama kategori minimal 2 karakter.' })
    .max(100, { message: 'Nama kategori maksimal 100 karakter.' })
    .transform(sanitizeNameTransform)
    .refine(notEffectivelyEmpty, { message: 'Nama kategori tidak boleh kosong.' })
    .refine(noSpam, { message: 'Nama kategori mengandung karakter tidak valid.' }),
  description: z
    .string()
    .max(500, { message: 'Deskripsi maksimal 500 karakter.' })
    .transform(sanitizeTextTransform)
    .refine((val) => !isSpam(val), { message: 'Deskripsi mengandung konten tidak valid.' })
    .optional()
    .or(z.literal('')),
})

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW
// ─────────────────────────────────────────────────────────────────────────────

export const ReviewSchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, { message: 'Rating minimal 1 bintang.' })
    .max(5, { message: 'Rating maksimal 5 bintang.' }),
  comment: z
    .string()
    .max(1000, { message: 'Komentar maksimal 1000 karakter.' })
    .transform(sanitizeTextTransform)
    .refine((val) => !isSpam(val), { message: 'Komentar mengandung konten tidak valid.' })
    .refine((val) => !hasExcessiveRepetition(val), { message: 'Komentar tidak valid.' })
    .optional()
    .or(z.literal('')),
})

// ─────────────────────────────────────────────────────────────────────────────
// CHECKOUT
// ─────────────────────────────────────────────────────────────────────────────

export const CheckoutSchema = z.object({
  recipient: z
    .string()
    .min(2, { message: 'Nama penerima minimal 2 karakter.' })
    .max(100)
    .transform(sanitizeNameTransform)
    .refine(notEffectivelyEmpty, { message: 'Nama penerima tidak boleh kosong.' })
    .refine(noSpam, { message: 'Nama penerima tidak valid.' }),
  phone: z
    .string()
    .min(9, { message: 'Nomor telepon minimal 9 digit.' })
    .max(15, { message: 'Nomor telepon maksimal 15 digit.' })
    .transform(sanitizePhone)
    .pipe(
      z.string().regex(/^[0-9+\-\s]+$/, { message: 'Nomor telepon hanya boleh angka.' })
    ),
  street: z
    .string()
    .min(5, { message: 'Alamat jalan minimal 5 karakter.' })
    .max(300)
    .transform(sanitizeTextTransform)
    .refine(notEffectivelyEmpty, { message: 'Alamat tidak boleh kosong.' })
    .refine(noSpam, { message: 'Alamat tidak valid.' }),
  city: z
    .string()
    .min(2, { message: 'Kota wajib diisi.' })
    .max(100)
    .transform(sanitizeNameTransform)
    .refine(notEffectivelyEmpty, { message: 'Kota tidak boleh kosong.' }),
  province: z
    .string()
    .min(2, { message: 'Provinsi wajib diisi.' })
    .max(100)
    .transform(sanitizeNameTransform)
    .refine(notEffectivelyEmpty, { message: 'Provinsi tidak boleh kosong.' }),
  postalCode: z
    .string()
    .transform(sanitizePostalCode)
    .pipe(
      z.string()
        .length(5, { message: 'Kode pos harus 5 digit.' })
        .regex(/^\d+$/, { message: 'Kode pos hanya boleh angka.' })
    ),
  notes: z
    .string()
    .max(500, { message: 'Catatan maksimal 500 karakter.' })
    .transform(sanitizeTextTransform)
    .refine((val) => !isSpam(val), { message: 'Catatan mengandung konten tidak valid.' })
    .optional()
    .or(z.literal('')),
  paymentMethod: z.enum(['BANK_TRANSFER', 'E_WALLET', 'COD', 'QRIS'], {
    message: 'Pilih metode pembayaran.',
  }),
})

export const AddressSchema = z.object({
  label: z
    .string()
    .min(1, { message: 'Label wajib diisi.' })
    .max(50)
    .transform(sanitizeNameTransform)
    .refine(notEffectivelyEmpty, { message: 'Label tidak boleh kosong.' }),
  recipient: z
    .string()
    .min(2, { message: 'Nama penerima minimal 2 karakter.' })
    .max(100)
    .transform(sanitizeNameTransform)
    .refine(notEffectivelyEmpty, { message: 'Nama penerima tidak boleh kosong.' }),
  phone: z
    .string()
    .min(9, { message: 'Nomor telepon minimal 9 digit.' })
    .max(15)
    .transform(sanitizePhone)
    .pipe(z.string().regex(/^[0-9+\-\s]+$/)),
  street: z
    .string()
    .min(5, { message: 'Alamat jalan minimal 5 karakter.' })
    .max(300)
    .transform(sanitizeTextTransform)
    .refine(notEffectivelyEmpty, { message: 'Alamat tidak boleh kosong.' }),
  city: z
    .string()
    .min(2, { message: 'Kota wajib diisi.' })
    .max(100)
    .transform(sanitizeNameTransform),
  province: z
    .string()
    .min(2, { message: 'Provinsi wajib diisi.' })
    .max(100)
    .transform(sanitizeNameTransform),
  postalCode: z
    .string()
    .transform(sanitizePostalCode)
    .pipe(z.string().length(5).regex(/^\d+$/)),
  isDefault: z.coerce.boolean().optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// SHARED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type FormState =
  | {
      errors?: Record<string, string[]>
      message?: string
      success?: boolean
    }
  | undefined

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type ProductInput = z.infer<typeof ProductSchema>
export type CategoryInput = z.infer<typeof CategorySchema>
export type CheckoutInput = z.infer<typeof CheckoutSchema>
export type ReviewInput = z.infer<typeof ReviewSchema>
