'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import ReportButton from '@/components/ReportButton'
import Sidebar from '@/components/Sidebar'

export const dynamicParams = false;

// MAX FILE SIZE: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024 

function MessageBoardContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  // --- STATE ---
  const [messages, setMessages] = useState<any[]>([])
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({}) 
  const [newMessage, setNewMessage] = useState('')
  
  // Media / Upload State
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [isEmbedMode, setIsEmbedMode] = useState(false)
  const [postType, setPostType] = useState<string>('text') 
  const [uploading, setUploading] = useState(false)
  
  // User / UI State
  const [user, setUser] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // Comments / Interaction State
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({})
  const [openComments, setOpenComments] = useState<Set<string>>(new Set())
  const [blockedIds, setBlockedIds] = useState<string[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  
  const currentFeed = searchParams.get('feed') || 'global' 
  const urlSearchQuery = searchParams.get('q') || ''
  const isCreate = searchParams.get('create') === 'true'

  // Refs
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const micInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // --- DATA FETCHING ---
  useEffect(() => {
    async function initData() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)

      // Fetch Profiles
      const { data: allProfiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url')
      const pMap: Record<string, any> = {}
      allProfiles?.forEach(p => { pMap[p.id] = p })
      setProfilesMap(pMap)

      let myFollowingIds = new Set<string>()
      let myBlockedIds: string[] = []

      if (authUser) {
        // UGC POLICY: Fetch Blocked Users
        const { data: blocks } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', authUser.id)
        myBlockedIds = blocks?.map(b => b.blocked_id) || []
        setBlockedIds(myBlockedIds)

        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', authUser.id)
        myFollowingIds = new Set(follows?.map(f => f.following_id) || [])
        setFollowingIds(myFollowingIds)
      }

      // Build Query
      let query = supabase
        .from('posts')
        .select(`*, likes ( user_id ), comments ( id, content, email, user_id, created_at )`)
        .order('created_at', { ascending: false })

      // UGC POLICY: Filter out Blocked Users
      if (myBlockedIds.length > 0) {
        query = query.not('user_id', 'in', `(${myBlockedIds.join(',')})`)
      }

      if (authUser && currentFeed === 'following') {
         const ids = Array.from(myFollowingIds)
         if (ids.length > 0) query = query.in('user_id', ids)
         else query = query.in('user_id', ['00000000-0000-0000-0000-000000000000'])
      } 
      else if (authUser && currentFeed === 'friends') {
         const { data: followsMe } = await supabase.from('follows').select('follower_id').eq('following_id', authUser.id)
         const theirIds = new Set(followsMe?.map(f => f.follower_id) || [])
         const friendIds = Array.from(myFollowingIds).filter(id => theirIds.has(id))
         if (friendIds.length > 0) query = query.in('user_id', friendIds)
         else query = query.in('user_id', ['00000000-0000-0000-0000-000000000000'])
      }

      const { data: posts } = await query
      if (posts) setMessages(posts)
    }
    
    initData()
    
    // Realtime Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        // UGC POLICY: Ignore realtime posts from blocked users
        if (!blockedIds.includes(payload.new.user_id)) {
            setMessages((prev) => [{ ...payload.new, likes: [], comments: [] }, ...prev])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentFeed, supabase, blockedIds])

  // --- HANDLERS ---

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  async function handleLike(postId: string, isLiked: boolean) {
    if (!user) return alert("Please login to like posts.")
    setMessages(prev => prev.map(msg => msg.id === postId ? { ...msg, likes: isLiked ? msg.likes.filter((l: any) => l.user_id !== user.id) : [...msg.likes, { user_id: user.id }] } : msg))
    if (isLiked) await supabase.from('likes').delete().match({ user_id: user.id, post_id: postId })
    else await supabase.from('likes').insert({ user_id: user.id, post_id: postId })
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
    const { data: newComment, error } = await supabase.from('comments').insert({ post_id: postId, user_id: user.id, email: user.email, content: text }).select().single()
    if (error) return alert("Error: " + error.message)
    setMessages(prev => prev.map(msg => msg.id === postId ? { ...msg, comments: [...(msg.comments || []), newComment] } : msg))
    setCommentText(prev => ({ ...prev, [postId]: '' }))
  }

  // File Handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > MAX_FILE_SIZE) {
        alert(`File too large! Max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
        return
      }
      setMediaFile(file)
      setIsEmbedMode(false)
      
      // Determine Type
      if (file.type.startsWith('image/')) setPostType('image')
      else if (file.type.startsWith('video/')) setPostType('video')
      else if (file.type.startsWith('audio/')) setPostType('audio')
      else setPostType('file')

      // Preview
      const objectUrl = URL.createObjectURL(file)
      setMediaPreview(objectUrl)
    }
  }

  const clearFile = () => {
    setMediaFile(null)
    if (mediaPreview) URL.revokeObjectURL(mediaPreview)
    setMediaPreview(null)
    setPostType('text')
    // Reset all inputs
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (micInputRef.current) micInputRef.current.value = ''
  }

  const handlePost = async () => {
    if (!user) { router.push('/login'); return; }
    if (!newMessage.trim() && !mediaFile) return
    
    setUploading(true)
    try {
        let publicUrl = null
        let finalPostType = isEmbedMode ? 'embed' : postType

        if (mediaFile) {
            const fileExt = mediaFile.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage.from('posts').upload(fileName, mediaFile)
            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('posts').getPublicUrl(fileName)
            publicUrl = data.publicUrl
        }

        await supabase.from('posts').insert([{ 
            content: newMessage, 
            user_id: user.id, 
            email: user.email, 
            post_type: finalPostType, 
            media_url: publicUrl 
        }])

        setNewMessage('')
        clearFile()
        setIsEmbedMode(false)
        
        if (isCreate) router.push('/')
        else window.location.reload()

    } catch (e: any) { 
        alert("Upload Error: " + e.message) 
    }
    setUploading(false)
  }

  // --- RENDER HELPERS ---

  const renderSafeHTML = (html: string) => {
    if (!html) return null;
    const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'br', 'strong', 'em', 'b', 'i', 'ul', 'li'],
        ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'frameborder', 'allow', 'allowfullscreen', 'scrolling', 'href', 'target', 'rel', 'title', 'class', 'id', 'loading', 'referrerpolicy'],
        ADD_TAGS: ['iframe', 'link']
    })
    return <div style={{ width: '100%', overflow: 'hidden', marginTop: '10px', borderRadius: '12px' }} dangerouslySetInnerHTML={{ __html: clean }} />
  }

  const renderContent = (msg: any) => {
    // Embed / HTML
    if (msg.post_type === 'embed' || (typeof msg.content === 'string' && msg.content.trim().startsWith('<'))) {
        return renderSafeHTML(msg.content)
    }
    
    // Text & Media
    return (
        <div>
           <p style={{ color: '#111827', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontSize: '16px', margin: 0 }}>{msg.content}</p>
           {msg.media_url && (
             <div style={{ marginTop: '15px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}>
                {msg.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                  <video src={msg.media_url} controls playsInline style={{ width: '100%', display: 'block' }} />
                ) : msg.media_url.match(/\.(mp3|wav|m4a)$/i) ? (
                  <div style={{padding:'20px', background:'#f3f4f6'}}><audio controls src={msg.media_url} style={{ width: '100%' }} /></div>
                ) : (
                  <img src={msg.media_url} alt="Post media" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />
                )}
             </div>
           )}
        </div>
    )
  }

  const filteredMessages = messages.filter(msg => {
    const query = urlSearchQuery
    if (!query) return true;
    const lowerQ = query.toLowerCase();
    const profile = profilesMap[msg.user_id];
    return (msg.content?.toLowerCase().includes(lowerQ) || profile?.username?.toLowerCase().includes(lowerQ) || profile?.display_name?.toLowerCase().includes(lowerQ));
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Sidebar />

      {/* Floating Auth Buttons */}
      <div style={{ 
        position: 'fixed', top: '20px', right: '20px', 
        zIndex: 100, display: 'flex', gap: '10px' 
      }}>
        {user ? (
          <button onClick={handleSignOut} style={{ 
            height: '44px', padding: '0 20px', borderRadius: '22px', 
            border: '2px solid #111827', backgroundColor: 'white', 
            fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            color: '#111827'
          }}>
            Log Out
          </button>
        ) : (
          <Link href="/login" style={{ 
            height: '44px', display:'flex', alignItems:'center', padding: '0 20px', 
            borderRadius: '22px', backgroundColor: 'white', color: '#111827', 
            fontWeight: 'bold', textDecoration: 'none', border: '2px solid #111827',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}>
            Log In
          </Link>
        )}
      </div>
      
      <main style={{ 
        maxWidth: '600px', margin: '0 auto', 
        paddingTop: 'calc(20px + env(safe-area-inset-top))',
        paddingLeft: '20px', paddingRight: '20px', paddingBottom: '100px'
      }}>
         
         {/* FEED HEADER */}
         <div style={{ marginBottom: '20px', marginTop: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>{currentFeed.toUpperCase()} FEED</h2>
         </div>

         {/* POST CREATION UI */}
         {user && (
           <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
             <textarea
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               placeholder={isEmbedMode ? "Paste embed code here..." : "What's on your mind?"}
               style={{ 
                  width: '100%', padding: '12px', borderRadius: '12px', 
                  border: '1px solid #d1d5db', marginBottom: '15px', minHeight: '80px', 
                  backgroundColor: isEmbedMode ? '#1f2937' : '#ffffff', 
                  color: isEmbedMode ? '#00ff00' : '#111827',
                  fontSize: '16px', resize: 'none'
               }}
             />
             
             {/* Media Preview */}
             {mediaPreview && (
               <div style={{ marginBottom: '15px', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                 {postType === 'video' ? (
                    <video src={mediaPreview} controls style={{ width: '100%', display: 'block' }} />
                 ) : postType === 'audio' ? (
                    <div style={{padding:'20px', background:'#f3f4f6'}}><audio controls src={mediaPreview} style={{width:'100%'}} /></div>
                 ) : (
                    <img src={mediaPreview} alt="Preview" style={{ width: '100%', display: 'block' }} />
                 )}
                 <button 
                    onClick={clearFile}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                 >✕</button>
               </div>
             )}

             {/* Action Buttons Row - COMPLIANT TOUCH TARGETS (44px) */}
             <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* 1. Camera */}
                <button onClick={() => cameraInputRef.current?.click()} style={{ flex: 1, minHeight: '44px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: '20px' }} title="Camera">📷</button>
                <input type="file" ref={cameraInputRef} onChange={handleFileSelect} accept="image/*,video/*" capture="environment" hidden />

                {/* 2. Mic */}
                <button onClick={() => micInputRef.current?.click()} style={{ flex: 1, minHeight: '44px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: '20px' }} title="Microphone">🎤</button>
                <input type="file" ref={micInputRef} onChange={handleFileSelect} accept="audio/*" capture hidden />

                {/* 3. Files */}
                <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, minHeight: '44px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: '20px' }} title="Upload">📁</button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="*/*" hidden />

                {/* 4. Embed Mode */}
                <button 
                    onClick={() => setIsEmbedMode(!isEmbedMode)} 
                    style={{ 
                        flex: 1, minHeight: '44px', borderRadius: '8px', 
                        border: isEmbedMode ? '2px solid #6366f1' : '1px solid #e5e7eb', 
                        backgroundColor: isEmbedMode ? '#e0e7ff' : 'white', 
                        cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' 
                    }}>
                    mb
                </button>

                {/* Post */}
                <button 
                  onClick={handlePost}
                  disabled={uploading}
                  style={{ 
                    minHeight: '44px', padding: '0 24px', backgroundColor: uploading ? '#9ca3af' : '#111827', 
                    color: 'white', borderRadius: '22px', border: 'none', cursor: uploading ? 'default' : 'pointer', fontWeight: 'bold', marginLeft: 'auto'
                  }}
                >
                  {uploading ? '...' : 'Post'}
                </button>
             </div>
           </div>
         )}

         {/* FEED ITEMS */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredMessages.map((msg) => {
                const profile = profilesMap[msg.user_id]
                const username = profile?.username || 'Anonymous';
                const displayName = profile?.display_name || username;
                const isLiked = user && msg.likes?.some((l: any) => l.user_id === user.id);
                
                return (
                    <div key={msg.id} style={{ padding: '20px', borderRadius: '20px', border: '1px solid #e5e7eb', backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        {/* Post Header */}
                        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {/* UPDATED LINK FOR MOBILE COMPATIBILITY */}
                            <Link href={`/profile?u=${username}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                    <img src={profile?.avatar_url || '/default-avatar.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '15px' }}>{displayName}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(msg.created_at).toLocaleDateString()}</div>
                                </div>
                            </Link>
                            {/* UGC POLICY: Reporting */}
                            <ReportButton postId={msg.id} />
                        </div>

                        {/* Content */}
                        {renderContent(msg)}
                        
                        {/* Interactions */}
                        <div style={{ marginTop: '15px', display: 'flex', gap: '15px' }}>
                            <button 
                              onClick={() => handleLike(msg.id, !!isLiked)} 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? '#ef4444' : '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px' }}>
                              <span style={{ fontSize: '20px' }}>{isLiked ? '❤️' : '🤍'}</span> 
                              <span style={{ fontWeight: '600', fontSize: '14px' }}>{msg.likes?.length || 0}</span>
                            </button>
                            <button 
                              onClick={() => toggleComments(msg.id)} 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px' }}>
                              <span style={{ fontSize: '20px' }}>💬</span> 
                              <span style={{ fontWeight: '600', fontSize: '14px' }}>{msg.comments?.length || 0}</span>
                            </button>
                        </div>

                        {/* Comments Section */}
                        {openComments.has(msg.id) && (
                            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f3f4f6' }}>
                                {msg.comments?.map((c: any) => {
                                    const commenter = profilesMap[c.user_id]
                                    return (
                                        <div key={c.id} style={{ marginBottom: '12px', fontSize: '14px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#111827', marginRight: '8px' }}>{commenter?.username || 'User'}</span>
                                            <span style={{ color: '#4b5563' }}>{c.content}</span>
                                        </div>
                                    )
                                })}
                                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                    <input 
                                      type="text" 
                                      placeholder="Add a comment..." 
                                      value={commentText[msg.id] || ''} 
                                      onChange={(e) => setCommentText({ ...commentText, [msg.id]: e.target.value })} 
                                      style={{ flex: 1, height: '44px', padding: '0 15px', borderRadius: '22px', border: '1px solid #d1d5db', fontSize: '14px' }} 
                                    />
                                    <button 
                                      onClick={() => handlePostComment(msg.id)} 
                                      style={{ height: '44px', padding: '0 20px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '22px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                      Post
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
         </div>
      </main>
    </div>
  )
}

export default function MessageBoard() {
  return (
    <Suspense fallback={<div style={{color: '#111827', padding: '20px', textAlign:'center'}}>Loading...</div>}>
      <MessageBoardContent />
    </Suspense>
  )
}