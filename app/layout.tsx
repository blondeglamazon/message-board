import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script' // Optimized script loader
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VIMciety',
  description: 'A message board for visionaries.',
}

// CRITICAL FOR MOBILE APPS
// This handles the "Notch", prevents auto-zoom on inputs, 
// and locks the UI scale to feel like a native app.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff', // Sets the Android status bar color
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, padding: 0, backgroundColor: '#ffffff' }}>
        
        {/* REQUIRED: Loads the Canva Button SDK efficiently */}
        <Script 
          src="https://sdk.canva.com/designbutton/v2/api.js" 
          strategy="afterInteractive" 
        />
        
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