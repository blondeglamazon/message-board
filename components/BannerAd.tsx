'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

export default function BannerAd() {
  // Wait for EULA acceptance before doing anything ad-related
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const check = () => {
      const eulaOk = localStorage.getItem('vimciety_eula_accepted') === 'true';
      if (eulaOk) {
        // Give the orchestrator a moment to finish ATT + UMP before banner loads
        setTimeout(() => setReady(true), 2500);
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!Capacitor.isNativePlatform()) return;

    const showAd = async () => {
      try {
        const isIOS = Capacitor.getPlatform() === 'ios';

        // DO NOT request ATT here — PermissionOrchestrator already handled it.
        // DO NOT call AdMob.initialize() here — PermissionOrchestrator already handled it.

        const adId = isIOS
          ? 'ca-app-pub-3035141160822131/1590519117'
          : 'ca-app-pub-3035141160822131/2503933506';

        const options: BannerAdOptions = {
          adId,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: false, // flip to false for production
        };

        await AdMob.showBanner(options);
      } catch (error) {
        console.error('AdMob Banner Error:', error);
      }
    };

    showAd();

    return () => {
      if (Capacitor.isNativePlatform()) {
        AdMob.hideBanner().catch(console.error);
      }
    };
  }, [ready]);

  return null;
}