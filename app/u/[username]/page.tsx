'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client' // <--- MUST use client
import { useParams } from 'next/navigation'
import Link from 'next/link'
// You can keep this if it's just a visual component, otherwise remove it and use the UI below
// import PublicProfileContent from '@/components/PublicProfileContent' 

export default function UserProfilePage() {
  const params = useParams()
  // This grabs the username from the URL (e.g., /u/cooluser)
  const username = params?.username as string
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      if (!username) return

      // Fetch Profile using the 'homepage_slug'
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('homepage_slug', username)
        .maybeSingle()

      if (error || !profileData) {
        console.log("Error or no profile:", error)
        setLoading(false)
        return
      }
      setProfile(profileData)
      setLoading(false)
    }

    loadData()
  }, [username])

  if (loading) return <div style={{ padding: 40, color: 'white' }}>Loading...</div>

  if (!profile) {
    return (
      <div style={{ padding: 40, color: 'white', textAlign: 'center' }}>
        <h1>Profile Not Found</h1>
        <p>The user @{username} does not exist.</p>
        <Link href="/" style={{ color: '#aaa', textDecoration: 'underline' }}>Return Home</Link>
      </div>
    )
  }

  // If you have a separate component that takes 'profile' as a prop, you can use it here:
  // return <PublicProfileContent profile={profile} />
  
  // Otherwise, here is the direct UI to ensure it works:
  return (
    <div style={{ padding: 40, color: 'white', maxWidth: '800px', margin: '0 auto' }}>
      <Link href="/" style={{ display: 'block', marginBottom: 20, color: '#aaa' }}>← Back</Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {profile.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt={profile.username} 
            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
            {profile.username?.charAt(0).toUpperCase()}
          </div>
        )}
        
        <div>
          <h1 style={{ margin: 0 }}>{profile.username}</h1>
          <p style={{ color: '#aaa', marginTop: 5 }}>{profile.bio || 'No bio yet.'}</p>
        </div>
      </div>
    </div>
  )
}

// THE FIX: This tells Next.js to ignore this dynamic page during the build
export async function generateStaticParams() {
  return []
}