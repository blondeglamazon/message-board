'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'

export default function SearchPage() {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ users: any[], posts: any[] }>({ users: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [supabase])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setLoading(true)
    setHasSearched(true)

    // 1. Search Users (Username or Display Name)
    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10)

    // 2. Search Posts (Content) - Join with profiles to get author info
    const { data: posts } = await supabase
      .from('posts')
      .select('*, profiles!inner(*)') // !inner ensures we get posts that have valid authors
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    setResults({ users: users || [], posts: posts || [] })
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  // Helper for Post Media
  const renderMedia = (mediaUrl: string) => {
    if (!mediaUrl) return null
    const isVideo = mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i)
    return (
      <div style={{ marginTop: '15px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}>
        {isVideo ? (
          <video src={mediaUrl} controls playsInline style={{ width: '100%', display: 'block' }} />
        ) : (
          <img src={mediaUrl} alt="Post content" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />
        )}
      </div>
    )
  }

  const renderSafeHTML = (html: string) => {
    if (!html) return null;
    const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'br', 'strong', 'em', 'b', 'i', 'ul', 'li'],
        ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'frameborder', 'allow', 'allowfullscreen', 'scrolling', 'href', 'target', 'rel'],
        ADD_TAGS: ['iframe']
    })
    return <div dangerouslySetInnerHTML={{ __html: clean }} />
  }

  const renderPostContent = (post: any) => {
    if (post.post_type === 'embed' || (typeof post.content === 'string' && post.content.trim().startsWith('<'))) {
       return <div style={{marginTop:'10px', overflow:'hidden', borderRadius:'8px'}}>{renderSafeHTML(post.content)}</div>
    }
    return <p style={{ color: '#111827', fontSize: '16px', margin: 0, lineHeight: '1.4', fontWeight: '500' }}>{post.content}</p>
  }

  return (
    <div style={{ 
      minHeight: '100vh', backgroundColor: '#ffffff', 
      paddingTop: 'calc(20px + env(safe-area-inset-top))',
      paddingBottom: '100px'
    }}>
      
      {/* Floating Auth Buttons (Consistent with Profile) */}
      <div style={{ 
        position: 'absolute', top: '20px', right: '20px', 
        zIndex: 100, display: 'flex', gap: '10px' 
      }}>
        {currentUser ? (
          <button onClick={handleSignOut} style={{ 
            height: '44px', padding: '0 20px', borderRadius: '22px', 
            border: '2px solid #111827', backgroundColor: 'white', 
            fontWeight: 'bold', cursor: 'pointer', color: '#111827'
          }}>
            Log Out
          </button>
        ) : (
          <Link href="/login" style={{ 
            height: '44px', display:'flex', alignItems:'center', padding: '0 20px', 
            borderRadius: '22px', backgroundColor: '#111827', color: 'white', 
            fontWeight: 'bold', textDecoration: 'none'
          }}>
            Log In
          </Link>
        )}
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        <h1 style={{ color: '#111827', fontSize: '32px', fontWeight: '800', marginBottom: '20px', marginTop: '60px' }}>Search</h1>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users or posts..." 
            style={{ 
              flex: 1, height: '44px', padding: '0 15px', borderRadius: '22px', 
              border: '2px solid #111827', fontSize: '16px', color: '#111827' 
            }}
          />
          <button type="submit" style={{ 
            height: '44px', padding: '0 24px', borderRadius: '22px', 
            backgroundColor: '#111827', color: 'white', border: 'none', 
            fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' 
          }}>
            {loading ? '...' : 'Find'}
          </button>
        </form>

        {/* RESULTS */}
        {loading && <p style={{textAlign:'center', color:'#6b7280'}}>Searching...</p>}
        
        {!loading && hasSearched && results.users.length === 0 && results.posts.length === 0 && (
          <p style={{textAlign:'center', color:'#6b7280', fontSize:'18px'}}>No results found.</p>
        )}

        {/* 1. USERS SECTION */}
        {results.users.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#111827', marginBottom: '15px' }}>Users</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {results.users.map(user => (
                <Link key={user.id} href={`/u/${user.username}`} style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', padding: '15px', 
                    borderRadius: '16px', border: '2px solid #e5e7eb', backgroundColor: 'white',
                    transition: 'border-color 0.2s'
                  }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', marginRight: '15px', border: '1px solid #e5e7eb' }}>
                      <img src={user.avatar_url || '/default-avatar.png'} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>{user.display_name}</div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>@{user.username}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 2. POSTS SECTION */}
        {results.posts.length > 0 && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#111827', marginBottom: '15px' }}>Posts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {results.posts.map(post => (
                <div key={post.id} style={{ 
                  padding: '20px', borderRadius: '20px', border: '2px solid #111827', 
                  backgroundColor: '#ffffff' 
                }}>
                  {/* Post Author Header */}
                  <Link href={`/u/${post.profiles?.username}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                     <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', marginRight: '10px', border: '1px solid #e5e7eb' }}>
                        <img src={post.profiles?.avatar_url || '/default-avatar.png'} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     </div>
                     <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '14px' }}>
                        {post.profiles?.display_name || post.profiles?.username}
                     </span>
                     <span style={{ margin: '0 8px', color: '#9ca3af' }}>•</span>
                     <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(post.created_at).toLocaleDateString()}
                     </span>
                  </Link>
                  
                  {/* Content */}
                  {renderPostContent(post)}
                  {post.media_url && renderMedia(post.media_url)}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}