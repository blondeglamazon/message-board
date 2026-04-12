'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

export default function BannerAd() {
  useEffect(() => {
    // Safety check: Ads only run on actual iOS/Android devices
    if (!Capacitor.isNativePlatform()) return;

    const showAd = async () => {
      try {
        const isIOS = Capacitor.getPlatform() === 'ios';

        // 👇 NEW: App Tracking Transparency (ATT) for iOS 👇
        if (isIOS) {
          // Check if we have asked the user for permission yet
          const trackingInfo = await AdMob.trackingAuthorizationStatus();
          
          if (trackingInfo.status === 'notDetermined') {
            // This triggers the native Apple popup asking for permission!
            await AdMob.requestTrackingAuthorization();
          }
        }
        // 👆 END ATT CODE 👆

        // Initialize AdMob AFTER the prompt is handled
        await AdMob.initialize();
        
        // Dynamically switch between the IDs
        const adId = isIOS 
          ? 'ca-app-pub-3035141160822131/1590519117' // 🍎 iOS Banner ID
          : 'ca-app-pub-3035141160822131/2503933506'; // 🤖 Android Banner ID

        const options: BannerAdOptions = {
          adId: adId,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          // 🚨 CRITICAL: Keep true while testing to prevent an AdMob ban!
          isTesting: true 
        };
        
        await AdMob.showBanner(options);
      } catch (error) {
        console.error("AdMob Banner Error:", error);
      }
    };

    showAd();

    // Cleanup: Hide the ad if the user navigates away from the Feed
    return () => {
      if (Capacitor.isNativePlatform()) {
        AdMob.hideBanner().catch(console.error);
      }
    };
  }, []);

  return null; 
}