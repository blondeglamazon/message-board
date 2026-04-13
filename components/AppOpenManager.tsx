'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, AdOptions } from '@capacitor-community/admob';
import { App } from '@capacitor/app';

export default function AppOpenAdManager() {
  // Wait a bit on mount so the orchestrator finishes EULA + ATT + UMP first
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Poll localStorage; orchestrator sets EULA key. Give it a moment after that.
    if (typeof window === 'undefined') return;

    const check = () => {
      const eulaOk = localStorage.getItem('vimciety_eula_accepted') === 'true';
      if (eulaOk) {
        // Small delay so UMP/ATT dialogs (if any) can finish before we start loading ads
        setTimeout(() => setReady(true), 2000);
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!Capacitor.isNativePlatform()) return;

    let isAdPrepared = false;

    const setupInterstitialAd = async () => {
      try {
        // DO NOT call AdMob.initialize() here — PermissionOrchestrator already did it
        const isIOS = Capacitor.getPlatform() === 'ios';
        const adId = isIOS
          ? 'ca-app-pub-3035141160822131/3043201584'
          : 'ca-app-pub-3035141160822131/7279403022';

        const options: AdOptions = {
          adId,
          isTesting: false, // flip to false for production
        };

        await AdMob.prepareInterstitial(options);
        isAdPrepared = true;
      } catch (error) {
        console.error('Interstitial Ad Prepare Error:', error);
      }
    };

    setupInterstitialAd();

    const appStateListener = App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive && isAdPrepared) {
        try {
          await AdMob.showInterstitial();
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
  }, [ready]);

  return null;
}