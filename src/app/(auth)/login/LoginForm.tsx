'use client'

import { useActionState, useState, useEffect } from 'react'
import { login } from '@/app/actions/auth'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

/** Ekstrak detik dari pesan rate limit "Coba lagi dalam X detik/menit" */
function parseRetrySeconds(message: string): number {
  const secMatch = message.match(/(\d+)\s*detik/)
  if (secMatch) return parseInt(secMatch[1], 10)
  const minMatch = message.match(/(\d+)\s*menit/)
  if (minMatch) return parseInt(minMatch[1], 10) * 60
  return 0
}

function isRateLimitMessage(message: string): boolean {
  return message.toLowerCase().includes('terlalu banyak') || message.toLowerCase().includes('coba lagi dalam')
}

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Mulai countdown jika kena rate limit
  useEffect(() => {
    if (state?.message && isRateLimitMessage(state.message)) {
      const seconds = parseRetrySeconds(state.message)
      if (seconds > 0) {
        setCountdown(seconds)
      }
    }
  }, [state?.message])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const isRateLimited = countdown > 0

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Error / Rate limit message */}
      {state?.message && (
        <div className={`rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${
          isRateLimitMessage(state.message)
            ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
        }`}>
          {isRateLimitMessage(state.message) ? (
            <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <div>
            <p>{state.message}</p>
            {isRateLimited && (
              <p className="mt-1 font-semibold tabular-nums">
                Tunggu: {Math.floor(countdown / 60) > 0
                  ? `${Math.floor(countdown / 60)}m ${countdown % 60}s`
                  : `${countdown}s`
                }
              </p>
            )}
          </div>
        </div>
      )}

      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="nama@email.com"
        autoComplete="email"
        required
        disabled={isRateLimited}
        error={state?.errors?.email?.[0]}
      />

      <div className="relative">
        <Input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={isRateLimited}
          error={state?.errors?.password?.[0]}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
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

      <Button
        type="submit"
        loading={pending}
        disabled={isRateLimited}
        className="w-full mt-2"
      >
        {isRateLimited ? `Tunggu ${countdown}s...` : 'Masuk'}
      </Button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Belum punya akun?{' '}
        <Link href="/register" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </form>
  )
}
