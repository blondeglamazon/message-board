'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { supabase } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'

function MessageBoardContent() {
  const [messages, setMessages] = useState<any[]>([])
  // Stores full profile object now (username, display_name, avatar)
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({}) 
  const [newMessage, setNewMessage] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({})
  const [openComments, setOpenComments] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [postType, setPostType] = useState<string>('text') 
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const showCreateModal = searchParams.get('create') === 'true'
  const showSearchModal = searchParams.get('search') === 'true'
  const currentFeed = searchParams.get('feed') || 'global' 
  const urlSearchQuery = searchParams.get('q') || ''

  useEffect(() => {
    if (urlSearchQuery) setSearchQuery(urlSearchQuery)
  }, [urlSearchQuery])

  useEffect(() => {
    async function initData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
      setAdminIds(new Set(admins?.map(a => a.id) || []))

      // 1. Fetch Usernames, Display Names, and Avatars
      const { data: allProfiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url')
      const pMap: Record<string, any> = {}
      allProfiles?.forEach(p => { pMap[p.id] = p }) // Store the whole object
      setProfilesMap(pMap)

      if (user) {
        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
        setFollowingIds(new Set(follows?.map(f => f.following_id) || []))
        checkNotifications(user.id)
      }

      // 2. Fetch Posts
      let query = supabase
        .from('posts')
        .select(`
            *,
            likes ( user_id ),
            comments ( id, content, email, user_id, created_at )
        `)
        .order('created_at', { ascending: false })

      if (user && currentFeed === 'following') {
         const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
         const ids = follows?.map(f => f.following_id) || []
         if (ids.length > 0) query = query.in('user_id', ids)
         else query = query.in('user_id', ['00000000-0000-0000-0000-000000000000']) 
      } 
      else if (user && currentFeed === 'friends') {
          const { data: myFollows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
          const { data: followsMe } = await supabase.from('follows').select('follower_id').eq('following_id', user.id)
          const myIds = myFollows?.map(f => f.following_id) || []
          const theirIds = followsMe?.map(f => f.follower_id) || []
          const friendIds = myIds.filter(id => theirIds.includes(id))
          
          if (friendIds.length > 0) query = query.in('user_id', friendIds)
          else query = query.in('user_id', ['00000000-0000-0000-0000-000000000000'])
       }

      const { data: posts, error } = await query
      if (error) console.error("Error fetching posts:", error)
      if (posts) setMessages(posts)
    }
    initData()
    
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        setMessages((prev) => [{ ...payload.new, likes: [], comments: [] }, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentFeed]) 

  async function checkNotifications(userId: string) {
      const lastCheck = localStorage.getItem('lastNotificationCheck') || new Date(0).toISOString()
      const { data: newLikes } = await supabase.from('likes').select('created_at, posts!inner(user_id)').eq('posts.user_id', userId).gt('created_at', lastCheck)
      if (newLikes && newLikes.length > 0) setHasNewNotifications(true)
  }

  async function handleLike(postId: string, isLiked: boolean) {
    if (!user) return alert("Please login to like posts.")
    setMessages(prev => prev.map(msg => msg.id === postId ? { ...msg, likes: isLiked ? msg.likes.filter((l: any) => l.user_id !== user.id) : [...msg.likes, { user_id: user.id }] } : msg))
    if (isLiked) await supabase.from('likes').delete().match({ user_id: user.id, post_id: postId })
    else await supabase.from('likes').insert({ user_id: user.id, post_id: postId })
  }
  
  async function toggleFollow(targetId: string) {
    if (!user) return alert("Please login to follow.")
    if (adminIds.has(targetId)) return alert("You cannot unfollow an Administrator.")
    
    if (followingIds.has(targetId)) {
        const { error } = await supabase.from('follows').delete().match({ follower_id: user.id, following_id: targetId })
        if (!error) {
            const newSet = new Set(followingIds); newSet.delete(targetId); setFollowingIds(newSet)
        }
    } else {
        const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId })
        if (!error) {
            const newSet = new Set(followingIds); newSet.add(targetId); setFollowingIds(newSet)
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
    if (!user) return alert("Please login to comment.")
    const text = commentText[postId]?.trim()
    if (!text) return

    const { data: newComment, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: user.id, email: user.email, content: text })
        .select()
        .single()

    if (error) {
        alert("Error posting comment: " + error.message)
        return
    }

    setMessages(prev => prev.map(msg => {
        if (msg.id === postId) {
            return { ...msg, comments: [...(msg.comments || []), newComment] }
        }
        return msg
    }))
    setCommentText(prev => ({ ...prev, [postId]: '' }))
  }

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) router.push(`/?q=${encodeURIComponent(searchQuery)}`)
    else router.push('/')
  }
  
  const handleNotificationClick = () => {
      setHasNewNotifications(false)
      localStorage.setItem('lastNotificationCheck', new Date().toISOString())
      router.push('/notifications') 
  }

  const filteredMessages = messages.filter(msg => {
    const query = urlSearchQuery || searchQuery
    if (!query) return true;
    const lowerQ = query.toLowerCase();
    
    // Search by username AND display name
    const profile = profilesMap[msg.user_id];
    const username = profile?.username || '';
    const displayName = profile?.display_name || '';

    return (
        (msg.content && msg.content.toLowerCase().includes(lowerQ)) || 
        (msg.email && msg.email.toLowerCase().includes(lowerQ)) ||
        (username && username.toLowerCase().includes(lowerQ)) ||
        (displayName && displayName.toLowerCase().includes(lowerQ))
    );
  });

  const renderContent = (msg: any) => {
    if (msg.post_type === 'embed') {
        const clean = DOMPurify.sanitize(msg.content, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] });
        return <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: clean }} />
    }
    return <p style={{ color: '#111827', lineHeight: '1.6' }}>{msg.content}</p>
  };

  const handlePost = async () => {
    if (!user) return alert("You must be logged in to post!")
    if (!newMessage.trim() && !mediaFile) return
    setUploading(true)
    try {
        let publicUrl = null
        if (mediaFile) {
            const fileExt = mediaFile.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, mediaFile)
            if (uploadError) throw uploadError
            const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
            publicUrl = data.publicUrl
        }
        await supabase.from('posts').insert([{ content: newMessage, user_id: user.id, email: user.email, post_type: postType, media_url: publicUrl }])
        setNewMessage(''); setMediaFile(null); setPostType('text'); router.push('/')
        window.location.reload()
    } catch (e: any) { alert(e.message) }
    setUploading(false)
  }

  // Helper for Upload Input
  const handleOptionClick = (type: string) => {
    setPostType(type); setMediaFile(null)
    if (type === 'image' || type === 'video' || type === 'audio') setTimeout(() => fileInputRef.current?.click(), 100)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff', color: '#111827', fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR */}
      <nav style={{ width: '250px', borderRight: '1px solid #e5e7eb', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: 0, height: '100vh', backgroundColor: '#f9fafb' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900' }}>💎 VIMciety</h1>
        <Link href="/" style={{ textDecoration: 'none', color: '#374151', fontSize: '18px', fontWeight: 'bold' }}>🏠 Home</Link>
        <button onClick={() => router.push('/?feed=following')} style={{ background: 'none', border: 'none', color: '#374151', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', padding: 0 }}>👣 Following</button>
        <button onClick={() => router.push('/?feed=friends')} style={{ background: 'none', border: 'none', color: '#374151', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', padding: 0 }}>👥 Friends</button>
        <button onClick={() => { setSearchQuery(''); router.push('/?search=true') }} style={{ background: 'none', border: 'none', color: '#374151', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', padding: 0 }}>🔍 Search</button>
        <button onClick={() => router.push('/?create=true')} style={{ background: 'none', border: 'none', color: '#374151', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', padding: 0 }}>➕ Create Post</button>
        <Link href="/profile" style={{ textDecoration: 'none', color: '#374151', fontSize: '18px', fontWeight: 'bold' }}>👤 Profile</Link>
        {user && <button onClick={handleNotificationClick} style={{ background: 'none', border: 'none', color: hasNewNotifications ? '#ef4444' : '#374151', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', padding: 0 }}><span>{hasNewNotifications ? '★' : '☆'}</span> Notifications</button>}
        <div style={{ flex: 1 }}></div>
        {user ? <button onClick={() => supabase.auth.signOut()} style={{ background: '#e5e7eb', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Sign Out</button> : <Link href="/login" style={{ backgroundColor: '#6366f1', color: 'white', padding: '10px', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>Login</Link>}
      </nav>

      {/* FEED */}
      <main style={{ flex: 1, maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
         <h2 style={{ marginBottom: '20px' }}>{currentFeed.toUpperCase()} FEED</h2>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredMessages.length > 0 ? (
                filteredMessages.map((msg) => {
                    // Get Profile Data
                    const profile = profilesMap[msg.user_id]
                    const username = profile?.username || (msg.email ? msg.email.split('@')[0] : 'Anonymous');
                    const displayName = profile?.display_name || username;
                    const avatarUrl = profile?.avatar_url;

                    const isLiked = user && msg.likes?.some((l: any) => l.user_id === user.id);
                    const commentsCount = msg.comments?.length || 0;
                    const isCommentsOpen = openComments.has(msg.id);

                    return (
                        <div key={msg.id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                    
                                    {/* Avatar Circle */}
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0e7ff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{displayName[0]?.toUpperCase()}</span>
                                        )}
                                    </div>

                                    <div style={{display:'flex', flexDirection:'column'}}>
                                        {/* ✅ UPDATED: Link to Display Name */}
                                        <Link href={`/u/${username}`} style={{ fontWeight: 'bold', color: '#111827', textDecoration: 'none' }}>{displayName}</Link>
                                        
                                        {/* ✅ UPDATED: Date/Time IS HERE NOW (replaces handle) */}
                                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                                            {new Date(msg.created_at).toLocaleDateString()} at {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    
                                    {user && user.id !== msg.user_id && (
                                        <button onClick={() => toggleFollow(msg.user_id)} disabled={adminIds.has(msg.user_id)} style={{ marginLeft:'10px', padding: '2px 8px', fontSize: '10px', borderRadius: '4px', cursor: adminIds.has(msg.user_id) ? 'not-allowed' : 'pointer', border: (followingIds.has(msg.user_id) || adminIds.has(msg.user_id)) ? '1px solid #d1d5db' : '1px solid #6366f1', backgroundColor: (followingIds.has(msg.user_id) || adminIds.has(msg.user_id)) ? 'transparent' : '#6366f1', color: (followingIds.has(msg.user_id) || adminIds.has(msg.user_id)) ? '#6b7280' : 'white' }}>
                                            {adminIds.has(msg.user_id) ? '🔒 Admin' : (followingIds.has(msg.user_id) ? 'Following' : '+ Follow')}
                                        </button>
                                    )}
                                </div>
                                
                                {/* Removed the old date/time span from here */}
                            </div>
                            {renderContent(msg)}
                            {msg.media_url && msg.post_type === 'image' && <img src={msg.media_url} style={{maxWidth:'100%', borderRadius:'8px', marginTop:'10px'}} />}
                            {msg.media_url && msg.post_type === 'video' && <video controls src={msg.media_url} style={{maxWidth:'100%', borderRadius:'8px', marginTop:'10px'}} />}
                            
                            <div style={{ marginTop: '15px', display: 'flex', gap: '20px' }}>
                                <button onClick={() => handleLike(msg.id, isLiked)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? '#ef4444' : '#9ca3af' }}>{isLiked ? '❤️' : '🤍'} {msg.likes?.length || 0}</button>
                                <button onClick={() => toggleComments(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>💬 {commentsCount}</button>
                            </div>
                            
                            {isCommentsOpen && (
                                <div style={{ marginTop: '15px', backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                    <div style={{ marginBottom: '15px', maxHeight: '200px', overflowY: 'auto' }}>
                                        {msg.comments && msg.comments.length > 0 ? (
                                            msg.comments.map((c: any) => (
                                                <div key={c.id} style={{ marginBottom: '10px', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px' }}>
                                                    <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 'bold' }}>{c.email}</div>
                                                    <div style={{ fontSize: '14px', color: '#374151' }}>{c.content}</div>
                                                </div>
                                            ))
                                        ) : (<div style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>No comments yet.</div>)}
                                    </div>
                                    {user ? (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input type="text" placeholder="Write a comment..." value={commentText[msg.id] || ''} onChange={(e) => setCommentText(prev => ({ ...prev, [msg.id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && handlePostComment(msg.id)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#111827' }} />
                                            <button onClick={() => handlePostComment(msg.id)} style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', padding: '0 15px', cursor: 'pointer' }}>Post</button>
                                        </div>
                                    ) : (<div style={{ fontSize: '12px', color: '#6b7280' }}>Log in to comment.</div>)}
                                </div>
                            )}
                        </div>
                    )
                })
            ) : (
                <div style={{ textAlign: 'center', color: '#9ca3af' }}>No posts found in the {currentFeed} feed.</div>
            )}
         </div>
      </main>

      {/* SEARCH MODAL */}
      {showSearchModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '100px' }}>
           <div style={{ backgroundColor: 'white', width: '90%', maxWidth: '600px', borderRadius: '12px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
               <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Search Posts</h2>
               <Link href="/" style={{ textDecoration: 'none', fontSize: '24px', color: '#6b7280' }}>&times;</Link>
             </div>
             <input 
                type="text" 
                placeholder="Search text or @username..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                autoFocus 
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '10px', color: '#111827' }} 
             />
             <div style={{ textAlign: 'right' }}>
                 <button 
                    onClick={handleSearchSubmit} 
                    style={{ backgroundColor: '#6366f1', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontSize: '14px', cursor: 'pointer' }}
                 >
                    Search
                 </button>
             </div>
           </div>
        </div>
      )}

      {/* CREATE POST MODAL - FIXED ZINDEX */}
      {showCreateModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '400px' }}>
                  <h3>Create New Post</h3>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*,audio/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} />
                  
                  {/* Buttons for types */}
                  <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                     <button onClick={() => handleOptionClick('text')}>📝 Text</button>
                     <button onClick={() => handleOptionClick('image')}>📷 Image</button>
                     <button onClick={() => handleOptionClick('embed')}>Embed</button>
                  </div>
                  
                  {mediaFile && <div style={{fontSize:'12px', color:'green'}}>File: {mediaFile.name}</div>}
                  
                  <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} style={{ width: '100%', height: '100px', marginBottom: '10px', padding: '10px' }} placeholder={postType==='embed' ? "Paste embed code..." : "What's happening?"} />
                  
                  <button onClick={handlePost} disabled={uploading} style={{ width: '100%', padding: '10px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{uploading ? 'Posting...' : 'Post'}</button>
                  <button onClick={() => router.push('/')} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
              </div>
          </div>
      )}
    </div>
  )
}

export default function MessageBoard() {
  return (
    <Suspense fallback={<div style={{color: '#111827', padding: '20px'}}>Loading...</div>}>
      <MessageBoardContent />
    </Suspense>
  )
}