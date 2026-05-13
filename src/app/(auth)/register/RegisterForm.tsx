'use client'

import { useActionState, useState } from 'react'
import { register } from '@/app/actions/auth'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { RegisterSchema } from '@/lib/definitions'

// Validasi satu field saat blur
function validateField(name: string, value: string): string | null {
  const dummy = { name: 'A A', email: 'a@a.com', password: 'Password1' }
  const result = RegisterSchema.safeParse({ ...dummy, [name]: value })
  if (result.success) return null
  const errors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>
  return errors[name]?.[0] ?? null
}

// Kekuatan password
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Lemah', color: 'bg-red-500' }
  if (score === 2) return { score, label: 'Cukup', color: 'bg-yellow-500' }
  if (score === 3) return { score, label: 'Kuat', color: 'bg-blue-500' }
  return { score, label: 'Sangat Kuat', color: 'bg-green-500' }
}

export default function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined)
  const [clientErrors, setClientErrors] = useState<Record<string, string | null>>({})
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = e.target
    const error = validateField(name, value)
    setClientErrors((prev) => ({ ...prev, [name]: error }))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    if (name === 'password') setPassword(value)
    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  function getError(field: string): string | undefined {
    const serverErrors = state?.errors as Record<string, string[] | undefined> | undefined
    return clientErrors[field] ?? serverErrors?.[field]?.[0] ?? undefined
  }

  const strength = getPasswordStrength(password)

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.message && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {state.message}
        </div>
      )}

      <Input
        id="name"
        name="name"
        type="text"
        label="Nama Lengkap"
        placeholder="John Doe"
        autoComplete="name"
        required
        error={getError('name')}
        onBlur={handleBlur}
        onChange={handleChange}
      />

      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="nama@email.com"
        autoComplete="email"
        required
        error={getError('email')}
        onBlur={handleBlur}
        onChange={handleChange}
      />

      {/* Password dengan strength indicator */}
      <div className="flex flex-col gap-1">
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Min. 8 karakter"
            autoComplete="new-password"
            required
            error={getError('password')}
            onBlur={handleBlur}
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            {showPassword ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Strength bar */}
        {password.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    i <= strength.score ? strength.color : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs font-medium ${
              strength.score <= 1 ? 'text-red-500' :
              strength.score === 2 ? 'text-yellow-600' :
              strength.score === 3 ? 'text-blue-600' : 'text-green-600'
            }`}>
              Kekuatan: {strength.label}
            </p>
          </div>
        )}
      </div>

      <Button type="submit" loading={pending} className="w-full mt-2">
        Buat Akun
      </Button>

      <p className="text-center text-sm text-gray-500">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          Masuk di sini
        </Link>
      </p>
    </form>
  )
}
