import type { Metadata } from 'next'
import RegisterForm from './RegisterForm'

export const metadata: Metadata = { title: 'Daftar' }

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Buat Akun</h1>
        <p className="text-sm text-gray-500 mb-6">Daftar gratis dan mulai belanja!</p>
        <RegisterForm />
      </div>
    </div>
  )
}
