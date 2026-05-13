import Link from 'next/link'

const links = {
  belanja: [
    { label: 'Semua Produk', href: '/products' },
    { label: 'Kategori', href: '/products' },
    { label: 'Penawaran', href: '/products' },
  ],
  akun: [
    { label: 'Masuk', href: '/login' },
    { label: 'Daftar', href: '/register' },
    { label: 'Profil Saya', href: '/profile' },
    { label: 'Pesanan Saya', href: '/orders' },
  ],
  bantuan: [
    { label: 'Cara Belanja', href: '#' },
    { label: 'Pengiriman', href: '#' },
    { label: 'Pengembalian', href: '#' },
    { label: 'Hubungi Kami', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">
                Toko<span className="text-blue-400">Kita</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-500 mb-6">
              Platform belanja online terpercaya dengan ribuan produk berkualitas dan harga terbaik.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {['instagram', 'twitter', 'facebook'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-colors"
                  aria-label={social}
                >
                  <svg className="h-4 w-4 text-slate-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Belanja</h4>
            <ul className="space-y-2.5">
              {links.belanja.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Akun</h4>
            <ul className="space-y-2.5">
              {links.akun.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Bantuan</h4>
            <ul className="space-y-2.5">
              {links.bantuan.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} TokoKita. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <a href="#" className="hover:text-slate-400 transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Syarat &amp; Ketentuan</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
