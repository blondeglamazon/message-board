'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function AdSenseWrapper() {
  const pathname = usePathname();

  // 👇 1. Define the pages where you DO NOT want ads to show
  const isStorefront = pathname.startsWith('/storefront');
  const isLogin = pathname.startsWith('/login');
  const isUpgrade = pathname.startsWith('/upgrade');

  // If the user is on any of these pages, return nothing (no ads!)
  if (isStorefront || isLogin || isUpgrade) {
    return null;
  }

  // 👇 2. Otherwise, load the Google AdSense script
  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3035141160822131"
      crossOrigin="anonymous"
      strategy="afterInteractive" // Ensures it doesn't slow down your initial page load
    />
  );
}