'use server'

import { prisma } from '@/lib/prisma'
import { signIn } from '@/lib/auth'
import { RegisterSchema, LoginSchema, type FormState } from '@/lib/definitions'
import { rateLimit, rateLimitMessage } from '@/lib/rate-limit'
import { AuthError } from 'next-auth'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

/** Ambil IP dari request headers (Next.js 16 async headers) */
async function getClientIp(): Promise<string> {
  const hdrs = await headers()
  return (
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
    'unknown'
  )
}

export async function register(state: FormState, formData: FormData): Promise<FormState> {
  // ── Rate limit: 5 registrasi per IP per 10 menit ──────────────────────────
  const ip = await getClientIp()
  const rl = rateLimit(ip, 'register')
  if (!rl.allowed) {
    return { message: rateLimitMessage(rl) }
  }

  // ── Validasi + sanitasi via Zod ───────────────────────────────────────────
  const parsed = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return {
      errors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v ?? []])
      ) as Record<string, string[]>,
    }
  }

  const { name, email, password } = parsed.data

  // ── Cek duplikat email ────────────────────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { errors: { email: ['Email sudah terdaftar.'] } }
  }

  // ── Hash password dengan cost factor 12 ──────────────────────────────────
  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  })

  redirect('/login?registered=1')
}

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  // ── Rate limit: 10 percobaan login per IP per 15 menit ────────────────────
  const ip = await getClientIp()
  const rl = rateLimit(ip, 'login')
  if (!rl.allowed) {
    return { message: rateLimitMessage(rl) }
  }

  // ── Validasi + sanitasi ───────────────────────────────────────────────────
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return {
      errors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v ?? []])
      ) as Record<string, string[]>,
    }
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Email atau password salah.' }
        default:
          return { message: 'Terjadi kesalahan. Coba lagi.' }
      }
    }
    throw error
  }
}
