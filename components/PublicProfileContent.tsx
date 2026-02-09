'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase/client' // Ensure this matches your actual client path
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'

export default function PublicProfileContent({ profile }: { profile: any }) {
  const [posts, setPosts] = useState<any[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  useEffect(() => {
    async function loadPosts() {
      if (!profile?.id) return
      
      // Fetch posts for this user
      const { data: history } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      
      if (history) setPosts(history)
      setLoadingPosts(false)
    }
    loadPosts()
  }, [profile])

  const renderSafeHTML = (html: string) => {
      const clean = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'br'],
          ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'title', 'allow', 'allowfullscreen', 'frameborder', 'scrolling'],
          ADD_TAGS: ['iframe']
      })
      return <div dangerouslySetInnerHTML={{ __html: clean }} />
  }

  // Calculate member since date safely
  const memberSince = profile.created_at 
    ? new Date(profile.created_at).toLocaleDateString() 
    : 'Unknown'

  return (
    <div style={{ 
        minHeight: '100vh', 
        backgroundImage: profile.background_url ? `url(${profile.background_url})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
        backgroundColor: '#111827' 
    }}>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.7)', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            
            {/* HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, color: 'white', fontSize: '28px' }}>@{profile.username}</h1>
                <Link href="/" style={{ padding: '8px 16px', backgroundColor: 'white', borderRadius: '6px', textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
                    ← Back to Feed
                </Link>
            </header>

            {/* PROFILE CARD */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '30px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', overflow: 'hidden' }}>
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            profile.username?.[0]?.toUpperCase()
                        )}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>{profile.username}</h2>
                        <p style={{ margin: 0, color: '#6b7280' }}>Member since: {memberSince}</p>
                        {profile.bio && <p style={{ marginTop: '10px', color: '#374151', fontStyle: 'italic' }}>"{profile.bio}"</p>}
                    </div>
                </div>

                {profile.music_embed && (
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                        {renderSafeHTML(profile.music_embed)}
                    </div>
                )}
            </div>

            {/* POSTS FEED */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {posts.map(post => (
                    <div key={post.id} style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', color: 'white', border: '1px solid #374151' }}>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>{new Date(post.created_at).toLocaleString()}</p>
                        {post.post_type === 'embed' ? renderSafeHTML(post.content) : <p>{post.content}</p>}
                        {post.media_url && <img src={post.media_url} style={{maxWidth:'100%', borderRadius:'8px', marginTop:'10px'}} />}
                    </div>
                ))}
                {posts.length === 0 && !loadingPosts && (
                    <div style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>No posts to show.</div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}