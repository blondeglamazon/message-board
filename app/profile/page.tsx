'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'

function ProfileContent() {
  const [loading, setLoading] = useState(true)
  const [profileUser, setProfileUser] = useState<any>(null) // User Info + Theme
  const [currentUser, setCurrentUser] = useState<any>(null) // Me
  const [posts, setPosts] = useState<any[]>([])
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ 
      display_name: '', 
      avatar_url: '', 
      background_url: '', 
      music_embed: '', 
      bio: '' 
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const targetId = searchParams.get('id')

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      const { data: { user: loggedInUser } } = await supabase.auth.getUser()
      setCurrentUser(loggedInUser)

      const userIdToFetch = targetId || loggedInUser?.id
      if (!userIdToFetch) { setLoading(false); return }

      // 1. Fetch Profile Theme
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, background_url, music_embed, bio, email, id')
        .eq('id', userIdToFetch)
        .single()

      // 2. Fetch User Email/Date from Posts (Fallback)
      let email = profileData?.email || 'Unknown User'
      let memberSince = new Date().toLocaleDateString()

      const { data: userPosts } = await supabase.from('posts').select('email, created_at').eq('user_id', userIdToFetch).not('email', 'is', null).order('created_at', { ascending: false }).limit(1)
      const { data: firstPost } = await supabase.from('posts').select('created_at').eq('user_id', userIdToFetch).order('created_at', { ascending: true }).limit(1)

      if (userPosts && userPosts.length > 0) email = userPosts[0].email
      if (firstPost && firstPost.length > 0) memberSince = new Date(firstPost[0].created_at).toLocaleDateString()

      setProfileUser({ 
          id: userIdToFetch, 
          email, 
          memberSince,
          display_name: profileData?.display_name || '',
          avatar_url: profileData?.avatar_url || '',
          background_url: profileData?.background_url || '',
          music_embed: profileData?.music_embed || '',
          bio: profileData?.bio || ''
      })
      
      // Initialize Edit Form
      if (loggedInUser && loggedInUser.id === userIdToFetch) {
          setEditForm({
              display_name: profileData?.display_name || '',
              avatar_url: profileData?.avatar_url || '',
              background_url: profileData?.background_url || '',
              music_embed: profileData?.music_embed || '',
              bio: profileData?.bio || ''
          })
      }

      // 3. Fetch Posts
      const { data: history } = await supabase.from('posts').select('*').eq('user_id', userIdToFetch).order('created_at', { ascending: false })
      if (history) setPosts(history)
      
      setLoading(false)
    }
    loadProfile()
  }, [targetId])

  async function handleSaveProfile() {
      if (!currentUser) return
      
      // Upsert: Create or Update profile row
      const { error } = await supabase.from('profiles').upsert({
          id: currentUser.id,
          display_name: editForm.display_name,
          avatar_url: editForm.avatar_url,
          background_url: editForm.background_url,
          music_embed: editForm.music_embed,
          bio: editForm.bio
      })

      if (error) {
          alert("Error saving profile: " + error.message)
      } else {
          setProfileUser({ ...profileUser, ...editForm })
          setIsEditing(false)
      }
  }

  async function handleDelete(postId: string) {
      if (!confirm("Are you sure?")) return
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (!error) setPosts(prev => prev.filter(p => p.id !== postId))
  }

  // Safe HTML Render
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

  const renderPostContent = (post: any) => {
    if (post.post_type === 'embed') return <div style={{marginTop:'10px', overflow:'hidden', borderRadius:'8px'}}>{renderSafeHTML(post.content)}</div>
    return <p style={{lineHeight:'1.5'}}>{post.content}</p>
  }

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading Profile...</div>

  const isMyProfile = currentUser && profileUser && currentUser.id === profileUser.id

  // Background Logic
  const isEmbedBackground = profileUser?.background_url && profileUser.background_url.trim().startsWith('<');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', backgroundColor: '#111827' }}>
      
      {/* === BACKGROUND LAYER (Fixed) === */}
      <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, width: '100%', height: '100%', 
          zIndex: 0, 
          overflow: 'hidden',
          pointerEvents: 'none' 
      }}>
          {isEmbedBackground ? (
              <div style={{ width: '100%', height: '100%', opacity: 0.6 }}> 
                  {renderSafeHTML(profileUser.background_url)}
              </div>
          ) : (
              <div style={{ 
                  width: '100%', height: '100%', 
                  backgroundImage: profileUser?.background_url ? `url(${profileUser.background_url})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center'
              }} />
          )}
      </div>

      {/* === CONTENT LAYER (Scrollable) === */}
      <div style={{ 
          position: 'relative', 
          zIndex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          minHeight: '100vh', 
          padding: '20px' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, color: 'white', fontSize: '28px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {isMyProfile ? 'My Profile' : 'User Profile'}
                </h1>
                <Link href="/" style={{ padding: '8px 16px', backgroundColor: 'white', borderRadius: '6px', textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
                    ← Back to Feed
                </Link>
            </header>

            {/* EDIT MODAL */}
            {isEditing && (
                <div style={{ marginBottom: '20px', backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', border: '1px solid #374151' }}>
                    <h3 style={{ color: 'white', marginTop: 0 }}>Edit Profile Theme</h3>
                    
                    <label style={{display:'block', color:'#9ca3af', fontSize:'12px', marginBottom:'5px'}}>Display Name (e.g. "Cool Cat")</label>
                    <input type="text" value={editForm.display_name} onChange={e => setEditForm({...editForm, display_name: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none'}} placeholder="Your Name" />
                    
                    <label style={{display:'block', color:'#9ca3af', fontSize:'12px', marginBottom:'5px'}}>Avatar / Profile Picture URL</label>
                    <input type="text" value={editForm.avatar_url} onChange={e => setEditForm({...editForm, avatar_url: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none'}} placeholder="https://imgur.com/..." />

                    <label style={{display:'block', color:'#9ca3af', fontSize:'12px', marginBottom:'5px'}}>Background (Image URL OR Canva Embed Code)</label>
                    <input type="text" value={editForm.background_url} onChange={e => setEditForm({...editForm, background_url: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none'}} placeholder="https://... OR <div..." />
                    
                    <label style={{display:'block', color:'#9ca3af', fontSize:'12px', marginBottom:'5px'}}>Spotify/SoundCloud Embed Code</label>
                    <textarea value={editForm.music_embed} onChange={e => setEditForm({...editForm, music_embed: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', height:'60px'}} placeholder="<iframe src='...'></iframe>" />
                    
                    <label style={{display:'block', color:'#9ca3af', fontSize:'12px', marginBottom:'5px'}}>Bio / About Me</label>
                    <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', height:'60px'}} placeholder="Tell us about yourself..." />
                    
                    <div style={{display:'flex', gap:'10px'}}>
                        <button onClick={handleSaveProfile} style={{backgroundColor:'#6366f1', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer'}}>Save Changes</button>
                        <button onClick={() => setIsEditing(false)} style={{backgroundColor:'#4b5563', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer'}}>Cancel</button>
                    </div>
                </div>
            )}

            {/* PROFILE CARD */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', overflow: 'hidden' }}>
                        {profileUser?.avatar_url ? (
                            <img src={profileUser.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            (profileUser?.display_name || profileUser?.email)?.[0]?.toUpperCase() || '?'
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#111827' }}>{profileUser?.display_name || profileUser?.email}</h2>
                        
                        {/* ❌ REMOVED: Handle line gone */}
                        
                        {/* ✅ UPDATED: Always shows Member Since now */}
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Member since: {profileUser?.memberSince}</p>

                        {profileUser?.bio && <p style={{ marginTop: '10px', color: '#374151', fontStyle: 'italic' }}>"{profileUser.bio}"</p>}
                    </div>
                    {isMyProfile && !isEditing && (
                        <button onClick={() => setIsEditing(true)} style={{ backgroundColor: '#374151', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                            ✏️ Edit Profile
                        </button>
                    )}
                </div>

                {/* THEME SONG (Spotify) */}
                {profileUser?.music_embed && (
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px', fontWeight: 'bold' }}>🎵 VIBE CHECK</div>
                        {renderSafeHTML(profileUser.music_embed)}
                    </div>
                )}
            </div>

            {/* POSTS */}
            <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '15px', borderBottom:'1px solid #555', paddingBottom:'10px' }}>
                {isMyProfile ? 'My Posts' : 'User Posts'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {posts.map(post => (
                    <div key={post.id} style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', color: 'white', border: '1px solid #374151' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', color: '#9ca3af' }}>
                            <span>{new Date(post.created_at).toLocaleString()}</span>
                            {isMyProfile && <button onClick={() => handleDelete(post.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>}
                        </div>
                        {renderPostContent(post)}
                        {post.media_url && post.post_type === 'image' && <img src={post.media_url} style={{maxWidth:'100%', borderRadius:'8px', marginTop:'10px'}} />}
                        {post.media_url && post.post_type === 'video' && <video controls src={post.media_url} style={{maxWidth:'100%', borderRadius:'8px', marginTop:'10px'}} />}
                    </div>
                ))}
            </div>
        </div>
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