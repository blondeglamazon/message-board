"use client"; 

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { AppTrackingTransparency } from '@capgo/capacitor-app-tracking-transparency';

export default function TrackingSetup() {
  useEffect(() => {
    const requestTracking = async () => {
      if (Capacitor.getPlatform() === 'ios') {
        try {
          const status = await AppTrackingTransparency.getStatus();
          
          // 👇 We removed the 'unprompted' check here!
          if (status.status === 'notDetermined') {
            await AppTrackingTransparency.requestPermission();
          }
        } catch (error) {
          console.error("Error requesting tracking permission:", error);
        }
      }
    };

    requestTracking();
  }, []);

  return null; 
}