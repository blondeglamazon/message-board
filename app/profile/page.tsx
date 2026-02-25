'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import DOMPurify from 'isomorphic-dompurify'
import Sidebar from '@/components/Sidebar'

// @ts-ignore
import Microlink from '@microlink/react'

function ProfileContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [profileUser, setProfileUser] = useState<any>(null) 
  const [currentUser, setCurrentUser] = useState<any>(null) 
  const [posts, setPosts] = useState<any[]>([])
  
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({})
  
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  
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

  // State for creating a Sell Post
  const [postText, setPostText] = useState('')
  const [postFile, setPostFile] = useState<File | null>(null)
  const [isSelling, setIsSelling] = useState(false)
  const [productLink, setProductLink] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  
  // Interactions State
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({})
  const [openComments, setOpenComments] = useState<Set<string>>(new Set())

  // APP STORE COMPLIANCE STATE
  const [isBlocked, setIsBlocked] = useState(false)

  const targetId = searchParams.get('id')
  const targetSlug = searchParams.get('u')

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      
      const { data: { user: loggedInUser } } = await supabase.auth.getUser()
      setCurrentUser(loggedInUser)

      const { data: allProfiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url')
      const pMap: Record<string, any> = {}
      allProfiles?.forEach((p: any) => { pMap[p.id] = p })
      setProfilesMap(pMap)

      let profileData = null

      if (targetId) {
        const { data } = await supabase.from('profiles').select('*').eq('id', targetId).single()
        profileData = data
      } else if (targetSlug) {
        const { data } = await supabase.from('profiles').select('*').eq('username', targetSlug).single()
        profileData = data
      } else if (loggedInUser) {
        const { data } = await supabase.from('profiles').select('*').eq('id', loggedInUser.id).single()
        profileData = data
      }

      if (!profileData) {
        setLoading(false)
        return 
      }

      const userIdToFetch = profileData.id
      let email = profileData?.email || 'Unknown User'
      let memberSince = new Date().toLocaleDateString()

      if (loggedInUser && loggedInUser.id !== userIdToFetch) {
        const { data: blockData } = await supabase.from('blocks')
          .select('id')
          .eq('blocker_id', loggedInUser.id)
          .eq('blocked_id', userIdToFetch)
          .single()
        if (blockData) setIsBlocked(true)
      }

      const { data: userPosts } = await supabase
        .from('posts')
        .select('email, created_at')
        .ilike('user_id', userIdToFetch)
        .not('email', 'is', null)
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

      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userIdToFetch)

      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userIdToFetch)

      setFollowerCount(followers || 0)
      setFollowingCount(following || 0)

      setProfileUser({ 
          id: userIdToFetch, 
          email, 
          memberSince,
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

      const { data: history } = await supabase
        .from('posts')
        .select(`*, likes ( user_id ), comments ( id, content, email, user_id, created_at )`)
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
          display_name: editForm.display_name,
          avatar_url: editForm.avatar_url,
          background_url: editForm.background_url,
          music_embed: editForm.music_embed,
          bio: editForm.bio,
          calendly_url: editForm.calendly_url,
          google_calendar_url: editForm.google_calendar_url,
          store_url: editForm.store_url,
          store_url_2: editForm.store_url_2,
          store_url_3: editForm.store_url_3
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
        
        const { error: uploadError } = await supabase.storage
            .from('post_images') 
            .upload(filePath, postFile)
            
        if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from('post_images').getPublicUrl(filePath)
            mediaUrl = publicUrlData.publicUrl
        } else {
            alert("Error uploading image: " + uploadError.message)
        }
    }

    const newPost = {
        user_id: currentUser.id,
        content: postText,
        media_url: mediaUrl,
        post_type: mediaUrl ? 'image' : 'text',
        is_sell_post: isSelling,
        product_link: isSelling ? productLink : null
    }

    const { data, error } = await supabase.from('posts').insert(newPost).select().single()
    
    if (error) {
        alert("Error creating post: " + error.message)
    } else if (data) {
        setPosts([{ ...data, likes: [], comments: [] }, ...posts])
        setPostText('')
        setPostFile(null)
        setIsSelling(false)
        setProductLink('')
    }
    setIsPosting(false)
  }

  async function handleDelete(postId: string) {
      if (!confirm("Are you sure?")) return
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (!error) setPosts(prev => prev.filter(p => p.id !== postId))
  }

  async function handleLike(postId: string, isLiked: boolean) {
    if (!currentUser) return alert("Please login to like posts.")
    
    setPosts(prev => prev.map(msg => msg.id === postId ? { ...msg, likes: isLiked ? msg.likes.filter((l: any) => l.user_id !== currentUser.id) : [...(msg.likes || []), { user_id: currentUser.id }] } : msg))
    
    if (isLiked) {
      await supabase.from('likes').delete().match({ user_id: currentUser.id, post_id: postId })
    } else {
      await supabase.from('likes').insert({ user_id: currentUser.id, post_id: postId })
      
      if (profileUser && profileUser.id !== currentUser.id) { 
        await supabase.from('notifications').insert({
          user_id: profileUser.id,
          actor_id: currentUser.id,
          type: 'like',
          post_id: postId
        });
      }
    }
  }

  const toggleComments = (postId: string) => {
    const newSet = new Set(openComments)
    if (newSet.has(postId)) newSet.delete(postId)
    else newSet.add(postId)
    setOpenComments(newSet)
  }

  async function handlePostComment(postId: string) {
    if (!currentUser) return alert("Please login to comment.")
    const text = commentText[postId]?.trim()
    if (!text) return
    
    const { data: newComment, error } = await supabase.from('comments').insert({ post_id: postId, user_id: currentUser.id, email: currentUser.email, content: text }).select().single()
    if (error) return alert("Error: " + error.message)
    
    setPosts(prev => prev.map(msg => msg.id === postId ? { ...msg, comments: [...(msg.comments || []), newComment] } : msg))
    setCommentText(prev => ({ ...prev, [postId]: '' }))

    if (profileUser && profileUser.id !== currentUser.id) { 
      await supabase.from('notifications').insert({
        user_id: profileUser.id,
        actor_id: currentUser.id,
        type: 'comment',
        post_id: postId
      });
    }
  }

  const handleShare = async (postId: string) => {
      const url = `${window.location.origin}/?post=${postId}`;
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'Check out this post on VIMciety',
                  url: url
              });
          } catch (err) {
              console.log('User cancelled share');
          }
      } else {
          navigator.clipboard.writeText(url);
          alert("Link copied to clipboard!");
      }
  };

  async function handleBlockUser() {
      if (!currentUser || !profileUser) return
      if (confirm(`Block ${profileUser.display_name}? You will no longer see their posts.`)) {
          const { error } = await supabase.from('blocks').insert({ blocker_id: currentUser.id, blocked_id: profileUser.id })
          if (!error) {
              setIsBlocked(true)
              alert("User blocked.")
              router.push('/')
          } else {
              alert("Error blocking user.")
          }
      }
  }

  async function handleReportPost(postId: string) {
      if (confirm("Report this post for violating community guidelines?")) {
          alert("Thank you for your report. Our moderation team will review this content within 24 hours.")
      }
  }

  const connectGoogleCalendar = async () => {
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.events',
        // Hardcode your actual domain here!
        redirectTo: `https://www.vimciety.com/profile` 
      }
    })
    if (error) alert("Error connecting Google: " + error.message)
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

  const renderPostContent = (post: any) => {
    if (post.post_type === 'embed') return <div style={{marginTop:'10px', overflow:'hidden', borderRadius:'8px'}}>{renderSafeHTML(post.content)}</div>
    return <p style={{lineHeight:'1.5'}}>{post.content}</p>
  }

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading Profile...</div>
  
  if (!profileUser) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Profile not found.</div>

  const isMyProfile = currentUser && profileUser && currentUser.id === profileUser.id
  const isEmbedBackground = profileUser?.background_url && profileUser.background_url.trim().startsWith('<');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', backgroundColor: '#111827' }}>
      
      <Sidebar />

      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {isEmbedBackground ? (
              <div style={{ width: '100%', height: '100%', opacity: 0.6 }}> 
                  {renderSafeHTML(profileUser.background_url)}
              </div>
          ) : (
              <div style={{ width: '100%', height: '100%', backgroundImage: profileUser?.background_url ? `url(${profileUser.background_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          )}
      </div>

      <div style={{ position: 'relative', zIndex: 1, backgroundColor: 'rgba(0,0,0,0.5)', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, color: 'white', fontSize: '28px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {isMyProfile ? 'My Profile' : `${profileUser.display_name || 'User'}'s Profile`}
                </h1>
                <div onClick={() => router.push('/')} style={{ cursor: 'pointer', padding: '8px 16px', backgroundColor: 'white', borderRadius: '6px', color: '#333', fontWeight: 'bold', display: 'flex', alignItems: 'center', minHeight: '44px' }}>
                    ← Back to Feed
                </div>
            </header>

            {isBlocked ? (
                <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '20px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                    You have blocked this user.
                </div>
            ) : (
              <>
                {isEditing && (
                    <div style={{ marginBottom: '20px', backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', border: '1px solid #374151' }}>
                        <h3 style={{ color: 'white', marginTop: 0 }}>Edit Profile Theme</h3>
                        <input type="text" value={editForm.display_name} onChange={e => setEditForm({...editForm, display_name: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', color: 'white', backgroundColor: '#374151'}} placeholder="Display Name" />
                        <input type="text" value={editForm.avatar_url} onChange={e => setEditForm({...editForm, avatar_url: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', color: 'white', backgroundColor: '#374151'}} placeholder="Avatar URL" />
                        <input type="text" value={editForm.background_url} onChange={e => setEditForm({...editForm, background_url: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', color: 'white', backgroundColor: '#374151'}} placeholder="Background URL or Embed" />
                        
                        <input type="url" value={editForm.calendly_url} onChange={e => setEditForm({...editForm, calendly_url: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', color: 'white', backgroundColor: '#374151'}} placeholder="Calendly or Booking URL" />
                        
                        <input type="url" value={editForm.store_url} onChange={e => setEditForm({...editForm, store_url: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', color: 'white', backgroundColor: '#374151'}} placeholder="Primary Store URL (Square, Etsy, Amazon, etc.)" />
                        <input type="url" value={editForm.store_url_2} onChange={e => setEditForm({...editForm, store_url_2: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', color: 'white', backgroundColor: '#374151'}} placeholder="Store / Link 2" />
                        <input type="url" value={editForm.store_url_3} onChange={e => setEditForm({...editForm, store_url_3: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', color: 'white', backgroundColor: '#374151'}} placeholder="Store / Link 3" />
                        
                        <div style={{ marginTop: '15px', marginBottom: '15px', padding: '15px', backgroundColor: '#374151', borderRadius: '8px', border: '1px solid #4b5563' }}>
                            <h4 style={{ color: 'white', marginTop: 0, marginBottom: '5px' }}>Automated Scheduling</h4>
                            <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: 0, marginBottom: '10px' }}>Connect your Google Calendar so users can book available slots directly on VIMciety.</p>
                            <button 
                              onClick={(e) => { e.preventDefault(); connectGoogleCalendar(); }} 
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', color: '#111827', fontWeight: 'bold', border: 'none', padding: '8px 16px', minHeight: '44px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '16px', height: '16px' }} />
                              Connect Google Calendar
                            </button>
                        </div>

                        <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', height:'60px', color: 'white', backgroundColor: '#374151'}} placeholder="Bio" />
                        <textarea value={editForm.music_embed} onChange={e => setEditForm({...editForm, music_embed: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'10px', borderRadius:'4px', border:'none', height:'60px', color: 'white', backgroundColor: '#374151'}} placeholder="Music Embed Code" />
                        <div style={{display:'flex', gap:'10px'}}>
                            <button onClick={handleSaveProfile} style={{backgroundColor:'#6366f1', color:'white', border:'none', padding:'8px 16px', minHeight: '44px', borderRadius:'4px', cursor:'pointer'}}>Save</button>
                            <button onClick={() => setIsEditing(false)} style={{backgroundColor:'#4b5563', color:'white', border:'none', padding:'8px 16px', minHeight: '44px', borderRadius:'4px', cursor:'pointer'}}>Cancel</button>
                        </div>
                    </div>
                )}

                <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                            {profileUser?.avatar_url ? (
                                <img src={profileUser.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                (profileUser?.display_name || profileUser?.email)?.[0]?.toUpperCase() || '?'
                            )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#111827' }}>{profileUser?.display_name || profileUser?.email}</h2>
                                
                                {!isMyProfile && currentUser && (
                                    <button 
                                      onClick={handleBlockUser} 
                                      style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', minHeight: '44px' }}
                                    >
                                        🚫 Block User
                                    </button>
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '8px' }}>
                                <div 
                                  onClick={() => isMyProfile && router.push('/friends')} 
                                  style={{ cursor: isMyProfile ? 'pointer' : 'default', color: '#4b5563', fontSize: '15px', minHeight: '44px', display: 'flex', alignItems: 'center' }}
                                >
                                    <strong style={{ color: '#111827', marginRight: '4px' }}>{followerCount}</strong> Followers
                                </div>
                                <div 
                                  onClick={() => isMyProfile && router.push('/following')} 
                                  style={{ cursor: isMyProfile ? 'pointer' : 'default', color: '#4b5563', fontSize: '15px', minHeight: '44px', display: 'flex', alignItems: 'center' }}
                                >
                                    <strong style={{ color: '#111827', marginRight: '4px' }}>{followingCount}</strong> Following
                                </div>
                            </div>

                            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Member since: {profileUser?.memberSince}</p>
                            {profileUser?.bio && <p style={{ marginTop: '10px', color: '#374151', fontStyle: 'italic' }}>"{profileUser.bio}"</p>}
                            
                            {/* --- MICROLINK RICH PREVIEWS FOR STORES (MOBILE OPTIMIZED) --- */}
                            {(profileUser?.calendly_url || profileUser?.google_calendar_url || profileUser?.store_url || profileUser?.store_url_2 || profileUser?.store_url_3) && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', width: '100%', overflow: 'hidden' }}>
                                
                                {(profileUser?.calendly_url || profileUser?.google_calendar_url) && (
                                  <a 
                                    href={profileUser.calendly_url || profileUser.google_calendar_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold', fontSize: '14px', borderRadius: '10px', textDecoration: 'none', border: '1px solid #bfdbfe', width: '100%', minHeight: '44px', boxSizing: 'border-box' }}
                                  >
                                    📅 Book Appointment
                                  </a>
                                )}
                                
                                {profileUser?.store_url && (
                                    <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                                        <Microlink url={profileUser.store_url} size="normal" style={{ width: '100%', minWidth: 0, borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: 'white' }} />
                                    </div>
                                )}

                                {profileUser?.store_url_2 && (
                                    <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                                        <Microlink url={profileUser.store_url_2} size="normal" style={{ width: '100%', minWidth: 0, borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: 'white' }} />
                                    </div>
                                )}

                                {profileUser?.store_url_3 && (
                                    <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                                        <Microlink url={profileUser.store_url_3} size="normal" style={{ width: '100%', minWidth: 0, borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: 'white' }} />
                                    </div>
                                )}
                              </div>
                            )}
                            
                        </div>
                    </div>

                    {isMyProfile && !isEditing && (
                        <button onClick={() => setIsEditing(true)} style={{ backgroundColor: '#374151', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', minHeight: '44px' }}>✏️ Edit</button>
                    )}

                    {profileUser?.music_embed && (
                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px', width: '100%', overflow: 'hidden', marginTop: '15px' }}>
                            {renderSafeHTML(profileUser.music_embed)}
                        </div>
                    )}
                </div>

                {isMyProfile && !isEditing && (
                    <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', marginBottom: '30px', border: '1px solid #374151' }}>
                        <textarea 
                            placeholder="What's on your mind? Or what are you selling?"
                            value={postText}
                            onChange={(e) => setPostText(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#374151', color: 'white', minHeight: '80px', marginBottom: '10px' }}
                        />
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input 
                                type="file" 
                                accept="image/png, image/jpeg, image/jpg" 
                                onChange={(e) => setPostFile(e.target.files?.[0] || null)}
                                style={{ color: '#9ca3af', minHeight: '44px' }}
                            />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', minHeight: '44px' }}>
                                <input 
                                    type="checkbox" 
                                    id="sell-toggle"
                                    checked={isSelling} 
                                    onChange={(e) => setIsSelling(e.target.checked)} 
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="sell-toggle" style={{ color: '#22c55e', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Turn this into a "Sell" Post 🛒
                                </label>
                            </div>

                            {isSelling && (
                                <input 
                                    type="url"
                                    placeholder="Checkout Link (Square, eBay, Stripe, etc.)"
                                    value={productLink}
                                    onChange={(e) => setProductLink(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #22c55e', backgroundColor: '#111827', color: 'white', marginTop: '5px', minHeight: '44px' }}
                                />
                            )}

                            <button 
                                onClick={handleCreatePost} 
                                disabled={isPosting || (!postText && !postFile)}
                                style={{ backgroundColor: '#6366f1', color: 'white', fontWeight: 'bold', border: 'none', padding: '10px', borderRadius: '8px', cursor: isPosting ? 'not-allowed' : 'pointer', marginTop: '10px', opacity: (isPosting || (!postText && !postFile)) ? 0.6 : 1, minHeight: '44px' }}
                            >
                                {isPosting ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {posts.map(post => {
                        const isLiked = currentUser && post.likes?.some((l: any) => l.user_id === currentUser.id);

                        return (
                        <div key={post.id} style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', color: 'white', border: '1px solid #374151' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', color: '#9ca3af' }}>
                                <span>{new Date(post.created_at).toLocaleString()}</span>
                                
                                {isMyProfile ? (
                                    <button onClick={() => handleDelete(post.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', minHeight: '44px' }}>Delete</button>
                                ) : (
                                    <button onClick={() => handleReportPost(post.id)} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', minHeight: '44px' }}>Report Post</button>
                                )}
                            </div>
                            
                            {renderPostContent(post)}
                            
                            {post.media_url && post.post_type === 'image' && (
                                <img src={post.media_url} style={{maxWidth:'100%', borderRadius:'8px', marginTop:'10px'}} alt="Post media" />
                            )}

                            {post.is_sell_post && post.product_link && (
                                <a 
                                    href={post.product_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '15px', backgroundColor: '#22c55e', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '8px', textDecoration: 'none', transition: 'opacity 0.2s', minHeight: '44px' }}
                                >
                                    💳 Buy Now / View Item
                                </a>
                            )}

                            <div style={{ marginTop: '15px', display: 'flex', gap: '15px', borderTop: '1px solid #374151', paddingTop: '15px' }}>
                                <button 
                                    onClick={() => handleLike(post.id, !!isLiked)} 
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? '#ef4444' : '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px', padding: 0 }}>
                                    <span style={{ fontSize: '20px' }}>{isLiked ? '❤️' : '🤍'}</span> 
                                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{post.likes?.length || 0}</span>
                                </button>

                                <button 
                                    onClick={() => toggleComments(post.id)} 
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px', padding: 0 }}>
                                    <span style={{ fontSize: '20px' }}>💬</span> 
                                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{post.comments?.length || 0}</span>
                                </button>

                                <button 
                                    onClick={() => handleShare(post.id)} 
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px', padding: 0 }}>
                                    <span style={{ fontSize: '20px' }}>↗️</span> 
                                    <span style={{ fontWeight: '600', fontSize: '14px' }}>Share</span>
                                </button>
                            </div>

                            {openComments.has(post.id) && (
                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #374151' }}>
                                    {post.comments?.map((c: any) => {
                                        const commenter = profilesMap[c.user_id]
                                        return (
                                            <div key={c.id} style={{ marginBottom: '12px', fontSize: '14px' }}>
                                                <span style={{ fontWeight: 'bold', color: '#d1d5db', marginRight: '8px' }}>
                                                    {commenter?.display_name || commenter?.username || 'User'}
                                                </span>
                                                <span style={{ color: '#9ca3af' }}>{c.content}</span>
                                            </div>
                                        )
                                    })}
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Add a comment..." 
                                            value={commentText[post.id] || ''} 
                                            onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })} 
                                            style={{ flex: 1, minWidth: 0, height: '44px', padding: '0 15px', borderRadius: '22px', border: '1px solid #4b5563', backgroundColor: '#374151', color: 'white', fontSize: '14px', boxSizing: 'border-box' }} 
                                        />
                                        <button 
                                            onClick={() => handlePostComment(post.id)} 
                                            style={{ height: '44px', padding: '0 20px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '22px', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            Post
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    )})}
                </div>
              </>
            )}
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