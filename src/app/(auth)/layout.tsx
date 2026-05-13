import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <Link href="/" className="mb-8 text-2xl font-bold text-blue-600">
        TokoKita
      </Link>
      {children}
    </div>
  )
}
