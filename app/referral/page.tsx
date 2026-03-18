import ReferralDashboard from '@/components/ReferralDashboard'
import StripeConnectButton from '@/components/StripeConnectButton'
import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ReferralPage() {
  // 1. Get the current logged-in user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Check their profile to see if they already have a Stripe Account ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single()

  // 3. Create a simple boolean to know if they are connected
  const isStripeConnected = !!profile?.stripe_account_id

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '680px', margin: '0 auto' }}>
      
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
        Creator Monetization
      </h1>
      <p style={{ color: '#9CA3AF', marginBottom: '32px', fontSize: '15px' }}>
        Manage your payouts, sell to your followers, and earn money for referring friends to VIMciety.
      </p>

      {/* 4. MAGIC HAPPENS HERE: Conditionally render the UI */}
      {isStripeConnected ? (
        <div style={{ padding: '24px', backgroundColor: '#064E3B', borderRadius: '12px', border: '1px solid #059669' }}>
          <h3 style={{ color: 'white', marginBottom: '8px', fontSize: '18px', fontWeight: 600 }}>
            ✅ Payouts Connected
          </h3>
          <p style={{ color: '#A7F3D0', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
            Your bank account is successfully linked with Stripe! You are officially ready to sell merch, digital downloads, and subscriptions to your followers.
          </p>
        </div>
      ) : (
        <StripeConnectButton />
      )}

      <div style={{ margin: '40px 0', borderBottom: '1px solid #374151' }}></div>
      
      <ReferralDashboard />
      
    </div>
  )
}