'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'

function ProfileContent() {
  const [loading, setLoading] = useState(true)
  const [profileUser, setProfileUser] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const targetId = searchParams.get('id')

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      
      const { data: { user: loggedInUser } } = await supabase.auth.getUser()
      setCurrentUser(loggedInUser)

      const userIdToFetch = targetId || loggedInUser?.id

      if (!userIdToFetch) {
         setLoading(false)
         return 
      }

      // A. Fetch User Details
      let email = 'Unknown User'
      let memberSince = new Date().toLocaleDateString()

      const { data: userPosts } = await supabase
         .from('posts')
         .select('email, created_at')
         .eq('user_id', userIdToFetch)
         .not('email', 'is', null) 
         .order('created_at', { ascending: false }) 
         .limit(1)
      
      const { data: firstPost } = await supabase
         .from('posts')
         .select('created_at')
         .eq('user_id', userIdToFetch)
         .order('created_at', { ascending: true })
         .limit(1)

      if (userPosts && userPosts.length > 0) {
          email = userPosts[0].email
      } else if (loggedInUser && loggedInUser.id === userIdToFetch) {
          email = loggedInUser.email || ''
      }
      
      if (firstPost && firstPost.length > 0) {
          memberSince = new Date(firstPost[0].created_at).toLocaleDateString()
      }

      setProfileUser({ id: userIdToFetch, email, memberSince })

      // B. Fetch Post History
      const { data: history } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userIdToFetch)
        .order('created_at', { ascending: false })

      if (history) setPosts(history)
      setLoading(false)
    }

    loadProfile()
  }, [targetId])

  async function handleDelete(postId: string) {
      if (!confirm("Are you sure you want to delete this post?")) return
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (!error) {
          setPosts(prev => prev.filter(p => p.id !== postId))
      } else {
          alert("Error deleting: " + error.message)
      }
  }

  // --- THE TRANSLATOR FUNCTION ---
  const renderContent = (post: any) => {
    // 1. Handle Embeds (Canva, Spotify, etc.)
    if (post.post_type === 'embed') {
        const cleanHTML = DOMPurify.sanitize(post.content, {
            ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'blockquote', 'ul', 'li', 'br'],
            ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'title', 'allow', 'allowfullscreen', 'frameborder', 'href', 'target', 'class', 'loading'],
            ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
        });
        return <div style={{ marginTop: '10px', overflow: 'hidden', borderRadius: '8px' }} dangerouslySetInnerHTML={{ __html: cleanHTML }} />
    }

    // 2. Handle Normal Text & YouTube Links
    const text = post.content || '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    const textContent = parts.map((part: string, index: number) => {
      if (part.match(urlRegex)) {
        const youtubeMatch = part.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (youtubeMatch) return (
            <div key={index} style={{ margin: '15px 0' }}><iframe width="100%" height="300" src={`https://www.youtube.com/embed/${youtubeMatch[1]}`} title="YouTube" frameBorder="0" allowFullScreen style={{ borderRadius: '12px' }}></iframe></div>
        );
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'underline' }}>{part}</a>;
      }
      return <span key={index}>{part}</span>;
    });

    return (
      <div style={{ margin: '0 0 10px 0', lineHeight: '1.5' }}>
        {textContent}
      </div>
    )
  };

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading Profile...</div>

  const isMyProfile = currentUser && profileUser && currentUser.id === profileUser.id

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#111827', fontSize: '28px' }}>
             {isMyProfile ? 'My Profile' : 'User Profile'}
          </h1>
          <Link href="/" style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '6px', textDecoration: 'none', color: '#333', fontSize: '14px', fontWeight: 'bold' }}>
             ← Back to Feed
          </Link>
      </header>

      {/* PROFILE CARD */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
         <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>
             {profileUser?.email?.[0]?.toUpperCase() || '?'}
         </div>
         
         <div>
             <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#111827' }}>
                 {profileUser?.email}
             </h2>
             <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                 Member since: {profileUser?.memberSince}
             </p>
         </div>
      </div>

      {/* POST HISTORY */}
      <h3 style={{ color: '#111827', fontSize: '18px', marginBottom: '15px' }}>
          {isMyProfile ? 'My Post History' : `${profileUser?.email}'s Posts`}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {posts.length > 0 ? (
              posts.map(post => (
                  <div key={post.id} style={{ backgroundColor: '#111827', borderRadius: '12px', padding: '20px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', color: '#9ca3af' }}>
                          <span>{new Date(post.created_at).toLocaleString()}</span>
                          
                          {/* Only show "Delete" if it is MY profile */}
                          {isMyProfile && (
                              <button 
                                onClick={() => handleDelete(post.id)}
                                style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                              >
                                  Delete
                              </button>
                          )}
                      </div>
                      
                      {/* FIX: Use the renderContent function to show Embeds/Text properly */}
                      {renderContent(post)}
                      
                      {/* Show Uploaded Media (Images/Videos) */}
                      {post.media_url && (
                          <div style={{ marginTop: '10px' }}>
                              {post.post_type === 'image' && <img src={post.media_url} alt="Post media" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '300px', objectFit: 'cover' }} />}
                              {post.post_type === 'video' && <video controls src={post.media_url} style={{ maxWidth: '100%', borderRadius: '8px' }} />}
                              {post.post_type === 'audio' && <audio controls src={post.media_url} style={{ width: '100%' }} />}
                          </div>
                      )}
                  </div>
              ))
          ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                  No posts found.
              </div>
          )}
      </div>

    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  )
}