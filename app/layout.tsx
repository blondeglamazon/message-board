import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VIMciety',
  description: 'A message board for visionaries.',
}

// NEW: This tells mobile browsers to use the full screen (including notch area)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // <--- CRITICAL FOR IPHONE NOTCH
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, padding: 0, backgroundColor: '#000' }}>
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  )
}