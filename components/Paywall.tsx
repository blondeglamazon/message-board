"use client";

import { useEffect, useState } from 'react';
import { Purchases, PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

export default function Paywall() {
  // State to hold the subscription options we get from RevenueCat
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    const fetchOfferings = async () => {
      // 🛡️ Web Protection: Skip this if we are running in a regular web browser
      if (!Capacitor.isNativePlatform()) {
        console.log("Not on a mobile device. Skipping RevenueCat fetch.");
        return;
      }

      try {
        // This fetches your "default" offering and the VIM+ / VIM VERIFIED packages
        const offerings = await Purchases.getOfferings();
        
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          console.log("Successfully loaded packages:", offerings.current.availablePackages);
          setPackages(offerings.current.availablePackages);
        }
      } catch (error) {
        console.error("Error fetching RevenueCat offerings:", error);
      }
    };

    fetchOfferings();
  }, []);

  // This function runs when the user taps "Subscribe"
  const handlePurchase = async (pkg: PurchasesPackage) => {
    if (isPurchasing) return;
    setIsPurchasing(true);

    try {
      // 📱 FIXED: Changed 'package' to 'aPackage' to satisfy the RevenueCat SDK types
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });

      // Check if the purchase was successful and unlocked their new status
      if (typeof customerInfo.entitlements.active['vim_plus_access'] !== 'undefined') {
        alert("Welcome to VIM+! Your purchase was successful.");
        // TODO: Redirect the user to the premium area or update your app state
      } else if (typeof customerInfo.entitlements.active['verified_status'] !== 'undefined') {
        alert("You are now VIM VERIFIED! Your purchase was successful.");
        // TODO: Redirect the user or update your app state
      }

    } catch (error: any) {
      // If the user hits "Cancel" on the Apple payment sheet, it throws an error.
      // We catch it here so the app doesn't crash.
      if (!error.userCancelled) {
        console.error("Purchase failed:", error);
        alert("Purchase failed. Please try again.");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Upgrade Your Experience</h2>
      
      {packages.length === 0 ? (
        <p>Loading subscriptions...</p>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          {packages.map((pkg) => (
            <div key={pkg.identifier} className="p-4 border border-gray-200 rounded-lg text-center">
              <h3 className="text-lg font-semibold">{pkg.product.title}</h3>
              <p className="text-gray-600 mb-4">{pkg.product.description}</p>
              
              <button
                onClick={() => handlePurchase(pkg)}
                disabled={isPurchasing}
                className="w-full py-2 px-4 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isPurchasing ? "Processing..." : `Subscribe for ${pkg.product.priceString}`}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}