'use client'

import { useState, useEffect, Suspense, use } from 'react'
import { supabase } from '@/app/lib/supabase/client'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'

function PublicProfileContent({ username }: { username: string }) {
  const [loading, setLoading] = useState(true)
  const [profileUser, setProfileUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)

      // 1. Find user by Username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .single()

      if (!profileData) {
        setLoading(false)
        return
      }

      // 2. Fetch their post history
      const { data: history } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })

      // 3. Get "Member Since" date
      const { data: firstPost } = await supabase
        .from('posts')
        .select('created_at')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: true })
        .limit(1)

      setProfileUser({ 
        ...profileData, 
        memberSince: firstPost?.[0] ? new Date(firstPost[0].created_at).toLocaleDateString() : 'Recent'
      })
      
      if (history) setPosts(history)
      setLoading(false)
    }
    loadProfile()
  }, [username])

  const renderSafeHTML = (html: string) => {
      const clean = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'br'],
          ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'title', 'allow', 'allowfullscreen', 'frameborder', 'scrolling'],
          ADD_TAGS: ['iframe']
      })
      return <div dangerouslySetInnerHTML={{ __html: clean }} />
  }

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading @{username}...</div>
  if (!profileUser) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Profile @{username} not found.</div>

  return (
    <div style={{ 
        minHeight: '100vh', 
        backgroundImage: profileUser.background_url ? `url(${profileUser.background_url})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
        backgroundColor: '#111827' 
    }}>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.7)', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, color: 'white', fontSize: '28px' }}>@{profileUser.username}</h1>
                <Link href="/" style={{ padding: '8px 16px', backgroundColor: 'white', borderRadius: '6px', textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
                    ← Back to Feed
                </Link>
            </header>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '30px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>
                        {profileUser.username[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>{profileUser.username}</h2>
                        <p style={{ margin: 0, color: '#6b7280' }}>Member since: {profileUser.memberSince}</p>
                        {profileUser.bio && <p style={{ marginTop: '10px', color: '#374151', fontStyle: 'italic' }}>"{profileUser.bio}"</p>}
                    </div>
                </div>

                {profileUser.music_embed && (
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                        {renderSafeHTML(profileUser.music_embed)}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {posts.map(post => (
                    <div key={post.id} style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', color: 'white', border: '1px solid #374151' }}>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>{new Date(post.created_at).toLocaleString()}</p>
                        {post.post_type === 'embed' ? renderSafeHTML(post.content) : <p>{post.content}</p>}
                        {post.media_url && <img src={post.media_url} style={{maxWidth:'100%', borderRadius:'8px', marginTop:'10px'}} />}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  )
}

// ✅ FIXED: Using 'use(params)' to unwrap the Promise
export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PublicProfileContent username={username} />
    </Suspense>
  )
}