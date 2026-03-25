import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import PushRegistry from '@/components/PushRegistry'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.vimciety.com'), 
  title: 'VIMciety',
  description: 'Everything was once imagined. Join the VIMciety community today!',
  openGraph: {
    title: 'VIMciety',
    description: 'Everything was once imagined. Join the VIMciety community today!',
    url: 'https://www.vimciety.com',
    siteName: 'VIMciety',
    images: [
      {
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
    images: ['https://www.vimciety.com/logo.png'], 
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff', 
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ 
        margin: 0, 
        backgroundColor: '#ffffff',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}>
        
        <PushRegistry />
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