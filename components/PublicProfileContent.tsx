'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase/client'
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

  // 1. SAFE HTML RENDERER (Updated for Canva/Spotify)
  const renderSafeHTML = (html: string) => {
      if (!html) return null;
      const clean = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'br', 'strong', 'em', 'b', 'i', 'ul', 'li'],
          ALLOWED_ATTR: [
            'src', 'width', 'height', 'style', 'title', 'class', 'id',
            'allow', 'allowfullscreen', 'frameborder', 'scrolling', 
            'loading', 'referrerpolicy'
          ],
          ADD_TAGS: ['iframe', 'link']
      })
      return <div dangerouslySetInnerHTML={{ __html: clean }} />
  }

  // 2. MEMBER SINCE DATE
  const memberSince = profile.created_at 
    ? new Date(profile.created_at).toLocaleDateString() 
    : 'Unknown'

  // 3. BACKGROUND LOGIC: Check if it starts with '<' (Embed Code) or is a URL
  // We use .trim() to handle accidental spaces
  const isEmbedBackground = profile.background_url && profile.background_url.trim().startsWith('<');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', backgroundColor: '#111827' }}>
        
        {/* === BACKGROUND LAYER (Fixed at back) === */}
        <div style={{ 
            position: 'fixed', 
            top: 0, left: 0, width: '100%', height: '100%', 
            zIndex: 0, // Behind content
            overflow: 'hidden',
            pointerEvents: 'none' // Ensures clicks pass through to content
        }}>
            {isEmbedBackground ? (
                // OPTION A: It is a Canva/HTML Embed
                <div style={{ width: '100%', height: '100%', opacity: 0.6 }}> 
                    {renderSafeHTML(profile.background_url)}
                </div>
            ) : (
                // OPTION B: It is a normal Image URL
                <div style={{ 
                    width: '100%', height: '100%', 
                    backgroundImage: profile.background_url ? `url(${profile.background_url})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center'
                }} />
            )}
        </div>

        {/* === CONTENT LAYER (Scrollable on top) === */}
        <div style={{ 
            position: 'relative', 
            zIndex: 1, // On top of background
            backgroundColor: 'rgba(0,0,0,0.5)', // Dark overlay for readability
            minHeight: '100vh', 
            padding: '20px' 
        }}>
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
                            <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase', fontWeight: 'bold' }}>Featured Music</p>
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