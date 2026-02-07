import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VIMciety',
  description: 'A message board for visionaries.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{ margin: 0, padding: 0, backgroundColor: '#000' }}
      >
        {children}
      </body>
    </html>
  )
}
