#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# migrate-prod.sh
#
# Jalankan Prisma migration ke database production.
# Gunakan DIRECT connection (bukan pooled) untuk migrate.
#
# Usage:
#   DATABASE_URL="postgresql://..." bash scripts/migrate-prod.sh
#
# Atau set DATABASE_URL di .env.production.local dulu:
#   vercel env pull .env.production.local
#   bash scripts/migrate-prod.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "🔄 Running Prisma migrations on production database..."
echo ""

# Validasi DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  # Coba load dari .env.production.local
  if [ -f ".env.production.local" ]; then
    export $(grep -v '^#' .env.production.local | xargs)
    echo "✅ Loaded DATABASE_URL from .env.production.local"
  else
    echo "❌ DATABASE_URL is not set!"
    echo ""
    echo "Set it with:"
    echo "  export DATABASE_URL='postgresql://...'"
    echo ""
    echo "Or pull from Vercel:"
    echo "  vercel env pull .env.production.local"
    echo "  bash scripts/migrate-prod.sh"
    exit 1
  fi
fi

echo "📦 Running: prisma migrate deploy"
npx prisma migrate deploy

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "  - Verify tables: npx prisma studio"
echo "  - Seed data: DATABASE_URL='...' npx tsx prisma/seed.ts"
