'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReferralDashboard from '@/components/ReferralDashboard'
import StripeConnectButton from '@/components/StripeConnectButton'
import CreateProductForm from '@/components/CreateProductForm'
import Storefront from '@/components/Storefront'
import { createClient } from '@/app/lib/supabase/client'

type StorefrontCommission = {
  id: string
  referred_user_id: string
  first_month_amount_cents: number
  commission_amount_cents: number
  status: 'pending' | 'paid' | 'voided'
  created_at: string
  paid_at: string | null
  profiles: { username: string | null; display_name: string | null } | null
}

const HOLDING_PERIOD_DAYS = 60

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function daysUntilPayout(createdAt: string) {
  const created = new Date(createdAt).getTime()
  const releaseDate = created + HOLDING_PERIOD_DAYS * 24 * 60 * 60 * 1000
  const days = Math.ceil((releaseDate - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

function PremiumStorefrontGate() {
  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#1F1F2E',
      borderRadius: '12px',
      border: '1px dashed #6D28D9',
      marginBottom: '32px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}>
      <span style={{ fontSize: '32px' }}>🔒</span>
      <div>
        <h3 style={{ color: 'white', margin: '0 0 6px', fontSize: '17px', fontWeight: 600 }}>
          Storefront is a Premium feature
        </h3>
        <p style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
          Upgrade to Premium to connect Stripe, create products, and sell to your followers.
        </p>
      </div>
    </div>
  )
}

function StorefrontAffiliatePanel({ userId, isPremium }: { userId: string; isPremium: boolean }) {
  const [supabase] = useState(() => createClient())
  const [commissions, setCommissions] = useState<StorefrontCommission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isPremium) { setLoading(false); return }

    async function load() {
      const { data } = await supabase
        .from('storefront_commissions')
        .select('*, profiles:storefront_commissions_referred_user_id_fkey(username, display_name)')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })

      setCommissions((data as StorefrontCommission[]) ?? [])
      setLoading(false)
    }
    load()
  }, [userId, isPremium, supabase])

  const totalPending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.commission_amount_cents, 0)

  const totalPaid = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.commission_amount_cents, 0)

  const activeCount = commissions.filter(c => c.status !== 'voided').length

  return (
    <div style={{ marginTop: '32px' }}>
      <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
        💼 Premium Subscription Commissions
        {isPremium && (
          <span style={{
            marginLeft: '10px', fontSize: '11px', padding: '3px 8px',
            borderRadius: '999px', backgroundColor: '#7C3AED22',
            color: '#A78BFA', fontWeight: 600, verticalAlign: 'middle'
          }}>
            PREMIUM
          </span>
        )}
      </h2>
      <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '4px' }}>
        Your <strong style={{ color: '#D1D5DB' }}>same referral link</strong> does double duty — it earns your base referral credit <em>and</em>, if you're Premium, unlocks a 25% commission on the referred user's first month of premium subscription (as long as they upgrade within 90 days of signing up).
      </p>
      <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '20px' }}>
        Commissions are released after a {HOLDING_PERIOD_DAYS}-day holding period to confirm the subscription stays active.
      </p>

      {!isPremium ? (
        <div style={{
          padding: '20px 24px',
          backgroundColor: '#1F1F2E',
          border: '1px dashed #6D28D9',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <span style={{ fontSize: '28px' }}>⭐</span>
          <div>
            <p style={{ color: 'white', fontWeight: 600, margin: '0 0 4px' }}>
              Upgrade to Premium to unlock the subscription bonus
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
              You already earn the base referral credit for every signup. Go Premium and your same referral link also earns 25% of every referred user's first premium subscription payment.
            </p>
          </div>
        </div>
      ) : loading ? (
        <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading commissions...</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{
              flex: 1, minWidth: '160px', padding: '16px 20px',
              backgroundColor: '#1C1C2E', borderRadius: '10px', border: '1px solid #374151'
            }}>
              <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pending ({HOLDING_PERIOD_DAYS}d hold)
              </p>
              <p style={{ color: '#FBBF24', fontSize: '24px', fontWeight: 700, margin: 0 }}>
                {formatCents(totalPending)}
              </p>
            </div>
            <div style={{
              flex: 1, minWidth: '160px', padding: '16px 20px',
              backgroundColor: '#1C1C2E', borderRadius: '10px', border: '1px solid #374151'
            }}>
              <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Earned
              </p>
              <p style={{ color: '#34D399', fontSize: '24px', fontWeight: 700, margin: 0 }}>
                {formatCents(totalPaid)}
              </p>
            </div>
            <div style={{
              flex: 1, minWidth: '160px', padding: '16px 20px',
              backgroundColor: '#1C1C2E', borderRadius: '10px', border: '1px solid #374151'
            }}>
              <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Subscriptions Referred
              </p>
              <p style={{ color: 'white', fontSize: '24px', fontWeight: 700, margin: 0 }}>
                {activeCount}
              </p>
            </div>
          </div>

          {commissions.length === 0 ? (
            <div style={{
              padding: '24px', textAlign: 'center',
              backgroundColor: '#111827', borderRadius: '10px', border: '1px solid #1F2937'
            }}>
              <p style={{ color: '#6B7280', margin: 0 }}>
                No subscription commissions yet. Share your referral link — when someone you referred upgrades to Premium within 90 days, you'll earn 25% of their first month.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {commissions.map(c => {
                const name = c.profiles?.display_name || c.profiles?.username || 'A referred user'
                const statusColor = c.status === 'paid' ? '#34D399' : c.status === 'voided' ? '#6B7280' : '#FBBF24'
                const isPending = c.status === 'pending'
                const daysLeft = isPending ? daysUntilPayout(c.created_at) : 0

                return (
                  <div key={c.id} style={{
                    padding: '14px 18px',
                    backgroundColor: '#111827',
                    borderRadius: '10px',
                    border: '1px solid #1F2937',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}>
                    <div>
                      <p style={{ color: 'white', fontWeight: 600, margin: '0 0 4px', fontSize: '14px' }}>
                        ⭐ {name} upgraded to Premium
                      </p>
                      <p style={{ color: '#6B7280', fontSize: '12px', margin: 0 }}>
                        Subscription: {formatCents(c.first_month_amount_cents)} · {new Date(c.created_at).toLocaleDateString()}
                        {isPending && (
                          <> · <span style={{ color: '#FBBF24' }}>Releases in {daysLeft} day{daysLeft === 1 ? '' : 's'}</span></>
                        )}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: statusColor, fontWeight: 700, fontSize: '16px', margin: '0 0 2px' }}>
                        {formatCents(c.commission_amount_cents)}
                      </p>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px',
                        borderRadius: '999px', backgroundColor: `${statusColor}22`,
                        color: statusColor, fontWeight: 600, textTransform: 'uppercase'
                      }}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ReferralPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [user, setUser] = useState<any>(null)
  const [isPremium, setIsPremium] = useState(false)
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_account_id, is_premium')
        .eq('id', authUser.id)
        .maybeSingle()

      setIsStripeConnected(!!profile?.stripe_account_id)
      setIsPremium(!!profile?.is_premium)
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

      {/* Storefront features (gated on Premium) */}
      {!isPremium ? (
        <PremiumStorefrontGate />
      ) : isStripeConnected ? (
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

      <StorefrontAffiliatePanel userId={user.id} isPremium={isPremium} />

    </div>
  )
}