'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'

export default function FollowingPage() {
  const [following, setFollowing] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadFollowing() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Step 1: Get the IDs of everyone I follow
      const { data: connections, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id)

      if (error) {
        console.error("Error loading following:", error)
        setLoading(false)
        return
      }

      // Step 2: Fetch profile details for those IDs
      if (connections && connections.length > 0) {
        const ids = connections.map(c => c.following_id)
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .in('id', ids)

        setFollowing(profiles || [])
      } else {
        setFollowing([])
      }
      
      setLoading(false)
    }
    loadFollowing()
  }, [supabase])

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#111827' }}>Loading...</div>

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: 'calc(80px + env(safe-area-inset-top)) 20px' }}>
      <h1 style={{ color: '#111827', fontSize: '28px', fontWeight: '800' }}>Following</h1>
      
      <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {following.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>You aren't following anyone yet.</p>
            <Link href="/search" style={{ color: '#6366f1', fontWeight: 'bold', textDecoration: 'none' }}>
              Find people to follow →
            </Link>
          </div>
        ) : (
          following.map(user => (
            <Link key={user.username} href={`/u/${user.username}`} style={{ textDecoration: 'none' }}>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', 
                borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                  <img src={user.avatar_url || '/default-avatar.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ color: '#111827', fontWeight: 'bold', fontSize: '16px' }}>
                  {user.display_name || user.username}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}