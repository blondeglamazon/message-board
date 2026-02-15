'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'

export default function FriendsPage() {
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

      const { data } = await supabase
        .from('followers')
        .select('profiles!followers_following_id_fkey(username, display_name, avatar_url)')
        .eq('follower_id', user.id)

      setFollowing(data?.map(d => d.profiles) || [])
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
          <p style={{ color: '#111827', fontStyle: 'italic' }}>You aren't following anyone yet.</p>
        ) : (
          following.map(user => (
            <Link key={user.username} href={`/u/${user.username}`} style={{ textDecoration: 'none' }}>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', 
                borderRadius: '12px', border: '1px solid #111827', backgroundColor: 'white' 
              }}>
                <img src={user.avatar_url || '/default-avatar.png'} alt="" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                <span style={{ color: '#111827', fontWeight: 'bold' }}>{user.display_name || user.username}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}