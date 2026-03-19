'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Capacitor } from '@capacitor/core'
import { createClient } from '@/app/lib/supabase/client' // 👈 ADDED THIS IMPORT

// ============================================================================
// 🎨 CENTRALIZED STYLES (Matches your VIMciety Theme)
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
    id: 'price_1TCoX04cqLiS65IRPQWpxnI4', 
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
    id: 'price_1TCoWy4cqLiS65IR5lgih0CC', 
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
  const supabase = createClient()
  
  useEffect(() => { 
      supabase.auth.getUser().then(({data}) => setCurrentUser(data.user)) 
  }, [])
  
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleUpgrade = async (tierId: string, tierName: string) => {
    if (tierId === 'free') return;
    if (!currentUser) return showToast("Please log in to upgrade", 'error'); // 👈 ADDED LOGIN CHECK
    
    setLoadingTier(tierId)
    
    try {
      const apiUrl = Capacitor.isNativePlatform() ? 'https://www.vimciety.com/api/checkout' : '/api/checkout';
      
      // 🚀 UNCOMMENTED FETCH AND ADDED USER ID / TIER NAME!
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            priceId: tierId,
            userId: currentUser.id, // Sends who is buying
            tierName: tierName      // Sends what they are buying
        })
      });
      
      const { url } = await response.json();
      
      if (url) {
          window.location.href = url; // Redirects to Stripe!
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
      
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: toast.type === 'error' ? '#ef4444' : '#22c55e', color: 'white', padding: '12px 24px', borderRadius: '24px', zIndex: 9999, fontWeight: 'bold', fontSize: '14px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
            {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 20px 60px 20px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 15px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            Choose Your Experience
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.5' }}>
            Upgrade your account to unlock powerful AI tools, stand out with exclusive badges, and build trust with your community.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px',
          alignItems: 'stretch'
        }}>
          {TIERS.map((tier) => (
            <div 
              key={tier.id}
              style={{
                backgroundColor: '#1f2937',
                borderRadius: '20px',
                padding: '40px 30px',
                border: tier.highlight ? '2px solid #fbbf24' : '1px solid #374151',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: tier.highlight ? '0 10px 30px -10px rgba(251, 191, 36, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Floating Badge */}
              {tier.badge && (
                <span style={{ 
                  position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                  backgroundColor: tier.highlight ? '#fbbf24' : '#3b82f6', 
                  color: tier.highlight ? '#111827' : 'white', 
                  padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px'
                }}>
                  {tier.badge}
                </span>
              )}

              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>{tier.name}</h2>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '42px', fontWeight: 'bold' }}>{tier.price}</span>
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

        <div style={{ textAlign: 'center', marginTop: '50px', color: '#6b7280', fontSize: '13px', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 8px 0' }}>🔒 Secure payments processed via Stripe.</p>
          <p style={{ margin: 0 }}>Identity verification is powered by Stripe Identity. Your sensitive data is never stored on our servers.</p>
        </div>
      </div>
    </div>
  )
}