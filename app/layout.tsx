import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VIMciety',
  description: 'A message board for visionaries.',
}

// CRITICAL FOR MOBILE APPS
// This handles the "Notch" and prevents annoying auto-zoom on inputs
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // Extends content behind the notch/status bar
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* REQUIRED: Loads the Canva Button SDK */}
        <script src="https://sdk.canva.com/designbutton/v2/api.js" async></script>
      </head>
      
      <body className={inter.className} style={{ margin: 0, padding: 0, backgroundColor: '#ffffff' }}>
        
        {/* The Sidebar (Navigation) */}
        <Sidebar />

        {/* Main Content Wrapper */}
        <main className="main-content">
          {children}
        </main>

      </body>
    </html>
  )
}