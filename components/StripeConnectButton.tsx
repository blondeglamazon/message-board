'use client'

import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { createClient } from '@/app/lib/supabase/client'

export default function StripeConnectButton() {
  const [loading, setLoading] = useState(false)
  const [supabase] = useState(() => createClient())

  const handleConnect = async () => {
    setLoading(true)
    try {
      // Get the auth token so the API can identify the user on mobile
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      // On mobile, API routes don't exist locally — call the live server
      const baseUrl = Capacitor.isNativePlatform() ? 'https://www.vimciety.com' : ''

      const res = await fetch(`${baseUrl}/api/stripe/onboard`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to generate onboarding link')
      }
    } catch (error) {
      console.error(error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#1F2937', borderRadius: '12px', border: '1px solid #374151' }}>
      <h3 style={{ color: 'white', marginBottom: '8px', fontSize: '18px', fontWeight: 600 }}>Start Selling</h3>
      <p style={{ color: '#9CA3AF', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
        Connect your bank account with Stripe to start selling merch, digital downloads, and premium access directly to your followers. VIMciety takes a small percentage of sales to keep the platform running.
      </p>
      <button 
        onClick={handleConnect} 
        disabled={loading}
        style={{ 
          backgroundColor: '#6366F1', 
          color: 'white', 
          padding: '12px 20px', 
          borderRadius: '8px', 
          border: 'none', 
          fontWeight: 600, 
          fontSize: '14px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'background-color 0.2s'
        }}
      >
        {loading ? 'Connecting to Stripe...' : 'Set up Stripe Payouts'}
      </button>
    </div>
  )
}