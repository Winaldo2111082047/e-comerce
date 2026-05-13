import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'sonner'
import ThemeProvider from '@/components/ui/ThemeProvider'
import { buildBaseMetadata, buildWebsiteJsonLd, buildOrganizationJsonLd } from '@/lib/seo'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = buildBaseMetadata()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const websiteJsonLd = buildWebsiteJsonLd()
  const orgJsonLd = buildOrganizationJsonLd()

  return (
    <html lang="id" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
            theme="system"
            toastOptions={{
              classNames: {
                toast: 'font-sans text-sm',
                title: 'text-gray-900 dark:text-gray-100',
                description: 'text-gray-600 dark:text-gray-400',
                closeButton: 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
