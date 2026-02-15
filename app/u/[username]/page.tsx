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
      <div style={{ marginTop: '10px', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'black' }}>
        {isVideo ? (
          <video src={mediaUrl} controls playsInline style={{ maxWidth: '100%', display: 'block' }} />
        ) : (
          <img src={mediaUrl} alt="Post media" style={{ maxWidth: '100%', display: 'block' }} />
        )}
      </div>
    )
  }

  if (loading) return <div style={{ padding: '100px 20px', textAlign: 'center', color: '#1f2937', fontWeight: 'bold' }}>Loading profile...</div>

  if (!profile) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2 style={{ color: '#111827' }}>User not found</h2>
        <Link href="/" style={{ color: '#6366f1', fontWeight: 'bold' }}>Go Home</Link>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div style={{ 
      maxWidth: '600px', margin: '0 auto', 
      paddingTop: 'calc(60px + env(safe-area-inset-top))', 
      paddingLeft: '20px', paddingRight: '20px', paddingBottom: '80px',
      fontFamily: 'sans-serif'
    }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
        
        {/* Avatar */}
        <div style={{ 
          width: '110px', height: '110px', borderRadius: '50%', 
          backgroundColor: '#e0e7ff', overflow: 'hidden', marginBottom: '15px',
          border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#6366f1', fontWeight: 'bold' }}>
              {profile.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Display Name - High Contrast */}
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0', color: '#111827', textAlign: 'center' }}>
          {profile.display_name || profile.username}
        </h1>

        {profile.bio && (
          <p style={{ 
            marginTop: '15px', textAlign: 'center', lineHeight: '1.6', 
            maxWidth: '450px', color: '#1f2937', fontSize: '16px' 
          }}>
            {profile.bio}
          </p>
        )}

        {/* Action Area */}
        <div style={{ marginTop: '25px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {profile.canva_design_id && <CanvaButton designId={profile.canva_design_id} />}
            
            {!isOwnProfile && currentUser && (
                <BlockButton userId={profile.id} username={profile.display_name || profile.username} />
            )}

            {isOwnProfile && (
                <Link href="/settings" style={{ 
                    textDecoration: 'none', padding: '0 24px', height: '44px', 
                    display:'flex', alignItems:'center', backgroundColor: '#111827', 
                    color: 'white', borderRadius: '22px', fontSize: '14px', fontWeight: 'bold' 
                }}>
                    Edit Profile
                </Link>
            )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '35px' }} />

      {/* POSTS LIST */}
      <div>
        <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', color: '#111827' }}>Recent Posts</h3>
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#4b5563', fontStyle: 'italic' }}>No posts yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {posts.map(post => (
              <div key={post.id} style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e5e7eb', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                   <span style={{ fontSize: '13px', color: '#4b5563', fontWeight: '500' }}>
                     {new Date(post.created_at).toLocaleDateString()}
                   </span>
                   {!isOwnProfile && <ReportButton postId={post.id} />}
                </div>

                <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#111827', fontSize: '16px', margin: 0 }}>
                  {post.content}
                </p>
                {post.media_url && renderMedia(post.media_url)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}