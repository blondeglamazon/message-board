'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import ReportButton from '@/components/ReportButton'

export const dynamicParams = false;

// MAX FILE SIZE: 50MB (Make sure Supabase Bucket settings match this!)
const MAX_FILE_SIZE = 50 * 1024 * 1024 

function MessageBoardContent() {
  const supabase = createClient()

  const [messages, setMessages] = useState<any[]>([])
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({}) 
  const [newMessage, setNewMessage] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null) // NEW: For draft preview
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({})
  const [openComments, setOpenComments] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [postType, setPostType] = useState<string>('text') 
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // Filters
  const [blockedIds, setBlockedIds] = useState<string[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentFeed = searchParams.get('feed') || 'global' 
  const urlSearchQuery = searchParams.get('q') || ''
  const isCreate = searchParams.get('create') === 'true'

  useEffect(() => {
    if (urlSearchQuery) setSearchQuery(urlSearchQuery)
  }, [urlSearchQuery])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // --- DATA FETCHING ---
  useEffect(() => {
    async function initData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Fetch Profiles
      const { data: allProfiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url')
      const pMap: Record<string, any> = {}
      allProfiles?.forEach(p => { pMap[p.id] = p })
      setProfilesMap(pMap)

      let myFollowingIds = new Set<string>()
      let myBlockedIds: string[] = []

      if (user) {
        const { data: blocks } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id)
        myBlockedIds = blocks?.map(b => b.blocked_id) || []
        setBlockedIds(myBlockedIds)

        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
        myFollowingIds = new Set(follows?.map(f => f.following_id) || [])
        setFollowingIds(myFollowingIds)
        
        checkNotifications(user.id)
      }

      let query = supabase
        .from('posts')
        .select(`*, likes ( user_id ), comments ( id, content, email, user_id, created_at )`)
        .order('created_at', { ascending: false })

      if (myBlockedIds.length > 0) {
        query = query.not('user_id', 'in', `(${myBlockedIds.join(',')})`)
      }

      if (user && currentFeed === 'following') {
         const ids = Array.from(myFollowingIds)
         if (ids.length > 0) query = query.in('user_id', ids)
         else query = query.in('user_id', ['00000000-0000-0000-0000-000000000000'])
      } 
      else if (user && currentFeed === 'friends') {
         const { data: followsMe } = await supabase.from('follows').select('follower_id').eq('following_id', user.id)
         const theirIds = new Set(followsMe?.map(f => f.follower_id) || [])
         const friendIds = Array.from(myFollowingIds).filter(id => theirIds.has(id))
         if (friendIds.length > 0) query = query.in('user_id', friendIds)
         else query = query.in('user_id', ['00000000-0000-0000-0000-000000000000'])
      }

      const { data: posts } = await query
      if (posts) setMessages(posts)
    }
    
    initData()
    
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        if (!blockedIds.includes(payload.new.user_id)) {
            setMessages((prev) => [{ ...payload.new, likes: [], comments: [] }, ...prev])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentFeed, supabase, blockedIds])

  // --- ACTIONS ---

  async function checkNotifications(userId: string) {
      const lastCheck = localStorage.getItem('lastNotificationCheck') || new Date(0).toISOString()
      const { data: newLikes } = await supabase
        .from('likes')
        .select('created_at, posts!inner(user_id)')
        .eq('posts.user_id', userId)
        .gt('created_at', lastCheck)
      
      if (newLikes && newLikes.length > 0) setHasNewNotifications(true)
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

  // 2. FILE HANDLING & PREVIEW
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > MAX_FILE_SIZE) {
        alert(`File too large! Max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
        return
      }
      setMediaFile(file)
      
      // Generate Preview URL
      const objectUrl = URL.createObjectURL(file)
      setMediaPreview(objectUrl)
    }
  }

  const clearFile = () => {
    setMediaFile(null)
    if (mediaPreview) URL.revokeObjectURL(mediaPreview)
    setMediaPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePost = async () => {
    if (!user) return alert("Please login to post!")
    if (!newMessage.trim() && !mediaFile) return
    setUploading(true)
    try {
        let publicUrl = null
        if (mediaFile) {
            // Unique Filename to prevent overwrites
            const fileExt = mediaFile.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            
            const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, mediaFile)
            if (uploadError) throw uploadError

            // Get Public URL
            const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
            publicUrl = data.publicUrl
        }

        await supabase.from('posts').insert([{ 
            content: newMessage, 
            user_id: user.id, 
            email: user.email, 
            post_type: postType, 
            media_url: publicUrl 
        }])

        setNewMessage('')
        clearFile() // Clear preview
        setPostType('text')
        
        if (isCreate) router.push('/')

    } catch (e: any) { 
        alert("Upload Error: " + e.message) 
    }
    setUploading(false)
  }

  const renderContent = (msg: any) => {
    if (msg.post_type === 'embed') {
        const clean = DOMPurify.sanitize(msg.content, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] });
        return <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: clean }} />
    }
    
    // Render Images/Videos
    return (
        <div>
           <p style={{ color: '#111827', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
           {msg.media_url && (
             <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Check extension for Video vs Image */}
                {msg.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                  <video src={msg.media_url} controls playsInline style={{ maxWidth: '100%', borderRadius: '8px', display: 'block' }} />
                ) : (
                  <img 
                    src={msg.media_url} 
                    alt="Post media" 
                    referrerPolicy="no-referrer" 
                    style={{ maxWidth: '100%', borderRadius: '8px', display: 'block' }} 
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} // Hide broken images
                  />
                )}
             </div>
           )}
        </div>
    )
  }

  const filteredMessages = messages.filter(msg => {
    const query = urlSearchQuery || searchQuery
    if (!query) return true;
    const lowerQ = query.toLowerCase();
    const profile = profilesMap[msg.user_id];
    return (msg.content?.toLowerCase().includes(lowerQ) || profile?.username?.toLowerCase().includes(lowerQ) || profile?.display_name?.toLowerCase().includes(lowerQ));
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff', color: '#111827', fontFamily: 'sans-serif' }}>
      
      <main style={{ 
        flex: 1, 
        maxWidth: '700px', 
        margin: '0 auto', 
        paddingTop: isMobile ? 'calc(60px + env(safe-area-inset-top))' : '40px',
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingBottom: '80px' 
      }}>
         
         {/* HEADER */}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{currentFeed.toUpperCase()} FEED</h2>
            {user && !isCreate && (
              <button 
                onClick={() => router.push('/?create=true')}
                style={{ padding: '8px 16px', backgroundColor: '#6366f1', color: 'white', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
              >
                + Post
              </button>
            )}
         </div>

         {/* 3. CREATE POST UI (Mobile Optimized) */}
         {(isCreate || (!isMobile && currentFeed === 'global')) && user && (
           <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
             <textarea
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               placeholder="What's on your mind?"
               style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '10px', minHeight: '80px', backgroundColor: 'white', fontSize: '16px', color: '#111827' }}
             />
             
             {/* Draft Preview (NEW!) */}
             {mediaPreview && (
               <div style={{ marginBottom: '15px', position: 'relative' }}>
                 {mediaFile?.type.startsWith('video') ? (
                    <video src={mediaPreview} controls style={{ maxHeight: '200px', borderRadius: '8px' }} />
                 ) : (
                    <img src={mediaPreview} alt="Preview" style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'cover' }} />
                 )}
                 <button 
                    onClick={clearFile}
                    style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                 >✕</button>
               </div>
             )}

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                   <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" hidden />
                   <button 
                     onClick={() => fileInputRef.current?.click()} 
                     style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                   >
                     <span>📷</span> <span style={{fontSize: '14px', fontWeight: '600', color: '#374151'}}>Media</span>
                   </button>
                </div>
                <button 
                  onClick={handlePost}
                  disabled={uploading}
                  style={{ 
                    padding: '8px 24px', backgroundColor: uploading ? '#9ca3af' : '#6366f1', 
                    color: 'white', borderRadius: '8px', border: 'none', cursor: uploading ? 'default' : 'pointer', fontWeight: 'bold' 
                  }}
                >
                  {uploading ? 'Uploading...' : 'Post'}
                </button>
             </div>
           </div>
         )}

         {/* FEED */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredMessages.map((msg) => {
                    const profile = profilesMap[msg.user_id]
                    const username = profile?.username || 'Anonymous';
                    const displayName = profile?.display_name || username;
                    const isLiked = user && msg.likes?.some((l: any) => l.user_id === user.id);
                    return (
                        <div key={msg.id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ marginBottom: '10px', display: 'flex', gap:'10px', alignItems:'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0e7ff', overflow: 'hidden' }}>
                                        {profile?.avatar_url && <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    </div>
                                    <div style={{display:'flex', flexDirection:'column'}}>
                                        <Link href={`/u/${username}`} style={{ fontWeight: 'bold', color: '#111827', textDecoration: 'none' }}>{displayName}</Link>
                                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>{new Date(msg.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <ReportButton postId={msg.id} />
                            </div>
                            {renderContent(msg)}
                            
                            <div style={{ marginTop: '15px', display: 'flex', gap: '15px' }}>
                                <button 
                                  onClick={() => handleLike(msg.id, !!isLiked)} 
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? '#ef4444' : '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px' }}>
                                  <span style={{ fontSize: '18px' }}>{isLiked ? '❤️' : '🤍'}</span> 
                                  <span style={{ fontWeight: '600' }}>{msg.likes?.length || 0}</span>
                                </button>
                                <button 
                                  onClick={() => toggleComments(msg.id)} 
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px' }}>
                                  <span style={{ fontSize: '18px' }}>💬</span> 
                                  <span style={{ fontWeight: '600' }}>{msg.comments?.length || 0}</span>
                                </button>
                            </div>

                            {openComments.has(msg.id) && (
                                <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                                    {msg.comments?.map((c: any) => {
                                        const commenter = profilesMap[c.user_id]
                                        const commenterName = commenter?.username || 'User'
                                        const commentDate = new Date(c.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                                        return (
                                            <div key={c.id} style={{ marginBottom: '12px', fontSize: '14px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                   <span style={{ fontWeight: 'bold', color: '#374151' }}>{commenterName}</span>
                                                   <span style={{ fontSize: '11px', color: '#9ca3af' }}>{commentDate}</span>
                                                </div>
                                                <div style={{ color: '#4b5563', lineHeight: '1.4' }}>{c.content}</div>
                                            </div>
                                        )
                                    })}
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <input type="text" placeholder="Add a comment..." value={commentText[msg.id] || ''} onChange={(e) => setCommentText({ ...commentText, [msg.id]: e.target.value })} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px' }} />
                                        <button onClick={() => handlePostComment(msg.id)} style={{ padding: '0 20px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', minHeight: '44px' }}>Send</button>
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
    <Suspense fallback={<div style={{color: '#111827', padding: '20px'}}>Loading...</div>}>
      <MessageBoardContent />
    </Suspense>
  )
}