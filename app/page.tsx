'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import ReportButton from '@/components/ReportButton'

export const dynamicParams = false;

function MessageBoardContent() {
  const supabase = createClient()

  const [messages, setMessages] = useState<any[]>([])
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
  const [blockedIds, setBlockedIds] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false) // Track mobile state for layout

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentFeed = searchParams.get('feed') || 'global' 
  const urlSearchQuery = searchParams.get('q') || ''

  useEffect(() => {
    if (urlSearchQuery) setSearchQuery(urlSearchQuery)
  }, [urlSearchQuery])

  // --- RESPONSIVE CHECK ---
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

      const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
      setAdminIds(new Set(admins?.map(a => a.id) || []))

      // Fetch all profiles to map IDs to Usernames
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

  const handlePost = async () => {
    if (!user) return alert("Please login to post!")
    if (!newMessage.trim() && !mediaFile) return
    setUploading(true)
    try {
        let publicUrl = null
        if (mediaFile) {
            const fileName = `${Date.now()}.${mediaFile.name.split('.').pop()}`
            await supabase.storage.from('uploads').upload(fileName, mediaFile)
            publicUrl = supabase.storage.from('uploads').getPublicUrl(fileName).data.publicUrl
        }
        await supabase.from('posts').insert([{ content: newMessage, user_id: user.id, email: user.email, post_type: postType, media_url: publicUrl }])
        setNewMessage(''); setMediaFile(null); setPostType('text'); router.push('/')
    } catch (e: any) { alert(e.message) }
    setUploading(false)
  }

  const renderContent = (msg: any) => {
    if (msg.post_type === 'embed') {
        const clean = DOMPurify.sanitize(msg.content, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] });
        return <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: clean }} />
    }
    return <p style={{ color: '#111827', lineHeight: '1.6' }}>{msg.content}</p>
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
      
      {/* Main Content Container
          NOTE: We removed the desktop sidebar <nav> from here because it's now in layout.tsx.
          If you want to keep it here for desktop, ensure layout.tsx doesn't double-render it.
          Assuming layout.tsx handles the Sidebar, we focus on the feed here.
      */}
      
      <main style={{ 
        flex: 1, 
        maxWidth: '700px', 
        margin: '0 auto', 
        // CRITICAL MOBILE FIX: Add padding for Notch + Hamburger Button
        paddingTop: isMobile ? 'calc(60px + env(safe-area-inset-top))' : '40px',
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingBottom: '80px' // Space for scrolling past bottom
      }}>
         
         <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '800' }}>{currentFeed.toUpperCase()} FEED</h2>
         
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
                            
                            {/* ACTION BUTTONS: Increased Touch Targets (min 44px) */}
                            <div style={{ marginTop: '15px', display: 'flex', gap: '15px' }}>
                                <button 
                                  onClick={() => handleLike(msg.id, !!isLiked)} 
                                  style={{ 
                                    background: 'none', border: 'none', cursor: 'pointer', 
                                    color: isLiked ? '#ef4444' : '#6b7280',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    minWidth: '44px', minHeight: '44px' // Apple Compliance
                                  }}>
                                  <span style={{ fontSize: '18px' }}>{isLiked ? '❤️' : '🤍'}</span> 
                                  <span style={{ fontWeight: '600' }}>{msg.likes?.length || 0}</span>
                                </button>

                                <button 
                                  onClick={() => toggleComments(msg.id)} 
                                  style={{ 
                                    background: 'none', border: 'none', cursor: 'pointer', 
                                    color: '#6b7280',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    minWidth: '44px', minHeight: '44px' // Apple Compliance
                                  }}>
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
                                        <input 
                                          type="text" 
                                          placeholder="Add a comment..." 
                                          value={commentText[msg.id] || ''} 
                                          onChange={(e) => setCommentText({ ...commentText, [msg.id]: e.target.value })} 
                                          style={{ 
                                            flex: 1, 
                                            padding: '12px', // Larger touch area for input
                                            borderRadius: '8px', 
                                            border: '1px solid #d1d5db',
                                            fontSize: '16px' // PREVENTS iOS ZOOM
                                          }} 
                                        />
                                        <button 
                                          onClick={() => handlePostComment(msg.id)} 
                                          style={{ 
                                            padding: '0 20px', 
                                            backgroundColor: '#6366f1', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            minHeight: '44px' // Apple Compliance
                                          }}>
                                          Send
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
    <Suspense fallback={<div style={{color: '#111827', padding: '20px'}}>Loading...</div>}>
      <MessageBoardContent />
    </Suspense>
  )
}