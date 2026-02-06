'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import * as nsfwjs from 'nsfwjs'
import * as tf from '@tensorflow/tfjs'

function MessageBoardContent() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  
  // Notification State
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  
  // Comment State
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

      if (user) {
        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
        setFollowingIds(new Set(follows?.map(f => f.following_id) || []))
        
        // --- NOTIFICATION CHECK ---
        checkNotifications(user.id)
      }

      // Fetch Posts
      let query = supabase
        .from('posts')
        .select(`
            *,
            likes ( user_id ),
            comments ( id, content, email, user_id, created_at )
        `)
        .order('created_at', { ascending: false })
        .order('created_at', { foreignTable: 'comments', ascending: true })

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

    // Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        setMessages((prev) => [{ ...payload.new, likes: [], comments: [] }, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentFeed]) 

  // --- NEW: Notification Logic ---
  async function checkNotifications(userId: string) {
      // Get the last time the user clicked the notification star
      const lastCheck = localStorage.getItem('lastNotificationCheck') || new Date(0).toISOString()
      
      // 1. Check for new Follows
      const { data: newFollows } = await supabase
        .from('follows')
        .select('created_at')
        .eq('following_id', userId)
        .gt('created_at', lastCheck)
        
      // 2. Check for new Comments on MY posts
      // We use !inner to filter comments where the related post belongs to ME
      const { data: newComments } = await supabase
        .from('comments')
        .select('created_at, posts!inner(user_id)')
        .eq('posts.user_id', userId)
        .neq('user_id', userId) // Don't notify for my own comments
        .gt('created_at', lastCheck)

      // 3. Check for new Likes on MY posts
      const { data: newLikes } = await supabase
        .from('likes')
        .select('created_at, posts!inner(user_id)')
        .eq('posts.user_id', userId)
        .neq('user_id', userId) // Don't notify for my own likes
        .gt('created_at', lastCheck)

      if ((newFollows && newFollows.length > 0) || 
          (newComments && newComments.length > 0) || 
          (newLikes && newLikes.length > 0)) {
          setHasNewNotifications(true)
      }
  }

  const handleNotificationClick = () => {
      setHasNewNotifications(false)
      // Save current time as the new "Last Checked" time
      localStorage.setItem('lastNotificationCheck', new Date().toISOString())
      alert("Notifications cleared! (This would open a notifications page in the future)")
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

  async function handleLike(postId: string, isLiked: boolean) {
    if (!user) return alert("Please login to like posts.")
    
    setMessages(prev => prev.map(msg => {
        if (msg.id === postId) {
            const newLikes = isLiked 
                ? msg.likes.filter((l: any) => l.user_id !== user.id) 
                : [...(msg.likes || []), { user_id: user.id }] 
            return { ...msg, likes: newLikes }
        }
        return msg
    }))

    if (isLiked) {
        await supabase.from('likes').delete().match({ user_id: user.id, post_id: postId })
    } else {
        await supabase.from('likes').insert({ user_id: user.id, post_id: postId })
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

  const filteredMessages = messages.filter(msg => {
    const query = urlSearchQuery || searchQuery
    if (!query) return true;
    const lowerQ = query.toLowerCase();
    return (
        (msg.content && msg.content.toLowerCase().includes(lowerQ)) || 
        (msg.email && msg.email.toLowerCase().includes(lowerQ))
    );
  });

  async function handlePost() {
    if (!user) return alert("You must be logged in to post!")
    if (!newMessage.trim() && !mediaFile) return

    try {
      setUploading(true)
      let publicUrl = null
      let type = postType

      if (mediaFile) {
        if (type === 'image') {
           const model = await nsfwjs.load()
           const img = document.createElement('img')
           img.src = URL.createObjectURL(mediaFile)
           await new Promise((resolve) => { img.onload = resolve }) 
           const predictions = await model.classify(img)
           const isExplicit = predictions.some((p: any) => 
             (p.className === 'Porn' || p.className === 'Hentai') && p.probability > 0.90
           )
           if (isExplicit) throw new Error("Content flagged as inappropriate (NSFW detected).")
        }

        const fileExt = mediaFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${fileName}`
        
        const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, mediaFile)
        if (uploadError) throw uploadError
        
        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath)
        publicUrl = data.publicUrl
      }

      if (type === 'video' && !mediaFile && newMessage.match(/youtube\.com|youtu\.be/)) type = 'text' 

      const { error } = await supabase.from('posts').insert([{ 
          content: newMessage, email: user.email, user_id: user.id, media_url: publicUrl, post_type: type
      }])

      if (error) throw error
      setNewMessage(''); setMediaFile(null); setPostType('text'); router.push('/') 
    } catch (error: any) { alert("Post Error: " + error.message) } 
    finally { setUploading(false) }
  }

  const handleOptionClick = (type: string) => {
    setPostType(type); setMediaFile(null)
    if (type === 'image' || type === 'video' || type === 'audio') setTimeout(() => fileInputRef.current?.click(), 100)
  }
  
  const getAcceptType = () => {
      if (postType === 'image') return 'image/*'
      if (postType === 'video') return 'video/*'
      if (postType === 'audio') return 'audio/*'
      return '*'
  }

  const renderContent = (msg: any) => {
    let contentElement = null;
    
    if (msg.post_type === 'embed') {
        const cleanHTML = DOMPurify.sanitize(msg.content, {
            ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'blockquote', 'ul', 'li', 'br'],
            ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'title', 'allow', 'allowfullscreen', 'frameborder', 'href', 'target', 'class', 'loading'],
            ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
        });
        contentElement = <div style={{ marginTop: '10px', overflow: 'hidden', borderRadius: '8px' }} dangerouslySetInnerHTML={{ __html: cleanHTML }} />
    } else {
        const text = msg.content || '';
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
        
        contentElement = (
            <div style={{ margin: '0 0 10px 0', color: 'white', lineHeight: '1.5' }}>
                {textContent}
                {msg.media_url && (
                    <div style={{ marginTop: '10px' }}>
                        {msg.post_type === 'image' && <img src={msg.media_url} alt="Uploaded" style={{ maxWidth: '100%', borderRadius: '8px' }} />}
                        {msg.post_type === 'video' && <video controls src={msg.media_url} style={{ maxWidth: '100%', borderRadius: '8px' }} />}
                        {msg.post_type === 'audio' && (<div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px', fontSize: '20px' }}>🎵</span><audio controls src={msg.media_url} style={{ width: '100%' }} /></div>)}
                    </div>
                )}
            </div>
        )
    }

    return contentElement
  };

  return (
    // MAIN LAYOUT CONTAINER (Flexbox for Sidebar + Feed)
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* --- LEFT SIDEBAR --- */}
      <nav style={{ width: '250px', borderRight: '1px solid #333', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: 0, height: '100vh' }}>
        <h1 style={{ fontSize: '28px', color: 'white', margin: '0 0 20px 0', fontWeight: '900' }}>💎 VIMciety</h1>
        
        <Link href="/" style={{ textDecoration: 'none', color: 'white', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 'bold' }}>
            <span>🏠</span> Home
        </Link>
        
        <button onClick={() => { setSearchQuery(''); router.push('/?search=true') }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>
            <span>🔍</span> Search
        </button>

        <button onClick={() => router.push('/?create=true')} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>
            <span>➕</span> Create Post
        </button>

        <Link href="/profile" style={{ textDecoration: 'none', color: 'white', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 'bold' }}>
            <span>👤</span> Profile
        </Link>

        {/* --- NOTIFICATION STAR --- */}
        {user && (
            <button 
                onClick={handleNotificationClick} 
                style={{ 
                    background: 'none', border: 'none', 
                    color: hasNewNotifications ? '#ef4444' : 'white', // RED if new, White if read
                    fontSize: '20px', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 'bold', cursor: 'pointer', padding: 0 
                }}
            >
                <span>{hasNewNotifications ? '★' : '☆'}</span> Notifications
            </button>
        )}

        <div style={{ flex: 1 }}></div> {/* Spacer to push Sign Out down */}

        {user ? (
            <button onClick={async () => { await supabase.auth.signOut(); setUser(null); }} style={{ background: '#333', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Sign Out
            </button>
        ) : (
            <Link href="/login" style={{ backgroundColor: '#6366f1', color: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>
                Login / Sign Up
            </Link>
        )}
      </nav>


      {/* --- RIGHT FEED CONTENT --- */}
      <main style={{ flex: 1, maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
         {/* Feed Header info */}
         <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0 }}>{currentFeed === 'global' ? 'Global Feed' : currentFeed.toUpperCase()}</h2>
            {urlSearchQuery && <span style={{ backgroundColor: '#333', padding: '4px 8px', borderRadius: '4px' }}>Searching: "{urlSearchQuery}"</span>}
         </div>

        {/* Post List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredMessages.length > 0 ? (
            filteredMessages.map((msg: any) => {
                const isLiked = user && msg.likes?.some((l: any) => l.user_id === user.id);
                const likesCount = msg.likes?.length || 0;
                const commentsCount = msg.comments?.length || 0;
                const isCommentsOpen = openComments.has(msg.id);

                return (
                <div key={msg.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Link href={`/profile?id=${msg.user_id}`} style={{ fontWeight: 'bold', color: '#6366f1', textDecoration: 'none' }}>
                            {msg.email || 'Anonymous'}
                        </Link>
                        {user && user.id !== msg.user_id && (
                            <button onClick={() => toggleFollow(msg.user_id)} disabled={adminIds.has(msg.user_id)} style={{ padding: '2px 8px', fontSize: '10px', borderRadius: '4px', cursor: adminIds.has(msg.user_id) ? 'not-allowed' : 'pointer', border: (followingIds.has(msg.user_id) || adminIds.has(msg.user_id)) ? '1px solid #4b5563' : '1px solid #6366f1', backgroundColor: (followingIds.has(msg.user_id) || adminIds.has(msg.user_id)) ? 'transparent' : '#6366f1', color: (followingIds.has(msg.user_id) || adminIds.has(msg.user_id)) ? '#9ca3af' : 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {adminIds.has(msg.user_id) ? <><span>🔒</span> Admin</> : (followingIds.has(msg.user_id) ? 'Following' : '+ Follow')}
                            </button>
                        )}
                    </div>
                    <span style={{ color: '#888', fontSize: '12px' }}>{new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
                {renderContent(msg)}
                <div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px', display: 'flex', gap: '20px' }}>
                        <button onClick={() => handleLike(msg.id, isLiked)} style={{ background: 'none', border: 'none', color: isLiked ? '#ef4444' : '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                            {isLiked ? '❤️' : '🤍'} {likesCount}
                        </button>
                        <button onClick={() => toggleComments(msg.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                            💬 {commentsCount}
                        </button>
                </div>
                {isCommentsOpen && (
                    <div style={{ marginTop: '15px', backgroundColor: '#262626', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ marginBottom: '15px', maxHeight: '200px', overflowY: 'auto' }}>
                            {msg.comments && msg.comments.length > 0 ? (
                                msg.comments.map((c: any) => (
                                    <div key={c.id} style={{ marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                                        <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 'bold' }}>{c.email}</div>
                                        <div style={{ fontSize: '14px', color: '#e5e7eb' }}>{c.content}</div>
                                    </div>
                                ))
                            ) : (<div style={{ color: '#6b7280', fontSize: '13px', fontStyle: 'italic' }}>No comments yet.</div>)}
                        </div>
                        {user ? (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" placeholder="Write a comment..." value={commentText[msg.id] || ''} onChange={(e) => setCommentText(prev => ({ ...prev, [msg.id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && handlePostComment(msg.id)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #4b5563', backgroundColor: '#374151', color: 'white' }} />
                                <button onClick={() => handlePostComment(msg.id)} style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', padding: '0 15px', cursor: 'pointer' }}>Post</button>
                            </div>
                        ) : (<div style={{ fontSize: '12px', color: '#6b7280' }}>Log in to comment.</div>)}
                    </div>
                )}
                </div>
                )})
            ) : (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
                    <p>No posts found.</p>
                    {(currentFeed !== 'global' || urlSearchQuery) && (
                        <button onClick={() => { setSearchQuery(''); router.push('/') }} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                            Clear Search & Return to Feed
                        </button>
                    )}
            </div>
            )}
        </div>
      </main>

      {/* SEARCH MODAL */}
      {showSearchModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '100px' }}>
           <div style={{ backgroundColor: 'white', width: '90%', maxWidth: '600px', borderRadius: '12px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
               <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Search Posts</h2>
               <Link href="/" style={{ textDecoration: 'none', fontSize: '24px', color: '#666' }}>&times;</Link>
             </div>
             <input 
                type="text" 
                placeholder="Search text or @username..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                autoFocus 
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px' }} 
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

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#1a1a1a', width: '90%', maxWidth: '500px', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h2 style={{ color: 'white', margin: 0, fontSize: '20px' }}>Create New Post</h2><Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '24px' }}>&times;</Link></div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept={getAcceptType()} onChange={(e) => setMediaFile(e.target.files?.[0] || null)} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => handleOptionClick('text')} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: postType === 'text' ? '#6366f1' : '#333', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '20px' }}>📝</span><span style={{ fontSize: '10px' }}>Text</span></button>
                <button onClick={() => handleOptionClick('audio')} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: postType === 'audio' ? '#6366f1' : '#333', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '20px' }}>🎵</span><span style={{ fontSize: '10px' }}>Audio</span></button>
                <button onClick={() => handleOptionClick('image')} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: postType === 'image' ? '#6366f1' : '#333', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '20px' }}>📷</span><span style={{ fontSize: '10px' }}>Picture</span></button>
                <button onClick={() => handleOptionClick('video')} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: postType === 'video' ? '#6366f1' : '#333', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '20px' }}>🎥</span><span style={{ fontSize: '10px' }}>Video</span></button>
                <button onClick={() => handleOptionClick('embed')} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: postType === 'embed' ? '#6366f1' : '#333', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '20px' }}>{'</>'}</span><span style={{ fontSize: '10px' }}>Embed</span></button>
            </div>
            {mediaFile && <div style={{ marginBottom: '15px', color: '#6366f1', fontSize: '14px', textAlign: 'center' }}>File Selected: <strong>{mediaFile.name}</strong></div>}
            <textarea style={{ width: '100%', padding: '15px', borderRadius: '10px', backgroundColor: '#333', color: 'white', border: 'none', minHeight: '100px', fontSize: '16px', marginBottom: '20px', resize: 'none' }} placeholder={postType === 'embed' ? "Paste your Canva/Embed code here..." : "What's on your mind?"} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
            <button onClick={handlePost} disabled={uploading} style={{ width: '100%', padding: '14px', backgroundColor: uploading ? '#4b5563' : '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '16px' }}>{uploading ? 'Publishing...' : 'Post Message'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MessageBoard() {
  return (
    <Suspense fallback={<div style={{color: 'white', padding: '20px'}}>Loading...</div>}>
      <MessageBoardContent />
    </Suspense>
  )
}