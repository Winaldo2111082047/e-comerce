import Image from 'next/image'
import { getBlurUrl } from '@/lib/cloudinary'
import { cn } from '@/lib/utils'

interface ProductImageProps {
  src: string | null | undefined
  alt: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  className?: string
  containerClassName?: string
}

/**
 * Reusable product image dengan:
 * - Blur placeholder otomatis dari Cloudinary
 * - Fallback SVG jika tidak ada gambar
 * - Lazy loading default (priority=false)
 */
export default function ProductImage({
  src,
  alt,
  fill = true,
  width,
  height,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  priority = false,
  className,
  containerClassName,
}: ProductImageProps) {
  const isCloudinary = src?.includes('cloudinary.com')
  const blurDataURL = isCloudinary ? getBlurUrl(src!) : undefined

  if (!src) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-50', containerClassName)}>
        <svg
          className="h-12 w-12 text-gray-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    )
  }

  const imageProps = {
    src,
    alt,
    className: cn('object-cover', className),
    priority,
    ...(blurDataURL && {
      placeholder: 'blur' as const,
      blurDataURL,
    }),
  }

  if (fill) {
    return (
      <Image
        {...imageProps}
        fill
        sizes={sizes}
      />
    )
  }

  return (
    <Image
      {...imageProps}
      width={width ?? 400}
      height={height ?? 400}
    />
  )
}
