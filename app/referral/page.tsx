import ReferralDashboard from '@/components/ReferralDashboard'
import StripeConnectButton from '@/components/StripeConnectButton'

export default function ReferralPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '680px', margin: '0 auto' }}>
      
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
        Creator Monetization
      </h1>
      <p style={{ color: '#9CA3AF', marginBottom: '32px', fontSize: '15px' }}>
        Manage your payouts, sell to your followers, and earn money for referring friends to VIMciety.
      </p>

      {/* Just drop the button in! */}
      <StripeConnectButton />

      <div style={{ margin: '40px 0', borderBottom: '1px solid #374151' }}></div>
      
      <ReferralDashboard />
      
    </div>
  )
}