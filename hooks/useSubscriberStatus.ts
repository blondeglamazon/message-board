"use client";

import { useState, useEffect } from 'react';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

export function useSubscriberStatus() {
  const [isVimPlus, setIsVimPlus] = useState(false);
  const [isVimVerified, setIsVimVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      // 🛡️ Web Protection: If on a website, skip the native check
      if (!Capacitor.isNativePlatform()) {
        setLoading(false);
        return;
      }

      try {
        // 🛠️ FIXED: Added curly braces to destructure the customerInfo object
        const { customerInfo } = await Purchases.getCustomerInfo();
        
        // Check if they have the VIM+ perk active
        if (typeof customerInfo.entitlements.active['vim_plus_access'] !== 'undefined') {
          setIsVimPlus(true);
        }
        
        // Check if they have the VIM VERIFIED perk active
        if (typeof customerInfo.entitlements.active['verified_status'] !== 'undefined') {
          setIsVimVerified(true);
        }
      } catch (error) {
        console.error("Error fetching subscriber status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  return { isVimPlus, isVimVerified, loading };
}