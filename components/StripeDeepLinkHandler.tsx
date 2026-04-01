'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { App, URLOpenListenerEvent } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

export default function StripeDeepLinkHandler() {
  const router = useRouter()

  useEffect(() => {
    // We only need to listen for deep links on mobile
    if (!Capacitor.isNativePlatform()) return;

    const setupListener = async () => {
      await App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
        // event.url will look like: https://www.vimciety.com/settings?stripe=success
        const incomingUrl = new URL(event.url);
        
        // Check if this URL is our Stripe return/refresh redirect
        if (incomingUrl.searchParams.get('stripe')) {
          
          // 1. Force the native Browser modal to close!
          await Browser.close();
          
          // 2. Tell Next.js to navigate to the exact path Stripe sent us to
          const internalPath = incomingUrl.pathname + incomingUrl.search;
          router.push(internalPath);
          
          // 3. Force Next.js to re-fetch the server data (updates their "Verified" status)
          router.refresh(); 
        }
      });
    };

    setupListener();

    // Cleanup the listener when the app closes
    return () => {
      App.removeAllListeners();
    };
  }, [router]);

  return null; // This component is invisible
}