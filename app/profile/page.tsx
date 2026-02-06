'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ProfileContent() {
  const [loading, setLoading] = useState(true)
  const [profileUser, setProfileUser] = useState<any>(null) // The user we are VIEWING
  const [currentUser, setCurrentUser] = useState<any>(null) // The user who is LOGGED IN
  const [posts, setPosts] = useState<any[]>([])
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 1. Get the ID from the URL (if it exists)
  const targetId = searchParams.get('id')

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      
      // Get the currently logged-in user
      const { data: { user: loggedInUser } } = await supabase.auth.getUser()
      setCurrentUser(loggedInUser)

      // Decide which ID to look up: The URL ID or the Logged-in ID
      const userIdToFetch = targetId || loggedInUser?.id

      if (!userIdToFetch) {
         setLoading(false)
         return // No ID to load (and not logged in)
      }

      // A. Fetch User Details (Email/Date)
      // We try to get it from 'posts' first since we know that table has emails
      const { data: userPosts } = await supabase
         .from('posts')
         .select('email, created_at')
         .eq('user_id', userIdToFetch)
         .order('created_at', { ascending: true })
         .limit(1)
      
      let email = 'Unknown User'
      let memberSince = new Date().toLocaleDateString()
      
      if (userPosts && userPosts.length > 0) {
          email = userPosts[0].email
          // Use first post date as proxy for "Member Since" if auth data isn't available
          memberSince = new Date(userPosts[0].created_at).toLocaleDateString() 
      } else if (loggedInUser && loggedInUser.id === userIdToFetch) {
          // If it's ME, I know my own details
          email = loggedInUser.email || ''
          memberSince = new Date(loggedInUser.created_at).toLocaleDateString()
      }

      setProfileUser({ id: userIdToFetch, email, memberSince })

      // B. Fetch This User's Post History
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

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading Profile...</div>

  // Check if we are viewing our own profile
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
         {/* Avatar Circle */}
         <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>
             {profileUser?.email?.[0]?.toUpperCase() || '?'}
         </div>
         
         {/* Info */}
         <div>
             <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#111827' }}>
                 {profileUser?.email}
             </h2>
             <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                 Member since: {profileUser?.memberSince}
             </p>
             
             {/* Only show "Edit" if it is MY profile */}
             {isMyProfile && (
                 <button style={{ marginTop: '10px', backgroundColor: '#374151', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    ⚙️ Edit Theme & Photo
                 </button>
             )}
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
                      
                      {post.content && <p style={{ margin: '0 0 10px 0', lineHeight: '1.5' }}>{post.content}</p>}
                      
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