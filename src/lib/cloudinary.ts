import { v2 as cloudinary } from 'cloudinary'
import { validateImageFile, validateImageMagicBytes, MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from '@/lib/sanitize'
import { validateCloudinaryEnv } from '@/lib/env'

// Validasi env vars Cloudinary saat module di-load
validateCloudinaryEnv()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ── Upload ────────────────────────────────────────────────────────────────────

export async function uploadImage(
  file: File,
  folder = 'tokokita/products'
): Promise<string> {
  // ── Validasi client-side constraints (tipe & ukuran) ──────────────────────
  const fileValidation = validateImageFile(file)
  if (!fileValidation.valid) {
    throw new Error(fileValidation.error ?? 'File tidak valid.')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // ── Validasi magic bytes (server-side) ────────────────────────────────────
  // Cegah file berbahaya yang di-rename menjadi .jpg/.png
  const isMagicValid = validateImageMagicBytes(bytes, file.type)
  if (!isMagicValid) {
    throw new Error('File bukan gambar yang valid.')
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: 'image',
          // Batasi ukuran di Cloudinary juga (defense in depth)
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          // Transformasi saat upload: resize max 1200px, kualitas auto, format auto
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'))
          resolve(result.secure_url)
        }
      )
      .end(buffer)
  })
}

// Re-export constants untuk dipakai di komponen
export { MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES }

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

// ── URL Helpers ───────────────────────────────────────────────────────────────

/** Extract public_id dari Cloudinary URL */
export function getPublicId(url: string): string {
  // https://res.cloudinary.com/<cloud>/image/upload/v123/<folder>/<id>.ext
  const parts = url.split('/')
  const filename = parts[parts.length - 1].split('.')[0]
  const folder = parts[parts.length - 2]
  return `${folder}/${filename}`
}

/**
 * Generate Cloudinary URL dengan transformasi.
 * Dipakai untuk blur placeholder (ukuran kecil, blur tinggi).
 */
export function getCloudinaryUrl(
  url: string,
  options: {
    width?: number
    height?: number
    quality?: number | 'auto'
    blur?: number
    format?: 'auto' | 'webp' | 'avif' | 'jpg'
    crop?: 'fill' | 'limit' | 'thumb'
  } = {}
): string {
  if (!url.includes('cloudinary.com')) return url

  const {
    width,
    height,
    quality = 'auto',
    blur,
    format = 'auto',
    crop = 'fill',
  } = options

  // Insert transformasi setelah /upload/
  const transforms: string[] = []
  if (width) transforms.push(`w_${width}`)
  if (height) transforms.push(`h_${height}`)
  if (width || height) transforms.push(`c_${crop}`)
  transforms.push(`q_${quality}`)
  transforms.push(`f_${format}`)
  if (blur) transforms.push(`e_blur:${blur}`)

  const transformStr = transforms.join(',')
  return url.replace('/upload/', `/upload/${transformStr}/`)
}

/**
 * Generate blur data URL untuk placeholder.
 * Mengambil versi 10px dari gambar Cloudinary.
 */
export function getBlurUrl(url: string): string {
  return getCloudinaryUrl(url, {
    width: 10,
    height: 10,
    quality: 30,
    blur: 500,
    format: 'webp',
  })
}
