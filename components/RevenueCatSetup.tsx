"use client"; // Required for useEffect in Next.js App Router

import { useEffect } from 'react';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'; // 👈 ADDED LOG_LEVEL HERE
import { Capacitor } from '@capacitor/core';

export default function RevenueCatSetup() {
  useEffect(() => {
    const initRevenueCat = async () => {
      // Ensure this ONLY runs on native iOS/Android, not in the web browser
      if (Capacitor.isNativePlatform()) {
        try {
          // 👈 FIXED: Use the official LOG_LEVEL enum instead of a string
          await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG }); 
          
          // Connect to your specific VIMciety project using your public Apple/Android API key
          await Purchases.configure({ apiKey: "test_QtyadJZfVvfZmKKCgTsDiqoRtbu" });
          
          console.log("✅ RevenueCat configured successfully");
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