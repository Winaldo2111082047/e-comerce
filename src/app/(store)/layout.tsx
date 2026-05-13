import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 dark:bg-gray-950">{children}</main>
      <Footer />
    </>
  )
}
