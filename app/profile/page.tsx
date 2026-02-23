'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'

function ProfileContent() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [profileUser, setProfileUser] = useState<any>(null) 
  const [currentUser, setCurrentUser] = useState<any>(null) 
  const [posts, setPosts] = useState<any[]>([])
  
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ 
      display_name: '', 
      avatar_url: '', 
      background_url: '', 
      music_embed: '', 
      bio: '',
      calendly_url: '',         
      google_calendar_url: '',  
      store_url: '',
      store_url_2: '',
      store_url_3: ''
  })

  const [postText, setPostText] = useState('')
  const [postFile, setPostFile] = useState<File | null>(null)
  const [isSelling, setIsSelling] = useState(false)
  const [productLink, setProductLink] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  
  // SUPPORT BOTH ?id=uuid AND ?u=username
  const targetId = searchParams.get('id')
  const targetSlug = searchParams.get('u')

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      
      // 1. Check for logged in user (doesn't block guests)
      const { data: { user: loggedInUser } } = await supabase.auth.getUser()
      setCurrentUser(loggedInUser)

      // 2. Fetch Profile Data based on URL priority
      let profileData = null
      
      if (targetId) {
        // Option A: Specific UUID provided
        const { data } = await supabase.from('profiles').select('*').eq('id', targetId).single()
        profileData = data
      } else if (targetSlug) {
        // Option B: Username Slug provided (Matches your Feed Links)
        const { data } = await supabase.from('profiles').select('*').eq('homepage_slug', targetSlug).single()
        profileData = data
      } else if (loggedInUser) {
        // Option C: No params, show logged-in user's own profile
        const { data } = await supabase.from('profiles').select('*').eq('id', loggedInUser.id).single()
        profileData = data
      }

      if (!profileData) {
        setLoading(false)
        return
      }

      // 3. Setup User Identity
      const userIdToFetch = profileData.id
      let email = profileData?.email || 'Unknown User'
      let memberSince = new Date().toLocaleDateString()

      // Fetch metadata from posts to get consistent Email/MemberSince
      const { data: userPosts } = await supabase
        .from('posts')
        .select('email, created_at')
        .eq('user_id', userIdToFetch)
        .order('created_at', { ascending: false })
        .limit(1)

      const { data: firstPost } = await supabase
        .from('posts')
        .select('created_at')
        .eq('user_id', userIdToFetch)
        .order('created_at', { ascending: true })
        .limit(1)

      if (userPosts && userPosts.length > 0) email = userPosts[0].email
      if (firstPost && firstPost.length > 0) memberSince = new Date(firstPost[0].created_at).toLocaleDateString()

      setProfileUser({ 
          ...profileData,
          email, 
          memberSince,
      })
      
      // Sync edit form if viewer is owner
      if (loggedInUser && loggedInUser.id === userIdToFetch) {
          setEditForm({
              display_name: profileData?.display_name || '',
              avatar_url: profileData?.avatar_url || '',
              background_url: profileData?.background_url || '',
              music_embed: profileData?.music_embed || '',
              bio: profileData?.bio || '',
              calendly_url: profileData?.calendly_url || '',
              google_calendar_url: profileData?.google_calendar_url || '',
              store_url: profileData?.store_url || '',
              store_url_2: profileData?.store_url_2 || '',
              store_url_3: profileData?.store_url_3 || ''
          })
      }

      // 4. Fetch User Posts
      const { data: history } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userIdToFetch)
        .order('created_at', { ascending: false })
        
      if (history) setPosts(history)
      
      setLoading(false)
    }
    loadProfile()
  }, [targetId, targetSlug, supabase])

  async function handleSaveProfile() {
      if (!currentUser) return
      const { error } = await supabase.from('profiles').upsert({
          id: currentUser.id,
          ...editForm
      })
      if (error) {
          alert("Error saving profile: " + error.message)
      } else {
          setProfileUser({ ...profileUser, ...editForm })
          setIsEditing(false)
      }
  }

  async function handleCreatePost() {
    if (!currentUser || (!postText && !postFile)) return
    setIsPosting(true)
    let mediaUrl = null

    if (postFile) {
        const fileExt = postFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${currentUser.id}/${fileName}`
        const { error: uploadError } = await supabase.storage.from('post_images').upload(filePath, postFile)
        if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from('post_images').getPublicUrl(filePath)
            mediaUrl = publicUrlData.publicUrl
        }
    }

    const { data, error } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        content: postText,
        media_url: mediaUrl,
        post_type: mediaUrl ? 'image' : 'text',
        is_sell_post: isSelling,
        product_link: isSelling ? productLink : null
    }).select().single()
    
    if (!error && data) {
        setPosts([data, ...posts]); setPostText(''); setPostFile(null); setIsSelling(false); setProductLink('');
    }
    setIsPosting(false)
  }

  async function handleDelete(postId: string) {
      if (!confirm("Are you sure?")) return
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (!error) setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const connectGoogleCalendar = async () => {
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { scopes: 'https://www.googleapis.com/auth/calendar.events', redirectTo: `${window.location.origin}/profile` }
    })
    if (error) alert(error.message)
  }

  const renderSafeHTML = (html: string) => {
      if (!html) return null;
      const clean = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'br', 'strong', 'em', 'b', 'i', 'ul', 'li'],
          ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'title', 'class', 'id', 'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'loading', 'referrerpolicy'],
          ADD_TAGS: ['iframe', 'link']
      })
      return <div dangerouslySetInnerHTML={{ __html: clean }} />
  }

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading Profile...</div>
  if (!profileUser) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Profile not found.</div>

  const isMyProfile = currentUser && profileUser && currentUser.id === profileUser.id
  const isEmbedBackground = profileUser?.background_url?.trim().startsWith('<');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', backgroundColor: '#111827' }}>
      {/* Background Layer */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {isEmbedBackground ? (
              <div style={{ width: '100%', height: '100%', opacity: 0.6 }}>{renderSafeHTML(profileUser.background_url)}</div>
          ) : (
              <div style={{ width: '100%', height: '100%', backgroundImage: profileUser?.background_url ? `url(${profileUser.background_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          )}
      </div>

      <div style={{ position: 'relative', zIndex: 1, backgroundColor: 'rgba(0,0,0,0.5)', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, color: 'white', fontSize: '28px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {isMyProfile ? 'My Profile' : `${profileUser.display_name || 'User'}'s Profile`}
                </h1>
                <Link href="/" style={{ padding: '8px 16px', backgroundColor: 'white', borderRadius: '6px', textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
                    ← Back to Feed
                </Link>
            </header>

            {/* Editing UI */}
            {isEditing && (
                <div style={{ marginBottom: '20px', backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', border: '1px solid #374151' }}>
                    <h3 style={{ color: 'white', marginTop: 0 }}>Edit Profile Theme</h3>
                    <input type="text" value={editForm.display_name} onChange={e => setEditForm({...editForm, display_name: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', color: 'white', backgroundColor: '#374151'}} placeholder="Display Name" />
                    <input type="text" value={editForm.avatar_url} onChange={e => setEditForm({...editForm, avatar_url: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', color: 'white', backgroundColor: '#374151'}} placeholder="Avatar URL" />
                    <input type="text" value={editForm.background_url} onChange={e => setEditForm({...editForm, background_url: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', color: 'white', backgroundColor: '#374151'}} placeholder="Background URL or Embed" />
                    <input type="url" value={editForm.calendly_url} onChange={e => setEditForm({...editForm, calendly_url: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', color: 'white', backgroundColor: '#374151'}} placeholder="Booking URL" />
                    <input type="url" value={editForm.store_url} onChange={e => setEditForm({...editForm, store_url: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', color: 'white', backgroundColor: '#374151'}} placeholder="Primary Store URL" />
                    <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', height:'60px', color: 'white', backgroundColor: '#374151'}} placeholder="Bio" />
                    <div style={{display:'flex', gap:'10px'}}>
                        <button onClick={handleSaveProfile} style={{backgroundColor:'#6366f1', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer'}}>Save</button>
                        <button onClick={() => setIsEditing(false)} style={{backgroundColor:'#4b5563', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer'}}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Profile Info Card */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#6366f1', overflow: 'hidden', flexShrink: 0 }}>
                        {profileUser.avatar_url ? <img src={profileUser.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : null}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, color: '#111827' }}>{profileUser.display_name || profileUser.email}</h2>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Member since {profileUser.memberSince}</p>
                        {profileUser.bio && <p style={{ marginTop: '10px', color: '#374151' }}>{profileUser.bio}</p>}
                    </div>
                    {isMyProfile && !isEditing && <button onClick={() => setIsEditing(true)}>✏️ Edit</button>}
                </div>
                
                {/* Store/Booking Links */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    {profileUser.store_url && <a href={profileUser.store_url} target="_blank" style={{padding:'8px 16px', backgroundColor:'#10b981', color:'white', borderRadius:'8px', textDecoration:'none'}}>🛍️ Shop</a>}
                    {profileUser.calendly_url && <a href={profileUser.calendly_url} target="_blank" style={{padding:'8px 16px', backgroundColor:'#3b82f6', color:'white', borderRadius:'8px', textDecoration:'none'}}>📅 Book</a>}
                </div>
            </div>

            {/* Create Post Section */}
            {isMyProfile && (
                <div style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                    <textarea value={postText} onChange={e => setPostText(e.target.value)} placeholder="Post something new..." style={{width:'100%', backgroundColor:'#374151', color:'white', border:'none', padding:'10px', borderRadius:'8px'}} />
                    <button onClick={handleCreatePost} style={{marginTop:'10px', backgroundColor:'#6366f1', color:'white', padding:'8px 16px', borderRadius:'8px', border:'none'}}>{isPosting ? '...' : 'Post'}</button>
                </div>
            )}

            {/* Posts Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {posts.map(post => (
                    <div key={post.id} style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', color: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>
                            <span>{new Date(post.created_at).toLocaleString()}</span>
                            {isMyProfile && <button onClick={() => handleDelete(post.id)} style={{color:'#ef4444', background:'none', border:'none'}}>Delete</button>}
                        </div>
                        <p>{post.content}</p>
                        {post.media_url && <img src={post.media_url} style={{maxWidth:'100%', borderRadius:'8px', marginTop:'10px'}} />}
                        {post.is_sell_post && post.product_link && (
                            <a href={post.product_link} target="_blank" style={{display:'block', backgroundColor:'#10b981', padding:'10px', borderRadius:'8px', color:'white', textAlign:'center', marginTop:'10px', textDecoration:'none'}}>Buy Now</a>
                        )}
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
    <Suspense fallback={<div style={{color:'white', textAlign:'center', padding:'50px'}}>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  )
}