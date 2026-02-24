'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation' // Added useRouter for mobile taps

export default function FriendsPage() {
  const [friends, setFriends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter() // Initialize router

  useEffect(() => {
    async function loadFriends() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // 1. Get IDs of people I follow
      const { data: followingData } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id)
      
      const myFollowingIds = new Set(followingData?.map(f => f.following_id))

      // 2. Get people who follow me (Followers)
      // Note: Adjust the foreign key alias '!followers_follower_id_fkey' if your schema differs
      const { data: followersData } = await supabase
        .from('followers')
        .select('follower_id, profiles!followers_follower_id_fkey(username, display_name, avatar_url)')
        .eq('following_id', user.id)

      // 3. Filter for Mutuals (Friends)
      const mutuals = followersData
        ?.filter(f => myFollowingIds.has(f.follower_id))
        .map(f => f.profiles) || []

      setFriends(mutuals)
      setLoading(false)
    }
    loadFriends()
  }, [supabase])

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#111827' }}>Loading...</div>

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: 'calc(80px + env(safe-area-inset-top)) 20px' }}>
      <h1 style={{ color: '#111827', fontSize: '28px', fontWeight: '800' }}>Friends</h1>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>People you follow who follow you back.</p>
      
      <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {friends.length === 0 ? (
          <p style={{ color: '#111827', fontStyle: 'italic' }}>No mutual friends yet.</p>
        ) : (
          friends.map((user: any) => (
            /* FIX FOR MOBILE TAPS & CORRECT PROFILE ROUTE */
            <div 
              key={user.username} 
              onClick={() => router.push(`/profile?u=${user.username}`)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', 
                borderRadius: '12px', border: '1px solid #111827', backgroundColor: 'white',
                cursor: 'pointer' // Added pointer cursor
              }}
            >
              <img src={user.avatar_url || '/default-avatar.png'} alt="" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ color: '#111827', fontWeight: 'bold' }}>{user.display_name || user.username}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}