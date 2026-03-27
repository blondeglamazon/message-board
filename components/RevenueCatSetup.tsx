'use client';

import { useEffect } from 'react';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// RevenueCat public API keys (safe to embed in client code)
const RC_APPLE_KEY = process.env.NEXT_PUBLIC_REVENUECAT_APPLE_KEY || 'appl_LVSfMHEVdNmmbxPZUUkRbWNCsMa';
const RC_GOOGLE_KEY = process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY || 'goog_BXZkwXZSCtVmMjdEtSKdaJhPsGS';

export default function RevenueCatSetup() {
  useEffect(() => {
    const initRevenueCat = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

        const platform = Capacitor.getPlatform();
        const apiKey = platform === 'ios' ? RC_APPLE_KEY : RC_GOOGLE_KEY;

        if (apiKey && !apiKey.startsWith('appl_YOUR') && !apiKey.startsWith('goog_YOUR')) {
          await Purchases.configure({ apiKey });
          console.log(`✅ RevenueCat configured for ${platform}`);
        } else {
          console.warn(`⚠️ No RevenueCat key for ${platform}`);
        }
      } catch (error) {
        console.error('❌ RevenueCat init failed:', error);
      }
    };

    initRevenueCat();
  }, []);

  return null;
}