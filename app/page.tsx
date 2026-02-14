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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentFeed = searchParams.get('feed') || 'global' 
  const urlSearchQuery = searchParams.get('q') || ''

  useEffect(() => {
    if (urlSearchQuery) setSearchQuery(urlSearchQuery)
  }, [urlSearchQuery])

  // --- DATA FETCHING ---
  useEffect(() => {
    async function initData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
      setAdminIds(new Set(admins?.map(a => a.id) || []))

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
      <nav style={{ width: '250px', borderRight: '1px solid #e5e7eb', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: 0, height: '100vh', backgroundColor: '#f9fafb' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900' }}>💎 VIMciety</h1>
        <Link href="/" style={{ textDecoration: 'none', color: '#374151', fontSize: '18px', fontWeight: 'bold' }}>🏠 Home</Link>
        <button onClick={() => router.push('/?feed=following')} style={{ background: 'none', border: 'none', color: '#374151', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}>👣 Following</button>
        <button onClick={() => router.push('/?feed=friends')} style={{ background: 'none', border: 'none', color: '#374151', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}>👥 Friends</button>
        <button onClick={() => router.push('/?search=true')} style={{ background: 'none', border: 'none', color: '#374151', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}>🔍 Search</button>
        <button onClick={() => router.push('/?create=true')} style={{ background: 'none', border: 'none', color: '#374151', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}>➕ Create Post</button>
        <Link href="/profile" style={{ textDecoration: 'none', color: '#374151', fontSize: '18px', fontWeight: 'bold' }}>👤 Profile</Link>
        {user && <button onClick={() => { setHasNewNotifications(false); localStorage.setItem('lastNotificationCheck', new Date().toISOString()); router.push('/notifications') }} style={{ background: 'none', border: 'none', color: hasNewNotifications ? '#ef4444' : '#374151', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}>Notifications</button>}
        <div style={{ flex: 1 }}></div>
        {user ? <button onClick={() => supabase.auth.signOut()} style={{ background: '#e5e7eb', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>Sign Out</button> : <Link href="/login" style={{ backgroundColor: '#6366f1', color: 'white', padding: '10px', borderRadius: '8px', textDecoration: 'none', textAlign: 'center' }}>Login</Link>}
      </nav>

      <main style={{ flex: 1, maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
         <h2 style={{ marginBottom: '20px' }}>{currentFeed.toUpperCase()} FEED</h2>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredMessages.map((msg) => {
                    const profile = profilesMap[msg.user_id]
                    const username = profile?.username || 'Anonymous';
                    const displayName = profile?.display_name || username;
                    const isLiked = user && msg.likes?.some((l: any) => l.user_id === user.id);
                    return (
                        <div key={msg.id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: 'white' }}>
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
                            <div style={{ marginTop: '15px', display: 'flex', gap: '20px' }}>
                                <button onClick={() => handleLike(msg.id, !!isLiked)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? '#ef4444' : '#9ca3af' }}>{isLiked ? '❤️' : '🤍'} {msg.likes?.length || 0}</button>
                                <button onClick={() => toggleComments(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>💬 {msg.comments?.length || 0}</button>
                            </div>
                            {openComments.has(msg.id) && (
                                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                                    {msg.comments?.map((c: any) => (
                                        <div key={c.id} style={{ marginBottom: '5px', fontSize: '14px' }}><strong>{c.email}:</strong> {c.content}</div>
                                    ))}
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <input type="text" placeholder="Comment..." value={commentText[msg.id] || ''} onChange={(e) => setCommentText({ ...commentText, [msg.id]: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
                                        <button onClick={() => handlePostComment(msg.id)} style={{ padding: '8px 15px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '5px' }}>Send</button>
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