'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReferralDashboard from '@/components/ReferralDashboard'
import StripeConnectButton from '@/components/StripeConnectButton'
import CreateProductForm from '@/components/CreateProductForm'
import Storefront from '@/components/Storefront'
import { createClient } from '@/app/lib/supabase/client' 

export default function ReferralPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [isStripeConnected, setIsStripeConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }
      
      setUser(authUser)

      // 🛡️ THE AUDIT FIX: Using .maybeSingle() to prevent unhandled crashes
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', authUser.id)
        .maybeSingle() 

      setIsStripeConnected(!!profile?.stripe_account_id)
      setIsLoading(false)
    }

    loadData()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
        Loading dashboard...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '680px', margin: '0 auto' }}>
      
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
        Creator Monetization
      </h1>
      <p style={{ color: '#9CA3AF', marginBottom: '32px', fontSize: '15px' }}>
        Manage your payouts, sell to your followers, and earn money for referring friends to VIMciety.
      </p>

      {isStripeConnected ? (
        <>
          <div style={{ padding: '24px', backgroundColor: '#064E3B', borderRadius: '12px', border: '1px solid #059669', marginBottom: '32px' }}>
            <h3 style={{ color: 'white', marginBottom: '8px', fontSize: '18px', fontWeight: 600 }}>
              ✅ Payouts Connected
            </h3>
            <p style={{ color: '#A7F3D0', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
              Your bank account is successfully linked with Stripe! You are officially ready to sell merch, digital downloads, and subscriptions to your followers.
            </p>

            <CreateProductForm />
          </div>

          <Storefront userId={user.id} />
        </>
      ) : (
        <StripeConnectButton />
      )}

      <div style={{ margin: '40px 0', borderBottom: '1px solid #374151' }}></div>
      
      <ReferralDashboard />
      
    </div>
  )
}