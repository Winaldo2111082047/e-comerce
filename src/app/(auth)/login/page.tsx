import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = { title: 'Masuk' }

interface LoginPageProps {
  searchParams: Promise<{ registered?: string; callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { registered } = await searchParams

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Masuk</h1>
        <p className="text-sm text-gray-500 mb-6">Selamat datang kembali!</p>

        {registered === '1' && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            ✅ Akun berhasil dibuat! Silakan masuk.
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  )
}
