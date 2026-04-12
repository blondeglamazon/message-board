'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, AdOptions } from '@capacitor-community/admob';
import { App } from '@capacitor/app';

export default function AppOpenAdManager() {
  useEffect(() => {
    // Safety check: Ads only run on actual iOS/Android devices
    if (!Capacitor.isNativePlatform()) return;

    let isAdPrepared = false;

    const setupInterstitialAd = async () => {
      try {
        await AdMob.initialize();

        const isIOS = Capacitor.getPlatform() === 'ios';
        
        // 👇 PASTE YOUR NEW INTERSTITIAL IDS HERE 👇
        const adId = isIOS 
          ? 'ca-app-pub-3035141160822131/3043201584' //apple
          : 'ca-app-pub-3035141160822131/7279403022'; //android

        const options: AdOptions = {
          adId: adId,
          // 🚨 CRITICAL: Keep true while testing!
          isTesting: true, 
        };

        // Pre-load the Interstitial ad
        await AdMob.prepareInterstitial(options);
        isAdPrepared = true;

      } catch (error) {
        console.error('Interstitial Ad Prepare Error:', error);
      }
    };

    setupInterstitialAd();

    // Listen for the user minimizing the app and bringing it back
    const appStateListener = App.addListener('appStateChange', async ({ isActive }) => {
      // If the app is active and the ad is ready, show it!
      if (isActive && isAdPrepared) {
        try {
          await AdMob.showInterstitial();
          
          // Once the ad is closed, immediately pre-load the next one!
          isAdPrepared = false;
          setupInterstitialAd();
        } catch (error) {
          console.error('Interstitial Ad Show Error:', error);
        }
      }
    });

    return () => {
      appStateListener.then(listener => listener.remove());
    };
  }, []);

  return null; 
}