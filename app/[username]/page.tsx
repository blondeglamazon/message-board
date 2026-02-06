'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'

export default function ProfilePage({ params }: { params: { username: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfileAndPosts() {
      setLoading(true)
      
      // 1. Fetch the profile details using 'ilike' for a case-insensitive match
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', params.username)
        .single()

      if (profileData) {
        setProfile(profileData)

        // 2. Fetch ONLY posts belonging to this specific profile's user_id
        // CRITICAL: We must explicitly select 'email' to avoid "Anonymous" labels
        const { data: postsData } = await supabase
          .from('posts')
          .select('id, content, created_at, email, user_id')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })

        if (postsData) setUserPosts(postsData)
      }
      setLoading(false)
    }

    if (params.username) {
      fetchProfileAndPosts()
    }
  }, [params.username])

  if (loading) return <div style={{ padding: '20px', color: '#111827' }}>Loading profile...</div>
  
  if (!profile) return (
    <div style={{ padding: '20px', color: '#111827' }}>
      <h1>Profile not found</h1>
      <p>We couldn't find a profile for "{params.username}"</p>
    </div>
  )

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', color: '#111827' }}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>@{profile.username}</h1>
        <p style={{ color: '#6366f1', fontWeight: 'bold' }}>VIMciety Member</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {userPosts.length > 0 ? (
          userPosts.map((msg: any) => (
            <div 
              key={msg.id} 
              style={{ 
                backgroundColor: '#1a1a1a', 
                padding: '20px', 
                borderRadius: '12px', 
                border: '1px solid #333',
                color: 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', color: '#6366f1' }}>
                  {msg.email || 'Anonymous User'}
                </span>
                <span style={{ color: '#888', fontSize: '12px' }}>
                  {new Date(msg.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: 0, lineHeight: '1.5' }}>{msg.content}</p>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#888' }}>No posts yet.</p>
        )}
      </div>
    </div>
  )
}