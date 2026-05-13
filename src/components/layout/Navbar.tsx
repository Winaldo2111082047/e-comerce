import Link from 'next/link'
import { auth } from '@/lib/auth'
import NavbarClient from './NavbarClient'
import CartStoreInitializer from '@/stores/initializers/CartStoreInitializer'
import { getCartItemCount } from '@/services'

export default async function Navbar() {
  const session = await auth()

  // Ambil jumlah item di cart untuk badge
  let cartCount = 0
  if (session?.user?.id) {
    cartCount = await getCartItemCount(session.user.id)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Toko<span className="text-blue-600">Kita</span>
            </span>
          </Link>

          {/* Search bar — desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form action="/products" method="GET" className="w-full">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  name="q"
                  placeholder="Cari produk, kategori..."
                  className="w-full rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500 transition-all focus:border-blue-400 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50"
                />
              </div>
            </form>
          </div>

          {/* Right side */}
          <NavbarClient session={session} cartCount={cartCount} />
        </div>
      </div>
      {/* Inisialisasi cart store dari server — update badge realtime */}
      <CartStoreInitializer count={cartCount} />
    </header>
  )
}
