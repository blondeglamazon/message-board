'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'

export default function ProfilePage({ params }: { params: { username: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfileData() {
      // 1. Fetch the profile using 'ilike' for a case-insensitive match
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', params.username) 
        .single()

      if (profileData) {
        setProfile(profileData)

        // 2. Fetch only the posts belonging to this profile's ID
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })

        if (postsData) setUserPosts(postsData)
      } else {
        console.error("Profile fetch error:", error)
      }
      setLoading(false)
    }

    fetchProfileData()
  }, [params.username])

  if (loading) return <div style={{ color: '#111827', padding: '20px' }}>Loading...</div>
  
  // This is the error message you are currently seeing
  if (!profile) return (
    <div style={{ color: '#111827', padding: '20px' }}>
      <h1>Profile not found</h1>
      <p>We couldn't find a profile for "{params.username}"</p>
    </div>
  )

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', color: '#111827' }}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px' }}>@{profile.username}'s Profile</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {userPosts.map((msg) => (
          <div key={msg.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', color: 'white' }}>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}