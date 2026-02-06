'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function ProfilePage({ params }: { params: { username: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchProfileData() {
      // 1. Fetch the profile details based on the username in the URL
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', params.username)
        .single()

      if (profileData) {
        setProfile(profileData)

        // 2. Fetch ONLY posts that belong to this specific profile's user_id
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', profileData.id) // This is the fix to show only your posts
          .order('created_at', { ascending: false })

        if (postsData) setUserPosts(postsData)
      }
      setLoading(false)
    }

    fetchProfileData()
  }, [params.username])

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading...</div>
  if (!profile) return <div style={{ color: 'white', padding: '20px' }}>Profile not found.</div>

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', color: 'white' }}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#6366f1', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: '32px', fontWeight: 'bold', margin: '0 auto 15px' 
        }}>
          {profile.username[0].toUpperCase()}
        </div>
        <h1 style={{ fontSize: '28px', margin: 0 }}>@{profile.username}</h1>
        <p style={{ color: '#888' }}>Member since {new Date().getFullYear()}</p>
      </header>

      <h2 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        My Posts
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {userPosts.length > 0 ? (
          userPosts.map((msg) => (
            <div 
              key={msg.id} 
              style={{ 
                backgroundColor: '#1a1a1a', // Matches your dark card theme
                padding: '20px', 
                borderRadius: '12px', 
                border: '1px solid #333'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{msg.email}</span>
                <span style={{ color: '#888', fontSize: '12px' }}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p style={{ margin: 0, lineHeight: '1.5' }}>{msg.content}</p>
            </div>
          ))
        ) : (
          <p style={{ color: '#888', textAlign: 'center' }}>No posts yet.</p>
        )}
      </div>
    </div>
  )
}