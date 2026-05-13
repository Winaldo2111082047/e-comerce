import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatRupiah, formatDate } from '@/lib/utils'
import SalesChart from '@/components/admin/SalesChart'
import MonthlyChart from '@/components/admin/MonthlyChart'
import OrderStatusChart from '@/components/admin/OrderStatusChart'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard Admin',
  robots: { index: false, follow: false },
}

async function getDashboardData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // 7 hari terakhir
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  // 6 bulan terakhir
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return d
  })

  const [
    productCount,
    categoryCount,
    userCount,
    orderCount,
    revenue,
    revenueLastMonth,
    orderCountThisMonth,
    orderCountLastMonth,
    recentOrders,
    ordersByStatus,
    lowStockProducts,
    topProducts,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count(),
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.count({
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    prisma.order.findMany({
      take: 7,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: 5 } },
      orderBy: { stock: 'asc' },
      take: 5,
      select: { id: true, name: true, stock: true, image: true },
    }),
    // Produk terlaris: aggregate dari order_items
    prisma.orderItem.groupBy({
      by: ['productId', 'productName', 'productImage'],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ])

  // Sales per hari (7 hari terakhir)
  const salesPerDay = await Promise.all(
    last7Days.map(async (day) => {
      const nextDay = new Date(day)
      nextDay.setDate(nextDay.getDate() + 1)
      const result = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: { id: true },
        where: {
          createdAt: { gte: day, lt: nextDay },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      })
      return {
        date: day.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
        revenue: Number(result._sum.totalAmount ?? 0),
        orders: result._count.id,
      }
    })
  )

  // Revenue & order per bulan (6 bulan terakhir)
  const monthlyStats = await Promise.all(
    last6Months.map(async (monthStart) => {
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59)
      const result = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: { id: true },
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      })
      return {
        month: monthStart.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        revenue: Number(result._sum.totalAmount ?? 0),
        orders: result._count.id,
      }
    })
  )

  return {
    productCount,
    categoryCount,
    userCount,
    orderCount,
    totalRevenue: Number(revenue._sum.totalAmount ?? 0),
    revenueLastMonth: Number(revenueLastMonth._sum.totalAmount ?? 0),
    orderCountThisMonth,
    orderCountLastMonth,
    recentOrders,
    ordersByStatus,
    lowStockProducts,
    salesPerDay,
    monthlyStats,
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      productImage: p.productImage,
      totalQty: p._sum.quantity ?? 0,
      totalRevenue: Number(p._sum.subtotal ?? 0),
    })),
  }
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Menunggu Bayar', color: 'bg-yellow-100 text-yellow-700' },
  PAID:       { label: 'Dibayar',        color: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: 'Diproses',       color: 'bg-indigo-100 text-indigo-700' },
  SHIPPED:    { label: 'Dikirim',        color: 'bg-purple-100 text-purple-700' },
  DELIVERED:  { label: 'Selesai',        color: 'bg-green-100 text-green-700' },
  CANCELLED:  { label: 'Dibatalkan',     color: 'bg-red-100 text-red-700' },
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  const revenueGrowth = data.revenueLastMonth > 0
    ? ((data.totalRevenue - data.revenueLastMonth) / data.revenueLastMonth * 100).toFixed(1)
    : null

  const orderGrowth = data.orderCountLastMonth > 0
    ? ((data.orderCountThisMonth - data.orderCountLastMonth) / data.orderCountLastMonth * 100).toFixed(1)
    : null

  const stats = [
    {
      label: 'Total Pendapatan',
      value: formatRupiah(data.totalRevenue),
      sub: revenueGrowth
        ? `${Number(revenueGrowth) >= 0 ? '+' : ''}${revenueGrowth}% vs bulan lalu`
        : 'Semua waktu',
      positive: revenueGrowth ? Number(revenueGrowth) >= 0 : true,
      href: '/admin/orders',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Pesanan',
      value: data.orderCount.toLocaleString('id-ID'),
      sub: orderGrowth
        ? `${Number(orderGrowth) >= 0 ? '+' : ''}${orderGrowth}% vs bulan lalu`
        : `${data.orderCountThisMonth} bulan ini`,
      positive: orderGrowth ? Number(orderGrowth) >= 0 : true,
      href: '/admin/orders',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Total Pelanggan',
      value: data.userCount.toLocaleString('id-ID'),
      sub: 'User terdaftar',
      positive: true,
      href: '/admin/orders',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Produk',
      value: data.productCount.toLocaleString('id-ID'),
      sub: `${data.categoryCount} kategori`,
      positive: true,
      href: '/admin/products',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ]

  const orderStatusData = data.ordersByStatus.map((s) => ({
    status: s.status,
    count: s._count.status,
    label: statusConfig[s.status]?.label ?? s.status,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${s.iconBg} ${s.iconColor}`}>{s.icon}</div>
              <svg className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-xs font-medium mt-1 ${s.positive ? 'text-emerald-600' : 'text-red-500'}`}>
              {s.sub}
            </p>
          </Link>
        ))}
      </div>

      {/* Charts row 1: daily + status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="mb-5">
            <h2 className="font-semibold text-gray-900">Penjualan 7 Hari Terakhir</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pendapatan harian</p>
          </div>
          <SalesChart data={data.salesPerDay} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="mb-5">
            <h2 className="font-semibold text-gray-900">Status Pesanan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Distribusi semua pesanan</p>
          </div>
          <OrderStatusChart data={orderStatusData} total={data.orderCount} />
        </div>
      </div>

      {/* Charts row 2: monthly */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900">Statistik 6 Bulan Terakhir</h2>
          <p className="text-xs text-gray-400 mt-0.5">Revenue & jumlah pesanan per bulan</p>
        </div>
        <MonthlyChart data={data.monthlyStats} />
      </div>

      {/* Bottom row: recent orders + top products + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Pesanan Terbaru</h2>
            <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline font-medium">
              Lihat semua →
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Belum ada pesanan</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-400 text-xs">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Pesanan</th>
                    <th className="px-5 py-3 text-left font-medium">Pelanggan</th>
                    <th className="px-5 py-3 text-left font-medium">Total</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentOrders.map((order) => {
                    const s = statusConfig[order.status]
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3.5">
                          <p className="font-mono text-xs text-gray-600">{order.orderNumber}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900 text-xs">{order.user.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-32">{order.user.email}</p>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-900 text-xs">
                          {formatRupiah(Number(order.totalAmount))}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s?.color ?? 'bg-gray-100 text-gray-600'}`}>
                            {s?.label ?? order.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: top products + low stock */}
        <div className="space-y-4">
          {/* Produk terlaris */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Produk Terlaris</h2>
              <Link href="/admin/products" className="text-xs text-blue-600 hover:underline font-medium">
                Kelola →
              </Link>
            </div>
            {data.topProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Belum ada data</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.topProducts.map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3 px-5 py-3">
                    {/* Rank */}
                    <span className={`text-xs font-bold w-5 shrink-0 ${
                      i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-300'
                    }`}>
                      #{i + 1}
                    </span>
                    {/* Thumbnail */}
                    <div className="w-8 h-8 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {p.productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.productImage} alt={p.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{p.productName}</p>
                      <p className="text-xs text-gray-400">{p.totalQty} terjual</p>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 shrink-0">
                      {formatRupiah(p.totalRevenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stok menipis */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Stok Menipis</h2>
              <Link href="/admin/products" className="text-xs text-blue-600 hover:underline font-medium">
                Kelola →
              </Link>
            </div>
            {data.lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">✅ Semua stok aman</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-gray-300">
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-800 flex-1 truncate">{product.name}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      product.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {product.stock === 0 ? 'Habis' : `Sisa ${product.stock}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
