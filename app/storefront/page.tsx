'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import Storefront from '@/components/Storefront'
import Sidebar from '@/components/Sidebar'

function StorefrontContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Grab the params
  const userId = searchParams.get('id')
  const username = searchParams.get('u')

  useEffect(() => {
    async function loadStorefront() {
      setLoading(true)

      // 1. Check if Capacitor actually read the URL parameters
      if (!userId && !username) {
        setError(`URL Param Error: Could not find ?id or ?u in the app URL.`)
        setLoading(false)
        return
      }

      let query = supabase
        .from('profiles')
        .select('id, display_name, is_premium, is_admin, avatar_url, username')

      if (userId) {
        query = query.eq('id', userId)
      } else if (username) {
        query = query.eq('username', username)
      }

      const { data, error: fetchError } = await query.maybeSingle()

      // 2. Expose the actual Supabase error to the mobile UI
      if (fetchError) {
        setError(`Supabase Error: ${fetchError.message || fetchError.details}`)
        setLoading(false)
        return
      }

      if (!data) {
        setError('Storefront not found in database.')
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
  }, [userId, username, supabase])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
        Loading storefront...
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          {/* This will now show the EXACT reason it failed on mobile */}
          <h2 style={{ marginBottom: '16px', color: '#EF4444' }}>{error}</h2>
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

export default function StorefrontPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
        Loading storefront...
      </div>
    }>
      <StorefrontContent />
    </Suspense>
  )
}