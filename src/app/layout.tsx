import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'k3mate',
  description: 'k3s cluster interface',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'k3mate',
  },
}

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  )
}
