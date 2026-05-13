import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 dark:bg-gray-950 text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 dark:bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-blue-900/10 dark:bg-blue-800/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-600/20 dark:bg-blue-500/10 border border-blue-500/30 dark:border-blue-400/20 rounded-full px-4 py-1.5 text-sm text-blue-300 dark:text-blue-400 mb-6">
            <span className="w-2 h-2 bg-blue-400 dark:bg-blue-300 rounded-full animate-pulse" />
            Pengiriman ke seluruh Indonesia
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Belanja Lebih{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">
              Mudah
            </span>{' '}
            &amp; Hemat
          </h1>

          <p className="text-lg text-slate-400 dark:text-slate-300 mb-10 max-w-xl mx-auto leading-relaxed">
            Temukan ribuan produk berkualitas dengan harga terbaik. Belanja aman, cepat, dan terpercaya.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 hover:-translate-y-0.5"
            >
              Mulai Belanja
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 dark:bg-white/5 hover:bg-white/15 dark:hover:bg-white/10 border border-white/20 dark:border-white/10 text-white font-semibold px-8 py-3.5 rounded-xl transition-all backdrop-blur-sm"
            >
              Daftar Gratis
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/10 dark:border-white/5 pt-10">
            {[
              { value: '10K+', label: 'Produk' },
              { value: '50K+', label: 'Pelanggan' },
              { value: '99%', label: 'Kepuasan' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400 dark:text-slate-300 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
