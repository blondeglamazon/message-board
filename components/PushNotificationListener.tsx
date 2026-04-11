'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export default function PushNotificationListener() {
  const router = useRouter();

  useEffect(() => {
    // We only want to run this code if the app is actually running natively on a phone
    if (!Capacitor.isNativePlatform()) return;

    // Listen for when a user TAPS on a notification
    const setupListener = async () => {
      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          console.log('Push action performed: ', notification);

          // Extract the 'data' payload we sent from our Next.js API
          const data = notification.notification.data;

          // If we included a URL in the payload, navigate to it!
          if (data && data.url) {
            // Next.js router handles the navigation seamlessly
            router.push(data.url);
          }
        }
      );
    };

    setupListener();

    // Cleanup the listener when the component unmounts
    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [router]);

  // This component doesn't render any visible UI
  return null; 
}