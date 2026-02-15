'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useParams } from 'next/navigation' 
import Link from 'next/link'
import BlockButton from '@/components/BlockButton'
import CanvaButton from '@/components/CanvaButton'
import ReportButton from '@/components/ReportButton' 

export default function UserProfile() {
  const supabase = createClient()
  const params = useParams()
  const usernameParam = params?.username as string

  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (!usernameParam) return

      const cleanUsername = decodeURIComponent(usernameParam)

      // 1. Fetch Profile by USERNAME
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanUsername)
        .single()

      if (error || !profileData) {
        setLoading(false)
        return
      }

      setProfile(profileData)

      // 2. Fetch User Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })

      if (postsData) setPosts(postsData)
      setLoading(false)
    }

    fetchData()
  }, [usernameParam, supabase])

  const renderMedia = (mediaUrl: string) => {
    if (!mediaUrl) return null
    const isVideo = mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i)
    return (
      <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'black' }}>
        {isVideo ? (
          <video src={mediaUrl} controls playsInline style={{ maxWidth: '100%', display: 'block' }} />
        ) : (
          <img src={mediaUrl} alt="Post media" style={{ maxWidth: '100%', display: 'block' }} />
        )}
      </div>
    )
  }

  if (loading) return <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6b7280' }}>Loading profile...</div>

  if (!profile) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>User not found</h2>
        <p>This user may have changed their name or does not exist.</p>
        <Link href="/" style={{ color: '#6366f1' }}>Go Home</Link>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div style={{ 
      maxWidth: '600px', margin: '0 auto', 
      paddingTop: 'calc(60px + env(safe-area-inset-top))', 
      paddingLeft: '20px', paddingRight: '20px', paddingBottom: '80px',
      fontFamily: 'sans-serif', color: '#111827'
    }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
        
        {/* Avatar */}
        <div style={{ 
          width: '100px', height: '100px', borderRadius: '50%', 
          backgroundColor: '#e0e7ff', overflow: 'hidden', marginBottom: '15px',
          border: '4px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', color: '#6366f1' }}>
              {profile.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0' }}>{profile.display_name || profile.username}</h1>
        <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>@{profile.username}</p>

        {profile.bio && (
          <p style={{ marginTop: '15px', textAlign: 'center', lineHeight: '1.5', maxWidth: '400px' }}>
            {profile.bio}
          </p>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            
            {profile.canva_design_id && <CanvaButton designId={profile.canva_design_id} />}
            
            {!isOwnProfile && currentUser && (
                <BlockButton userId={profile.id} username={profile.username} />
            )}

            {isOwnProfile && (
                <Link href="/settings" style={{ textDecoration: 'none', padding: '0 20px', height: '44px', display:'flex', alignItems:'center', backgroundColor: '#374151', color: 'white', borderRadius: '22px', fontSize: '14px', fontWeight: 'bold' }}>
                    Edit Profile
                </Link>
            )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '30px' }} />

      {/* POSTS LIST */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Recent Posts</h3>
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af' }}>No posts yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {posts.map(post => (
              <div key={post.id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                   <span style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(post.created_at).toLocaleDateString()}</span>
                   {!isOwnProfile && <ReportButton postId={post.id} />}
                </div>

                <p style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{post.content}</p>
                {post.media_url && renderMedia(post.media_url)}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}