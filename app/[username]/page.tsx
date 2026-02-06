'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'

export default function ProfilePage({ params }: { params: { username: string } }) {
  // Use React.use() to safely unwrap params in newer Next.js versions if needed, 
  // but for most setups, params.username is direct.
  const username = params.username; 
  
  const [profile, setProfile] = useState<any>(null)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfileData() {
      if (!username) return;

      // 1. Fetch the profile using 'ilike' to ensure it finds 'blondeglamazon' 
      // regardless of URL capitalization.
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', username)
        .single()

      if (profileData) {
        setProfile(profileData)

        // 2. Fetch ONLY posts belonging to this user_id
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })

        if (postsData) setUserPosts(postsData)
      }
      setLoading(false)
    }

    fetchProfileData()
  }, [username])

  if (loading) return <div style={{ padding: '20px', color: '#111827' }}>Loading...</div>
  
  if (!profile) return (
    <div style={{ padding: '20px', color: '#111827' }}>
      <h1>Profile not found</h1>
      <p>We couldn't find a profile for "{username}"</p>
    </div>
  )

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', color: '#111827' }}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>@{profile.username}</h1>
        <p style={{ color: '#6366f1', fontWeight: 'bold' }}>VIMciety Member</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {userPosts.map((msg) => (
          <div key={msg.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', color: 'white' }}>
            <p style={{ margin: 0 }}>{msg.content}</p>
            <span style={{ fontSize: '10px', color: '#888' }}>
              {new Date(msg.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}