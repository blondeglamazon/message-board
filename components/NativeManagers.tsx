'use client'

import dynamic from 'next/dynamic';

// 📱 We put the lazy-loading inside a "use client" file so Next.js is happy!
// ssr: false ensures they only run on the actual phone, never on Vercel's servers.
const PushManager = dynamic(() => import('@/components/PushManager'), { ssr: false });
const TrackingSetup = dynamic(() => import('@/components/TrackingSetup'), { ssr: false });
const RevenueCatSetup = dynamic(() => import('@/components/RevenueCatSetup'), { ssr: false });

export default function NativeManagers() {
  return (
    <>
      <PushManager />
      <TrackingSetup />
      <RevenueCatSetup />
    </>
  );
}