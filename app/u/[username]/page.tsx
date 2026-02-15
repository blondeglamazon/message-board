'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useParams } from 'next/navigation' 
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify' // Required for Spotify/Soundcloud
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
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setCurrentUser(authUser)
      if (!usernameParam) return
      const cleanUsername = decodeURIComponent(usernameParam)

      const { data: profileData } = await supabase.from('profiles').select('*').eq('username', cleanUsername).single()
      if (profileData) {
        setProfile(profileData)
        const { data: postData } = await supabase.from('posts').select('*').eq('user_id', profileData.id).order('created_at', { ascending: false })
        setPosts(postData || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [usernameParam, supabase])

  const renderSafeHTML = (html: string) => {
    if (!html) return null;
    const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['iframe', 'div', 'p', 'span'],
        ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'frameborder', 'allow', 'allowfullscreen', 'scrolling']
    })
    return <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', marginTop: '15px' }} dangerouslySetInnerHTML={{ __html: clean }} />
  }

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#111827' }}>Loading...</div>
  if (!profile) return <div style={{ padding: '100px', textAlign: 'center' }}>User not found.</div>

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div style={{ 
      maxWidth: '600px', margin: '0 auto', 
      paddingTop: 'calc(60px + env(safe-area-inset-top))', // Mobile safe-area compliance
      paddingLeft: '20px', paddingRight: '20px', paddingBottom: '80px'
    }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        {/* Avatar */}
        <div style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '15px' }}>
          <img src={profile.avatar_url || '/default-avatar.png'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Display Name - Only chosen name, high contrast */}
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: 0 }}>
          {profile.display_name || profile.username}
        </h1>

        {profile.bio && (
          <p style={{ marginTop: '15px', color: '#1f2937', fontSize: '16px', lineHeight: '1.6' }}>{profile.bio}</p>
        )}

        {/* Music Embeds Restored */}
        {profile.music_embed && renderSafeHTML(profile.music_embed)}

        {/* Action Buttons */}
        <div style={{ marginTop: '25px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {profile.canva_design_id && <CanvaButton designId={profile.canva_design_id} />}
            
            {!isOwnProfile && currentUser && (
                <BlockButton userId={profile.id} username={profile.display_name || profile.username} />
            )}

            {isOwnProfile && (
                <Link href="/settings" style={{ textDecoration: 'none', padding: '0 24px', height: '44px', display:'flex', alignItems:'center', backgroundColor: '#111827', color: 'white', borderRadius: '22px', fontSize: '14px', fontWeight: 'bold' }}>
                    Edit Profile
                </Link>
            )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '35px 0' }} />

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {posts.map(post => (
          <div key={post.id} style={{ padding: '20px', borderRadius: '16px', border: '1px solid #e5e7eb', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
               <span style={{ fontSize: '12px', color: '#4b5563' }}>{new Date(post.created_at).toLocaleDateString()}</span>
               {!isOwnProfile && <ReportButton postId={post.id} />}
            </div>
            <p style={{ color: '#111827', fontSize: '16px', margin: 0 }}>{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}