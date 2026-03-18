import ReferralDashboard from '@/components/ReferralDashboard'
import StripeConnectButton from '@/components/StripeConnectButton'
import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ReferralPage() {
  // 1. Check who is logged in securely on the server
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 2. If no one is logged in, send them to login
  if (!user) {
    redirect('/login')
  }

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '680px', margin: '0 auto' }}>
      
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
        Creator Monetization
      </h1>
      <p style={{ color: '#9CA3AF', marginBottom: '32px', fontSize: '15px' }}>
        Manage your payouts, sell to your followers, and earn money for referring friends to VIMciety.
      </p>

      {/* 3. Give the user's ID directly to the button component */}
      <StripeConnectButton userId={user.id} />

      <div style={{ margin: '40px 0', borderBottom: '1px solid #374151' }}></div>
      
      <ReferralDashboard />
      
    </div>
  )
}