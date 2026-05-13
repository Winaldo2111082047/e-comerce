'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"        // tambah class "dark" ke <html>
      defaultTheme="system"    // ikuti preferensi sistem secara default
      enableSystem             // deteksi prefers-color-scheme
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  )
}
