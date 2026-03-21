"use client"; // Required for useEffect in Next.js App Router

import { useEffect } from 'react';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

export default function RevenueCatSetup() {
  useEffect(() => {
    const initRevenueCat = async () => {
      // Ensure this ONLY runs on native iOS/Android, not in the web browser
      if (Capacitor.isNativePlatform()) {
        try {
          await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG }); 
          
          // 📱 DETECT WHICH PHONE THE USER IS HOLDING
          const platform = Capacitor.getPlatform();
          let apiKey = "";

          if (platform === 'ios') {
            // 👇 Safely pulls your Apple key from Vercel/Appflow environments
            apiKey = process.env.NEXT_PUBLIC_REVENUECAT_APPLE_KEY || ""; 
          } else if (platform === 'android') {
            // 👇 Safely pulls your Google key from Vercel/Appflow environments
            apiKey = process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY || ""; 
          }

          // Initialize if we have a valid key for the current platform
          if (apiKey) {
            await Purchases.configure({ apiKey });
            console.log(`✅ RevenueCat configured successfully for ${platform}`);
          } else {
            console.warn(`⚠️ No RevenueCat API key configured for platform: ${platform}. Did you forget to add it to your environment variables?`);
          }
          
        } catch (error) {
          console.error("❌ Failed to configure RevenueCat:", error);
        }
      }
    };

    initRevenueCat();
  }, []);

  // This component renders nothing to the screen, it just runs the setup logic
  return null; 
}