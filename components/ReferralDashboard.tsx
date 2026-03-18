'use client'

import { useState, useEffect, useCallback } from 'react'

interface ReferralEntry {
  id: string
  status: 'pending_90_days' | 'paid' | 'rejected_deleted_account'
  created_at: string
  referred_email: string 
}

interface ReferralStats {
  link: string // <-- Added this so it matches the backend!
  total_referrals: number
  pending_referrals: number
  paid_referrals: number
  rejected_referrals?: number
  total_earned: number
  recent_referrals?: ReferralEntry[] | null
}

export default function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/referral/stats') 
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch referral stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const copyLink = async () => {
    // Check for the correct 'link' property now
    if (!stats?.link) return
    await navigator.clipboard.writeText(stats.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      pending_90_days: { bg: '#FEF3C7', text: '#92400E', label: 'Pending (90-day wait)' },
      paid:            { bg: '#D1FAE5', text: '#065F46', label: 'Paid!' },
      rejected_deleted_account: { bg: '#FEE2E2', text: '#991B1B', label: 'User Deleted Account' },
    }
    const s = styles[status] || { bg: '#F3F4F6', text: '#374151', label: 'Unknown' }
    return (
      <span style={{
        display: 'inline-block', padding: '2px 10px', borderRadius: 999,
        fontSize: 12, fontWeight: 600, backgroundColor: s.bg, color: s.text,
      }}>
        {s.label}
      </span>
    )
  }

  const daysUntilQualified = (createdAt: string) => {
    const created = new Date(createdAt)
    const qualifyDate = new Date(created.getTime() + 90 * 24 * 60 * 60 * 1000)
    const now = new Date()
    const daysLeft = Math.ceil((qualifyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, daysLeft)
  }

  if (loading) return <div style={{ padding: 24, color: '#6B7280', textAlign: 'center' }}>Loading referral data...</div>

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 20, fontFamily: 'inherit' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'white' }}>Referral Program</h2>
      <p style={{ color: '#9CA3AF', marginBottom: 24, fontSize: 14 }}>
        Earn a bonus for every new user who signs up with your link and stays active for 90 days.
        Each email can only earn a referral bonus once — no re-registrations.
      </p>

      {/* Referral Link Card */}
      <div style={{ border: '1px solid #374151', borderRadius: 12, padding: 20, marginBottom: 20, backgroundColor: '#1F2937' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#D1D5DB', marginBottom: 8 }}>Your Unique Link</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            readOnly
            value={stats?.link || 'Loading...'} // <-- Perfectly points to the backend link!
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #4B5563', fontSize: 13, color: 'white', backgroundColor: '#374151' }}
          />
          <button
            onClick={copyLink}
            style={{ padding: '10px 16px', borderRadius: 8, border: 'none', backgroundColor: copied ? '#10B981' : '#6366F1', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background-color 0.2s' }}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Referrals', value: stats?.total_referrals || 0, color: '#818CF8' },
          { label: 'Pending (90 Days)', value: stats?.pending_referrals || 0, color: '#FCD34D' },
          { label: 'Paid Referrals', value: stats?.paid_referrals || 0, color: '#34D399' },
          { label: 'Total Bonus Earned', value: `$${(stats?.total_earned || 0).toFixed(2)}`, color: '#60A5FA' },
        ].map((item) => (
          <div key={item.label} style={{ border: '1px solid #374151', borderRadius: 10, padding: 16, textAlign: 'center', backgroundColor: '#1F2937' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Referrals List */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'white' }}>Your Referrals</h3>
        {(!stats?.recent_referrals || stats.recent_referrals.length === 0) ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', border: '1px dashed #4B5563', borderRadius: 10, fontSize: 14 }}>
            No referrals yet. Share your link to get started!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.recent_referrals.map((ref) => (
              <div key={ref.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #374151', borderRadius: 10, fontSize: 14, backgroundColor: '#1F2937' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'white' }}>
                    {ref.referred_email.substring(0, 1) + '***@' + ref.referred_email.split('@')[1]}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                    Joined {new Date(ref.created_at).toLocaleDateString()}
                    {ref.status === 'pending_90_days' && <> — {daysUntilQualified(ref.created_at)} days left</>}
                  </div>
                </div>
                {getStatusBadge(ref.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}