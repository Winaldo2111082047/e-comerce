import { requireAdmin } from '@/lib/auth-guard'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminMobileHeader from '@/components/admin/AdminMobileHeader'
import { auth } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Double-check di layout level (proxy sudah cek, ini defense-in-depth)
  await requireAdmin()

  // Ambil session untuk UI (nama, email, dll)
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile header */}
      <AdminMobileHeader user={session!.user} />

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar user={session!.user} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 lg:ml-64">
          <main className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
