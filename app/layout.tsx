import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script' // Optimized script loader
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })



export const metadata: Metadata = {
  metadataBase: new URL('https://www.vimciety.com'), // 👈 ADD THIS EXACT LINE
  title: 'VIMciety',
  description: 'Everything was once imagined. Join the VIMciety community today!',
  openGraph: {
    title: 'VIMciety',
    description: 'Everything was once imagined. Join the VIMciety community today!',
    url: 'https://www.vimciety.com',
    siteName: 'VIMciety',
    images: [
      {
        // Replace this URL with a direct link to your actual VIMciety logo or banner!
        url: 'https://www.vimciety.com/logo.png', 
        width: 1200,
        height: 630,
        alt: 'VIMciety Preview Image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VIMciety',
    description: 'Everything was once imagined. Join the VIMciety community today!',
    images: ['https://www.vimciety.com/logo.png'], // Use the same image URL here
  },
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