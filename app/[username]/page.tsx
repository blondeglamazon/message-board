'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'

export default function ProfilePage({ params }: { params: { username: string } }) {
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function fetchProfileAndPosts() {
      // 1. Find profile by username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', params.username)
        .single()

      if (profileData) {
        setProfile(profileData)
        // 2. Fetch ONLY posts belonging to this specific user ID
        const { data: postsData } = await supabase
          .from('posts')
          .select('id, content, created_at, email') // MUST include email
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })

        if (postsData) setUserPosts(postsData)
      }
    }
    fetchProfileAndPosts()
  }, [params.username])

  if (!profile) return <div style={{ color: '#111827' }}>Profile not found.</div>

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', color: '#111827' }}>
      <h1 style={{ textAlign: 'center' }}>@{profile.username}'s Posts</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
        {userPosts.map((msg: any) => (
          <div key={msg.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', color: 'white' }}>
             <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{msg.email}</span>
             <p>{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}