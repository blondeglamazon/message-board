'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Capacitor } from '@capacitor/core'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'

// ============================================================================
// 🎨 CENTRALIZED STYLES 
// ============================================================================
const STYLES = {
  btnPrimary: { backgroundColor: '#6366f1', color: 'white', fontWeight: 'bold' as const, border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', width: '100%', fontSize: '16px', transition: 'transform 0.2s, opacity 0.2s' },
  btnPremium: { backgroundColor: '#fbbf24', color: '#111827', fontWeight: 'bold' as const, border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', width: '100%', fontSize: '16px', transition: 'transform 0.2s, opacity 0.2s' },
  btnVerified: { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' as const, border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', width: '100%', fontSize: '16px', transition: 'transform 0.2s, opacity 0.2s' },
  btnDisabled: { backgroundColor: '#374151', color: '#9ca3af', fontWeight: 'bold' as const, border: 'none', padding: '14px', borderRadius: '10px', width: '100%', fontSize: '16px', cursor: 'not-allowed' },
}

const TIERS = [
  {
    id: 'free',
    name: 'Community',
    price: '$0',
    interval: '',
    description: 'Perfect for getting started and connecting with others.',
    features: ['Basic Social Posting', 'Standard Profile', 'Community Access', 'Follow/Message Others'],
    buttonText: 'Current Plan',
    buttonStyle: STYLES.btnDisabled,
    highlight: false,
    badge: null
  },
  {
    id: process.env.NEXT_PUBLIC_STRIPE_PRICE_VIM_PLUS || '', 
    name: 'VIM+',
    price: '$9.99',
    interval: '/mo',
    description: 'Unlock the full power of VIMciety with AI, Analytics, and E-Commerce.',
    features: ['🛍️ Personal Storefront', '⭐ VIM+ Profile Badge', '✨ Magic AI Bio Writer', '📖 AI Story Assistant', '📈 Profile Analytics'],
    buttonText: 'Upgrade to VIM+',
    buttonStyle: STYLES.btnPremium,
    highlight: true,
    badge: 'MOST POPULAR'
  },
  {
    id: process.env.NEXT_PUBLIC_STRIPE_PRICE_VERIFIED || '', 
    name: 'Verified',
    price: '$19.99',
    interval: '/mo',
    description: 'For influencers and brands who need total trust and security.',
    features: ['✅ Verified Checkmark', 'Identity Verification (ID.me style)', 'All VIM+ Features', 'Impersonation Protection', 'Advanced Shop Features'],
    buttonText: 'Get Verified',
    buttonStyle: STYLES.btnVerified,
    highlight: false,
    badge: 'FOR CREATORS'
  }
]

export default function UpgradePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isNative, setIsNative] = useState(false)
  const supabase = createClient()
  
  useEffect(() => { 
      setIsNative(Capacitor.isNativePlatform())
      supabase.auth.getUser().then(({data}) => setCurrentUser(data.user)) 
  }, [])
  
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // 🔄 NEW: Required by Apple - Restore Purchases Function
  const handleRestore = async () => {
    if (!isNative) return showToast("Only available on the mobile app.", "error");
    setIsRestoring(true);
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      await Purchases.restorePurchases();
      showToast("Purchases successfully restored!");
    } catch (error) {
      console.error("Restore Error:", error);
      showToast("Failed to restore purchases.", "error");
    }
    setIsRestoring(false);
  }

  const handleUpgrade = async (tierId: string, tierName: string) => {
    if (tierId === 'free') return;
    if (!currentUser) return showToast("Please log in to upgrade", 'error');
    
    // 📱 NATIVE APP LOGIC (iOS & Android) - Triggers RevenueCat
    if (isNative) {
      try {
        const { RevenueCatUI } = await import('@revenuecat/purchases-capacitor-ui');
        await RevenueCatUI.presentPaywall(); 
        return; 
      } catch (error) {
        console.error("RevenueCat Error:", error);
        showToast("Could not load the upgrade screen.", "error");
        return;
      }
    }

    // 🌐 WEB LOGIC - Triggers Stripe Checkout
    if (!tierId) return showToast("Checkout is currently unavailable.", 'error');
    setLoadingTier(tierId)
    
    try {
      const apiUrl = '/api/checkout';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: tierId, userId: currentUser.id, tierName: tierName })
      });
      
      const { url } = await response.json();
      if (url) {
          window.location.href = url;
      } else {
          showToast("Error getting checkout link.", 'error')
          setLoadingTier(null)
      }
    } catch (error) {
      showToast("Unable to start checkout. Please try again.", 'error')
      setLoadingTier(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', position: 'relative' }}>
      <Sidebar />
      
      {toast && (
        <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: toast.type === 'error' ? '#ef4444' : '#22c55e', color: 'white', padding: '12px 24px', borderRadius: '24px', zIndex: 9999, fontWeight: 'bold', fontSize: '14px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
            {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 20px 60px 20px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 'bold', margin: '0 0 15px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            Choose Your Experience
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.5' }}>
            Upgrade your account to unlock powerful AI tools, stand out with exclusive badges, and build trust with your community.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '24px',
          alignItems: 'stretch'
        }}>
          {TIERS.map((tier) => (
            <div 
              key={tier.name}
              style={{
                backgroundColor: '#1f2937',
                borderRadius: '20px',
                padding: '40px 20px',
                border: tier.highlight ? '2px solid #fbbf24' : '1px solid #374151',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: tier.highlight ? '0 10px 30px -10px rgba(251, 191, 36, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              {tier.badge && (
                <span style={{ 
                  position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                  backgroundColor: tier.highlight ? '#fbbf24' : '#3b82f6', 
                  color: tier.highlight ? '#111827' : 'white', 
                  padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px',
                  whiteSpace: 'nowrap'
                }}>
                  {tier.badge}
                </span>
              )}

              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>{tier.name}</h2>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: 'clamp(32px, 4vw, 42px)', fontWeight: 'bold' }}>{tier.price}</span>
                <span style={{ color: '#9ca3af', fontSize: '16px' }}>{tier.interval}</span>
              </div>
              <p style={{ color: '#d1d5db', margin: '0 0 30px 0', fontSize: '14px', lineHeight: '1.6', minHeight: '44px' }}>
                {tier.description}
              </p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', flex: 1 }}>
                {tier.features.map((feature, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', fontSize: '14px', color: '#e5e7eb' }}>
                    <span style={{ color: tier.highlight ? '#fbbf24' : '#22c55e', fontSize: '16px', marginTop: '-2px' }}>✓</span> 
                    <span style={{ lineHeight: '1.4' }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleUpgrade(tier.id, tier.name)}
                disabled={tier.id === 'free' || loadingTier === tier.id}
                style={{
                  ...tier.buttonStyle,
                  opacity: loadingTier === tier.id ? 0.7 : 1
                }}
              >
                {loadingTier === tier.id ? 'Loading...' : tier.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* 🚨 REQUIRED BY APPLE: Restore Button & Legal Text           */}
        {/* ========================================================= */}
        <div style={{ textAlign: 'center', marginTop: '40px', color: '#6b7280', fontSize: '12px', lineHeight: '1.5', padding: '0 20px' }}>
          
          <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
             <Link href="/terms" style={{ color: '#9ca3af', textDecoration: 'underline' }}>Terms of Use (EULA)</Link>
             <span style={{ color: '#4b5563' }}>|</span>
             <Link href="/privacy" style={{ color: '#9ca3af', textDecoration: 'underline' }}>Privacy Policy</Link>
             
             {/* The Mandatory Restore Button for iOS */}
             {isNative && (
               <>
                 <span style={{ color: '#4b5563' }}>|</span>
                 <button 
                    onClick={handleRestore} 
                    disabled={isRestoring}
                    style={{ background: 'none', border: 'none', color: '#9ca3af', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
                   {isRestoring ? 'Restoring...' : 'Restore Purchases'}
                 </button>
               </>
             )}
          </div>

          {/* The Mandatory Auto-Renew Boilerplate */}
          {isNative ? (
            <p style={{ margin: '0 auto', maxWidth: '700px', color: '#6b7280', textAlign: 'justify' }}>
              Payment will be charged to your Apple ID account at the confirmation of purchase. Subscription automatically renews unless it is canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your App Store account settings after purchase.
            </p>
          ) : (
            <>
              <p style={{ margin: '0 0 8px 0' }}>🔒 Secure payments processed via Stripe.</p>
              <p style={{ margin: 0 }}>Identity verification is powered by Stripe Identity. Your sensitive data is never stored on our servers.</p>
            </>
          )}

        </div>

      </div>
    </div>
  )
}