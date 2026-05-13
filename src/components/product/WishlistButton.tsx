'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleWishlist } from '@/app/actions/wishlist'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useWishlistStore } from '@/stores/wishlist.store'

interface WishlistButtonProps {
  productId: string
  /** Dipakai sebagai fallback sebelum store diinisialisasi */
  initialWishlisted: boolean
  isLoggedIn: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function WishlistButton({
  productId,
  initialWishlisted,
  isLoggedIn,
  size = 'md',
  className,
}: WishlistButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Gunakan store — semua WishlistButton di halaman yang sama akan sync
  const { isWishlisted, toggle, hydrated } = useWishlistStore()

  // Sebelum store dihydrate, gunakan prop dari server
  const wishlisted = hydrated ? isWishlisted(productId) : initialWishlisted

  const sizeClasses = { sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-10 w-10' }
  const iconSizes = { sm: 'h-3.5 w-3.5', md: 'h-4.5 w-4.5', lg: 'h-5 w-5' }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn) {
      toast.info('Silakan masuk untuk menyimpan wishlist')
      router.push('/login')
      return
    }

    // Optimistic update di store — semua WishlistButton langsung sync
    const isNowWishlisted = toggle(productId)

    startTransition(async () => {
      const result = await toggleWishlist(productId)
      if (!result || !('wishlisted' in result)) {
        // Revert jika server error
        toggle(productId)
        toast.error('Gagal mengubah wishlist')
        return
      }
      if (isNowWishlisted) {
        toast.success('Ditambahkan ke wishlist ❤️')
      } else {
        toast.info('Dihapus dari wishlist')
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={wishlisted ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
      aria-pressed={wishlisted}
      className={cn(
        'flex items-center justify-center rounded-full transition-all duration-200',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        wishlisted
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-white/90 text-gray-400 hover:text-red-400 hover:bg-red-50 backdrop-blur-sm',
        sizeClasses[size],
        className
      )}
    >
      <svg
        className={cn(
          iconSizes[size],
          'transition-all duration-200',
          wishlisted ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-current',
          isPending && 'animate-pulse'
        )}
        viewBox="0 0 24 24"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
