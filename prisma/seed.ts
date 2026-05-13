import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tokokita.com' },
    update: {},
    create: {
      name: 'Admin TokoKita',
      email: 'admin@tokokita.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user:', admin.email)

  // Create test user
  const userPassword = await bcrypt.hash('user123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'user@tokokita.com' },
    update: {},
    create: {
      name: 'User Test',
      email: 'user@tokokita.com',
      password: userPassword,
      role: 'USER',
    },
  })
  console.log('✅ Test user:', user.email)

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'elektronik' },
      update: {},
      create: { name: 'Elektronik', slug: 'elektronik', description: 'Gadget dan perangkat elektronik' },
    }),
    prisma.category.upsert({
      where: { slug: 'fashion' },
      update: {},
      create: { name: 'Fashion', slug: 'fashion', description: 'Pakaian dan aksesoris' },
    }),
    prisma.category.upsert({
      where: { slug: 'rumah-tangga' },
      update: {},
      create: { name: 'Rumah Tangga', slug: 'rumah-tangga', description: 'Peralatan rumah tangga' },
    }),
    prisma.category.upsert({
      where: { slug: 'olahraga' },
      update: {},
      create: { name: 'Olahraga', slug: 'olahraga', description: 'Perlengkapan olahraga' },
    }),
  ])
  console.log('✅ Categories created:', categories.length)

  // Create products
  const products = [
    {
      name: 'Smartphone Android 5G',
      slug: 'smartphone-android-5g',
      description: 'Smartphone terbaru dengan konektivitas 5G, layar AMOLED 6.5 inci, dan baterai 5000mAh.',
      price: 3500000,
      stock: 25,
      categoryId: categories[0].id,
    },
    {
      name: 'Laptop Gaming 15 Inch',
      slug: 'laptop-gaming-15-inch',
      description: 'Laptop gaming dengan prosesor terbaru, RAM 16GB, dan GPU dedicated untuk gaming.',
      price: 12000000,
      stock: 10,
      categoryId: categories[0].id,
    },
    {
      name: 'TWS Earbuds Wireless',
      slug: 'tws-earbuds-wireless',
      description: 'Earbuds wireless dengan noise cancellation aktif dan baterai tahan 24 jam.',
      price: 450000,
      stock: 50,
      categoryId: categories[0].id,
    },
    {
      name: 'Kaos Polos Premium',
      slug: 'kaos-polos-premium',
      description: 'Kaos polos berbahan cotton combed 30s, nyaman dipakai sehari-hari.',
      price: 85000,
      stock: 100,
      categoryId: categories[1].id,
    },
    {
      name: 'Sepatu Sneakers Casual',
      slug: 'sepatu-sneakers-casual',
      description: 'Sepatu sneakers casual dengan sol karet anti-slip, cocok untuk aktivitas sehari-hari.',
      price: 350000,
      stock: 30,
      categoryId: categories[1].id,
    },
    {
      name: 'Blender Portable',
      slug: 'blender-portable',
      description: 'Blender portable dengan baterai rechargeable, cocok untuk membuat smoothie di mana saja.',
      price: 180000,
      stock: 40,
      categoryId: categories[2].id,
    },
    {
      name: 'Set Peralatan Masak',
      slug: 'set-peralatan-masak',
      description: 'Set lengkap peralatan masak anti lengket, terdiri dari 5 panci dan wajan.',
      price: 650000,
      stock: 15,
      categoryId: categories[2].id,
    },
    {
      name: 'Matras Yoga Premium',
      slug: 'matras-yoga-premium',
      description: 'Matras yoga anti-slip tebal 6mm, cocok untuk yoga, pilates, dan olahraga di rumah.',
      price: 220000,
      stock: 35,
      categoryId: categories[3].id,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
  }
  console.log('✅ Products created:', products.length)

  console.log('\n🎉 Seeding selesai!')
  console.log('📧 Admin: admin@tokokita.com / admin123')
  console.log('📧 User:  user@tokokita.com  / user123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
