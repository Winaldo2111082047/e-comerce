/**
 * pre-deploy-check.ts
 *
 * Script sanity check sebelum deploy.
 * Jalankan: npx tsx --tsconfig tsconfig.json scripts/pre-deploy-check.ts
 */

import 'dotenv/config'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures: string[] = []

function pass(label: string) {
  console.log(`  ✅ ${label}`)
  passed++
}

function fail(label: string, detail?: string) {
  console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`)
  failed++
  failures.push(label)
}

function section(title: string) {
  const pad = Math.max(0, 50 - title.length)
  console.log(`\n── ${title} ${'─'.repeat(pad)}`)
}

function getAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = []
  if (!fs.existsSync(dir)) return files
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...getAllFiles(fullPath, extensions))
    } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath)
    }
  }
  return files
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔍 TokoKita Pre-Deploy Check\n' + '═'.repeat(60))

  // ── 1. ENVIRONMENT VARIABLES ──────────────────────────────────────────────
  section('Environment Variables')

  const requiredVars = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'AUTH_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ]

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      pass(`${varName} is set`)
    } else {
      fail(`${varName} is missing`)
    }
  }

  const authSecret = process.env.AUTH_SECRET ?? ''
  if (authSecret.length >= 32) {
    pass(`AUTH_SECRET length OK (${authSecret.length} chars)`)
  } else {
    fail(`AUTH_SECRET too short (${authSecret.length} chars, need ≥32)`)
  }

  if (process.env.NODE_ENV === 'production') {
    if (process.env.AUTH_URL?.includes('localhost')) {
      fail('AUTH_URL contains localhost in production')
    } else {
      pass('AUTH_URL is not localhost')
    }
  }

  // ── 2. DATABASE CONNECTION ────────────────────────────────────────────────
  section('Database Connection')

  let prismaClient: import('../src/generated/prisma/client').PrismaClient | null = null

  try {
    const { PrismaClient } = await import('../src/generated/prisma/client')
    const { PrismaPg } = await import('@prisma/adapter-pg')

    const connectionString = process.env.DATABASE_URL!
    const adapter = new PrismaPg({ connectionString })
    prismaClient = new PrismaClient({ adapter })

    await prismaClient.$queryRaw`SELECT 1`
    pass('Database connection successful')

    // Check tables
    const tables = await prismaClient.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `
    const tableNames = tables.map((t: { tablename: string }) => t.tablename)

    const requiredTables = [
      'users', 'products', 'categories', 'carts', 'cart_items',
      'orders', 'order_items', 'payments', 'wishlists', 'reviews',
    ]

    for (const table of requiredTables) {
      if (tableNames.includes(table)) {
        pass(`Table "${table}" exists`)
      } else {
        fail(`Table "${table}" missing — run: npm run db:migrate:prod`)
      }
    }

    // ── 3. DATA INTEGRITY ──────────────────────────────────────────────────
    section('Data Integrity')

    const adminUser = await prismaClient.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true },
    })
    if (adminUser) {
      pass(`Admin user exists (${adminUser.email})`)
    } else {
      fail('No admin user found — run: npm run db:seed')
    }

    const categoryCount = await prismaClient.category.count()
    if (categoryCount > 0) {
      pass(`Categories exist (${categoryCount} total)`)
    } else {
      fail('No categories found — run: npm run db:seed')
    }

    const productCount = await prismaClient.product.count({ where: { isActive: true } })
    if (productCount > 0) {
      pass(`Active products exist (${productCount} total)`)
    } else {
      fail('No active products found — run: npm run db:seed')
    }

  } catch (error) {
    fail('Database check failed', String(error).split('\n')[0])
  } finally {
    if (prismaClient != null) await prismaClient.$disconnect()
  }

  // ── 4. SOURCE CODE CHECKS ─────────────────────────────────────────────────
  section('Source Code')

  // console.log check — pakai fs scan agar cross-platform
  {
    const srcFiles = getAllFiles('src', ['.ts', '.tsx'])
    const filesWithLog = srcFiles.filter((f) => {
      const content = fs.readFileSync(f, 'utf-8')
      return /console\.log\s*\(/.test(content)
    })
    if (filesWithLog.length > 0) {
      fail(`console.log found in ${filesWithLog.length} file(s)`, filesWithLog.slice(0, 3).join(', '))
    } else {
      pass('No console.log in source code')
    }
  }

  // .gitignore check
  const gitignoreContent = fs.existsSync('.gitignore')
    ? fs.readFileSync('.gitignore', 'utf-8')
    : ''

  if (gitignoreContent.includes('.env')) {
    pass('.env is in .gitignore')
  } else {
    fail('.env is NOT in .gitignore — risk of secret exposure!')
  }

  // .env.local tidak di-commit
  if (!fs.existsSync('.env.local') || gitignoreContent.includes('.env.local') || gitignoreContent.includes('.env*')) {
    pass('.env.local is protected')
  } else {
    fail('.env.local might be committed to git')
  }

  // Cek tidak ada hardcoded secrets di source
  const srcFiles = getAllFiles('src', ['.ts', '.tsx'])
  const secretPatterns = [
    { pattern: /AUTH_SECRET\s*=\s*["'][a-zA-Z0-9+/=]{20,}["']/, name: 'AUTH_SECRET' },
    { pattern: /CLOUDINARY_API_SECRET\s*=\s*["'][a-zA-Z0-9_-]{10,}["']/, name: 'CLOUDINARY_API_SECRET' },
  ]

  let secretFound = false
  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    for (const { pattern, name } of secretPatterns) {
      if (pattern.test(content)) {
        fail(`Potential hardcoded ${name} in ${file}`)
        secretFound = true
      }
    }
  }
  if (!secretFound) pass('No hardcoded secrets in source code')

  // ── 5. TYPESCRIPT CHECK ───────────────────────────────────────────────────
  section('TypeScript')

  try {
    console.log('  ⏳ Running TypeScript check (excluding .next/)...')
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' })
    pass('TypeScript check passed')
  } catch (error) {
    const output = String(error).split('\n').filter(l => l.includes('error TS') && !l.includes('.next/')).slice(0, 5)
    fail(`TypeScript errors found (${output.length} shown)`, output[0] ?? '')
    output.slice(1).forEach(l => console.log(`     ${l}`))
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`)

  if (failed > 0) {
    console.log('❌ Failed checks:')
    failures.forEach((f) => console.log(`   - ${f}`))
    console.log('\n🚫 NOT ready for deployment. Fix the issues above.\n')
    process.exit(1)
  } else {
    console.log('✅ All checks passed! Ready for deployment.\n')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Script error:', err)
  process.exit(1)
})
