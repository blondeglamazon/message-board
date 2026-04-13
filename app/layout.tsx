import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import PushRegistry from '@/components/PushRegistry'
import PermissionOrchestrator from '@/components/PermissionOrchestrator'
import RevenueCatSetup from '@/components/RevenueCatSetup' 
import StripeDeepLinkHandler from '@/components/StripeDeepLinkHandler'
import PushNotificationListener from '@/components/PushNotificationListener'
import Script from 'next/script'
import AdSenseWrapper from '@/components/AdSenseWrapper';

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
      <head>
        {/* Google AdSense Verification Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3035141160822131"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* Google Analytics Script */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8FL5M9VGNF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-8FL5M9VGNF');
          `}
        </Script>
      </head>
      <body className={inter.className} style={{ 
        margin: 0, 
        backgroundColor: '#ffffff',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}>
        
        {/* AdSense (web only — silently no-ops on native) */}
        <AdSenseWrapper />

        {/* Permission orchestration — MUST mount first.
            Handles EULA → ATT → UMP/AdMob in strict sequence.
            All other native managers below internally gate on `vimciety_eula_accepted`. */}
        <PermissionOrchestrator />

        {/* Background listeners & native managers.
            These all check localStorage.vimciety_eula_accepted before doing anything. */}
        <PushNotificationListener />
        <RevenueCatSetup />
        <StripeDeepLinkHandler /> 
        <PushRegistry />
        
        <Sidebar />

        <main className="main-content">
          {children}
        </main>

      </body>
    </html>
  )
}