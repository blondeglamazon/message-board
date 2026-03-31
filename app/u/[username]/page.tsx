'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import Storefront from '@/components/Storefront'
import Sidebar from '@/components/Sidebar'

type Props = {
  params: Promise<{ username: string }>
}

export default function StorefrontPage({ params }: Props) {
  const { username } = use(params)
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username || username === 'placeholder') return

    async function loadStorefront() {
      setLoading(true)

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, display_name, is_premium, is_admin, avatar_url, username')
        .eq('username', username)
        .maybeSingle()

      if (fetchError || !data) {
        setError('Storefront not found.')
        setLoading(false)
        return
      }

      if (!data.is_premium && !data.is_admin) {
        setError('This user has not unlocked their storefront yet.')
        setLoading(false)
        return
      }

      setProfile(data)
      setLoading(false)
    }

    loadStorefront()
  }, [username, supabase])

  if (!username || username === 'placeholder') return null

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
        Loading storefront...
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '16px' }}>{error || 'Storefront not found.'}</h2>
          <button
            onClick={() => router.back()}
            style={{ padding: '10px 20px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
      <Sidebar />

      <main style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '80px', paddingLeft: '20px', paddingRight: '20px', paddingBottom: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#374151', flexShrink: 0 }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : null}
          </div>
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: '28px' }}>
              {profile.display_name || profile.username}&apos;s Shop
            </h1>
            <p style={{ color: '#10B981', margin: '4px 0 0 0', fontWeight: 'bold', fontSize: '14px' }}>
              ✓ Verified VIMciety Seller
            </p>
          </div>
        </div>

        <hr style={{ borderColor: '#374151', marginBottom: '30px' }} />

        <Storefront userId={profile.id} />
      </main>
    </div>
  )
}