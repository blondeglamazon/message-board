'use client'

import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import DOMPurify from 'isomorphic-dompurify'
import ReportButton from '@/components/ReportButton'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'

// @ts-ignore
import Microlink from '@microlink/react'

const MAX_IMAGE_SIZE_MB = 20;
const MAX_VIDEO_AUDIO_SIZE_MB = 500;

function MessageBoardContent() {
  const [supabase] = useState(() => createClient())
  
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
  
  // Loading State
  const [isLoading, setIsLoading] = useState(true)
  
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ msg, type })
      setTimeout(() => setToast(null), 3000)
  }
  
  // Comments / Interaction State
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({})
  const [openComments, setOpenComments] = useState<Set<string>>(new Set())
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  
  const blockedIdsRef = useRef<string[]>([])
  const [blockedIds, setBlockedIds] = useState<string[]>([])

  const followingIdsRef = useRef<Set<string>>(new Set())
  
  const currentFeed = searchParams.get('feed') || 'global' 
  const urlSearchQuery = searchParams.get('q') || ''
  const isCreate = searchParams.get('create') === 'true'

  // --- PUSH NOTIFICATION SETUP ---
  const setupPushNotifications = async (userId: string, supabaseClient: any) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      if (permStatus.receive !== 'granted') {
        console.log('User denied push permission');
        return; 
      }

      // 🚨 FIX 1: Clear old listeners FIRST
      await PushNotifications.removeAllListeners();

      // 🚨 FIX 2: Set up the trap (listener) to catch the token BEFORE registering
      PushNotifications.addListener('registration', async (token) => {
        console.log('✅ Push token received: ', token.value);
        
        const { error } = await supabaseClient
          .from('push_tokens')
          .upsert({ 
            user_id: userId, 
            token: token.value 
          }, { onConflict: 'token' }); 

        if (error) console.error('Supabase Error saving token:', error);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ Error on registration: ', error);
      });

      // 🚨 FIX 3: NOW ask Google/Apple for the token!
      await PushNotifications.register();

    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  };

  async function buildFeedQuery(authUser: any) {
    let query = supabase
      .from('posts')
      .select(`*, likes ( user_id ), comments ( id, content, email, user_id, created_at )`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (blockedIdsRef.current.length > 0) {
      query = query.not('user_id', 'in', `(${blockedIdsRef.current.join(',')})`)
    }

    if (authUser && currentFeed === 'following') {
      const ids = Array.from(followingIdsRef.current)
      if (ids.length > 0) query = query.in('user_id', ids)
      else query = query.in('user_id', ['00000000-0000-0000-0000-000000000000'])
    } 
    else if (authUser && currentFeed === 'friends') {
      const { data: followsMe } = await supabase.from('followers').select('follower_id').eq('following_id', authUser.id)
      const theirIds = new Set(followsMe?.map(f => f.follower_id) || [])
      const friendIds = Array.from(followingIdsRef.current).filter(id => theirIds.has(id))
      if (friendIds.length > 0) query = query.in('user_id', friendIds)
      else query = query.in('user_id', ['00000000-0000-0000-0000-000000000000'])
    }

    return query
  }

  const handleSharePost = async (postId: string, postUsername: string, postContent: string) => {
    const shareUrl = `https://www.vimciety.com/post/${postId}`;
    const shareData = {
      title: `Post by @${postUsername} | VIMciety`,
      text: postContent ? postContent.substring(0, 100) + '...' : `Check out this post by @${postUsername} on VIMciety!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled by user');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Post link copied to clipboard!');
      } catch (err) {
        showToast('Failed to copy link.', 'error');
      }
    }
  };

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const micInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    return () => { 
      if (mediaPreview) URL.revokeObjectURL(mediaPreview); 
    };
  }, [mediaPreview]);

  useEffect(() => {
    async function initData() {
      setIsLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)

      // 🚨 Trigger Push Registration immediately after authenticating
      if (authUser) {
        setupPushNotifications(authUser.id, supabase);
      }

      const { data: allProfiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url')
      const pMap: Record<string, any> = {}
      allProfiles?.forEach(p => { pMap[p.id] = p })
      setProfilesMap(pMap)

      let myFollowingIds = new Set<string>()
      let myBlockedIds: string[] = []

      if (authUser) {
        const { data: blocks } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', authUser.id)
        myBlockedIds = blocks?.map(b => b.blocked_id) || []
        
        setBlockedIds(myBlockedIds)
        blockedIdsRef.current = myBlockedIds

        const { data: follows } = await supabase.from('followers').select('following_id').eq('follower_id', authUser.id)
        myFollowingIds = new Set(follows?.map(f => f.following_id) || [])
        setFollowingIds(myFollowingIds)
        followingIdsRef.current = myFollowingIds
      }

      const query = await buildFeedQuery(authUser)
      const { data: posts } = await query
      if (posts) setMessages(posts)
      
      setIsLoading(false)
    }
    
    initData()
    
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        const newPostUserId = payload.new.user_id;

        if (blockedIdsRef.current.includes(newPostUserId)) return;

        if (currentFeed === 'following' && newPostUserId !== user?.id) {
          if (!followingIdsRef.current.has(newPostUserId)) return;
        }

        setMessages((prev) => [{ ...payload.new, likes: [], comments: [] }, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentFeed, supabase])


  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
  }

  async function handleFollow(targetUserId: string) {
    if (!user) return showToast("Please login to follow users.", 'error');
    if (user.id === targetUserId) return; 

    const isFollowing = followingIds.has(targetUserId);
    const newFollowing = new Set(followingIds);

    if (isFollowing) {
      newFollowing.delete(targetUserId);
      await supabase.from('followers').delete().match({ follower_id: user.id, following_id: targetUserId });
    } else {
      newFollowing.add(targetUserId);
      await supabase.from('followers').insert({ follower_id: user.id, following_id: targetUserId });
      await supabase.from('notifications').insert({ user_id: targetUserId, actor_id: user.id, type: 'follow' });
    }
    setFollowingIds(newFollowing);
    followingIdsRef.current = newFollowing;
  }

  async function handleLike(postId: string, isLiked: boolean) {
    if (!user) return showToast("Please login to like posts.", 'error')
    setMessages(prev => prev.map(msg => msg.id === postId ? { ...msg, likes: isLiked ? msg.likes.filter((l: any) => l.user_id !== user.id) : [...msg.likes, { user_id: user.id }] } : msg))
    
    if (isLiked) {
      await supabase.from('likes').delete().match({ user_id: user.id, post_id: postId })
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId })
      const targetPost = messages.find(m => m.id === postId);
      if (targetPost && targetPost.user_id !== user.id) { 
        await supabase.from('notifications').insert({ user_id: targetPost.user_id, actor_id: user.id, type: 'like', post_id: postId });
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
    if (!user) return showToast("Please login to comment.", 'error')
    const text = commentText[postId]?.trim()
    if (!text) return
    
    const { data: newComment, error } = await supabase.from('comments').insert({ post_id: postId, user_id: user.id, email: user.email, content: text }).select().single()
    if (error) return showToast("Error: " + error.message, 'error')
    
    setMessages(prev => prev.map(msg => msg.id === postId ? { ...msg, comments: [...(msg.comments || []), newComment] } : msg))
    setCommentText(prev => ({ ...prev, [postId]: '' }))

    const targetPost = messages.find(m => m.id === postId);
    if (targetPost && targetPost.user_id !== user.id) { 
      await supabase.from('notifications').insert({ user_id: targetPost.user_id, actor_id: user.id, type: 'comment', post_id: postId });
    }
  }

 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (!file) { 
        clearFile(); 
        return; 
    }
    
    const isImage = file.type.startsWith('image/');
    const isMedia = file.type.startsWith('video/') || file.type.startsWith('audio/');
    
    const maxSizeMB = isImage ? MAX_IMAGE_SIZE_MB : MAX_VIDEO_AUDIO_SIZE_MB;
    if (file.size > maxSizeMB * 1024 * 1024) {
      showToast(`File too large! Max for this file type is ${maxSizeMB}MB.`, 'error');
      if (e.target) e.target.value = ''; 
      return;
    }

    setMediaFile(file)
    setIsEmbedMode(false)
    
    if (isImage) setPostType('image')
    else if (file.type.startsWith('video/')) setPostType('video')
    else if (file.type.startsWith('audio/')) setPostType('audio')
    else setPostType('file')

    if (mediaPreview) URL.revokeObjectURL(mediaPreview);

    const objectUrl = URL.createObjectURL(file)
    setMediaPreview(objectUrl)
  }

  const clearFile = () => {
    setMediaFile(null)
    if (mediaPreview) URL.revokeObjectURL(mediaPreview)
    setMediaPreview(null)
    setPostType('text')
    
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
            content: newMessage, user_id: user.id, email: user.email, post_type: finalPostType, media_url: publicUrl 
        }])

        setNewMessage('')
        clearFile()
        setIsEmbedMode(false)
        showToast("Post created successfully!")

        const query = await buildFeedQuery(user)
        const { data: updatedPosts } = await query
        if (updatedPosts) setMessages(updatedPosts)

        if (isCreate) router.push('/')

    } catch (e: any) { 
        showToast("Upload Error: " + e.message, 'error') 
    }
    setUploading(false)
  }

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
    if (msg.post_type === 'embed' || (typeof msg.content === 'string' && msg.content.trim().startsWith('<'))) {
      return <div style={{marginTop:'10px', overflow:'hidden', borderRadius:'8px'}}>{renderSafeHTML(msg.content)}</div>;
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = msg.content?.match(urlRegex);
    const firstUrl = urls ? urls[0] : null;

    const renderTextWithLinks = (text: string) => {
      if (!text) return null;
      const parts = text.split(urlRegex);
      return parts.map((part, i) => {
        if (part.match(urlRegex)) return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'underline' }}>{part}</a>;
        return <span key={i}>{part}</span>;
      });
    };

    return (
      <div>
        <div style={{ lineHeight: '1.6', color: '#111827', fontSize: '16px' }}>
          <p style={{ whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word', maxWidth: '100%' }}>
            {renderTextWithLinks(msg.content)}
          </p>
          
          {firstUrl && (
            <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', marginTop: '15px' }}>
                <Microlink url={firstUrl} size="large" style={{ width: '100%', minWidth: 0, borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', color: '#111827' }} />
            </div>
          )}
        </div>

        {msg.media_url && (
          <div style={{ marginTop: '15px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', maxWidth: '100%' }}>
            {msg.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
              <video src={msg.media_url} controls playsInline preload="metadata" style={{ width: '100%', display: 'block' }} />
            ) : msg.media_url.match(/\.(mp3|wav|m4a)$/i) ? (
              <div style={{padding:'20px', background:'#f3f4f6'}}>
                <audio controls src={msg.media_url} preload="metadata" style={{ width: '100%' }} />
              </div>
            ) : (
              <img src={msg.media_url} alt="Post media" loading="lazy" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />
            )}
          </div>
        )}
      </div>
    );
  }

  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      const query = urlSearchQuery
      if (!query) return true;
      const lowerQ = query.toLowerCase();
      const profile = profilesMap[msg.user_id];
      return (msg.content?.toLowerCase().includes(lowerQ) || profile?.username?.toLowerCase().includes(lowerQ) || profile?.display_name?.toLowerCase().includes(lowerQ));
    });
  }, [messages, urlSearchQuery, profilesMap]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      
      {toast && (
          <div style={{
              position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: toast.type === 'error' ? '#ef4444' : '#22c55e',
              color: 'white', padding: '12px 24px',
              borderRadius: '24px', zIndex: 9999, fontWeight: 'bold', fontSize: '14px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', transition: 'opacity 0.3s ease-in-out'
          }}>
              {toast.msg}
          </div>
      )}

      <Sidebar />

      <div style={{ 
        position: 'fixed', top: '20px', right: '20px', 
        zIndex: 100, display: 'flex', gap: '10px' 
      }}>
        {user ? (
          <button onClick={handleSignOut} style={{ 
            minHeight: '44px', padding: '0 20px', borderRadius: '22px', 
            border: '2px solid #111827', backgroundColor: 'white', 
            fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            color: '#111827'
          }}>
            Log Out
          </button>
        ) : (
          <button onClick={() => router.push('/login')} style={{ 
            minHeight: '44px', display:'flex', alignItems:'center', padding: '0 20px', 
            borderRadius: '22px', backgroundColor: 'white', color: '#111827', 
            fontWeight: 'bold', cursor: 'pointer', border: '2px solid #111827',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}>
            Log In
          </button>
        )}
      </div>
      
      <main style={{ 
        maxWidth: '600px', margin: '0 auto', 
        paddingTop: 'calc(20px + env(safe-area-inset-top))',
        paddingLeft: '20px', paddingRight: '20px', paddingBottom: '100px',
        overflowX: 'hidden' 
      }}>
         
         <div style={{ marginBottom: '20px', marginTop: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>{currentFeed.toUpperCase()} FEED</h2>
         </div>

         {user && (
           <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
             <textarea
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               placeholder={isEmbedMode ? "Paste embed code here..." : "What's on your mind?"}
               style={{ 
                  width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db', marginBottom: '15px', minHeight: '80px', backgroundColor: isEmbedMode ? '#1f2937' : '#ffffff', color: isEmbedMode ? '#00ff00' : '#111827', fontSize: '16px', resize: 'none', boxSizing: 'border-box'
               }}
             />
             
             {mediaPreview && (
               <div style={{ marginBottom: '15px', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                 {postType === 'video' ? (
                    <video src={mediaPreview} controls playsInline style={{ width: '100%', display: 'block' }} />
                 ) : postType === 'audio' ? (
                    <div style={{padding:'20px', background:'#f3f4f6'}}><audio controls src={mediaPreview} style={{width:'100%'}} /></div>
                 ) : (
                    <img src={mediaPreview} alt="Preview" style={{ width: '100%', display: 'block' }} />
                 )}
                 <button onClick={clearFile} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
               </div>
             )}

             <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => cameraInputRef.current?.click()} style={{ flex: 1, minHeight: '44px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: '20px' }} title="Camera">📷</button>
                <input type="file" ref={cameraInputRef} onChange={handleFileSelect} accept="image/*,video/*" capture="environment" hidden />

                <button onClick={() => micInputRef.current?.click()} style={{ flex: 1, minHeight: '44px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: '20px' }} title="Microphone">🎤</button>
                <input type="file" ref={micInputRef} onChange={handleFileSelect} accept="audio/*" capture="user" hidden />

                <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, minHeight: '44px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: '20px' }} title="Upload">📁</button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="*/*" hidden />

                <button 
                    onClick={() => setIsEmbedMode(!isEmbedMode)} 
                    style={{ flex: 1, minHeight: '44px', borderRadius: '8px', border: isEmbedMode ? '2px solid #6366f1' : '1px solid #e5e7eb', backgroundColor: isEmbedMode ? '#e0e7ff' : 'white', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                    mb
                </button>

                <button 
                  onClick={handlePost}
                  disabled={uploading}
                  style={{ minHeight: '44px', padding: '0 24px', backgroundColor: uploading ? '#9ca3af' : '#111827', color: 'white', borderRadius: '22px', border: 'none', cursor: uploading ? 'default' : 'pointer', fontWeight: 'bold', marginLeft: 'auto' }}
                >
                  {uploading ? '...' : 'Post'}
                </button>
             </div>
           </div>
         )}

         {/* 👇 NEW APP DOWNLOAD BUTTONS ADDED HERE 👇 */}
         <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', width: '100%' }}>
            <a 
                href="https://play.google.com/store/apps/details?id=com.vimciety.app" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ flex: 1, minWidth: 0, minHeight: '44px', backgroundColor: '#111827', color: 'white', textDecoration: 'none', borderRadius: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
                🤖 Android App
            </a>
            <a 
                href="https://testflight.apple.com/join/87KV8sGZ" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ flex: 1, minWidth: 0, minHeight: '44px', backgroundColor: '#111827', color: 'white', textDecoration: 'none', borderRadius: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
                🍎 iOS App
            </a>
         </div>

         {/* Loading and Empty States */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {isLoading ? (
               <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontWeight: 'bold' }}>Loading feed...</div>
            ) : filteredMessages.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e5e7eb' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '18px', margin: '0 0 10px 0', color: '#111827' }}>No posts yet!</p>
                  <p style={{ margin: 0 }}>{currentFeed !== 'global' ? "Follow more people to see their updates here." : "Be the first one to post something."}</p>
               </div>
            ) : (
                filteredMessages.map((msg) => {
                    const profile = profilesMap[msg.user_id]
                    const username = profile?.username || 'Anonymous';
                    const displayName = profile?.display_name || username;
                    const isLiked = user && msg.likes?.some((l: any) => l.user_id === user.id);
                    
                    return (
                        <div key={msg.id} style={{ padding: '20px', borderRadius: '20px', border: '1px solid #e5e7eb', backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div onClick={() => router.push(`/profile?u=${username}`)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                        <img src={profile?.avatar_url || '/default-avatar.png'} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '15px' }}>{displayName}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(msg.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {user && user.id !== msg.user_id && (
                                        <button onClick={() => handleFollow(msg.user_id)} style={{ padding: '6px 14px', minHeight: '44px', borderRadius: '20px', border: followingIds.has(msg.user_id) ? '1px solid #d1d5db' : 'none', backgroundColor: followingIds.has(msg.user_id) ? 'white' : '#111827', color: followingIds.has(msg.user_id) ? '#374151' : 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                                          {followingIds.has(msg.user_id) ? 'Following' : 'Follow'}
                                        </button>
                                    )}
                                    <ReportButton postId={msg.id} />
                                </div>
                            </div>

                            {renderContent(msg)}
                            
                            <div style={{ marginTop: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <button onClick={() => handleLike(msg.id, !!isLiked)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? '#ef4444' : '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px', padding: '0' }}>
                                  <span style={{ fontSize: '20px' }}>{isLiked ? '❤️' : '🤍'}</span> 
                                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{msg.likes?.length || 0}</span>
                                </button>
                                <button onClick={() => toggleComments(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px', padding: '0' }}>
                                  <span style={{ fontSize: '20px' }}>💬</span> 
                                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{msg.comments?.length || 0}</span>
                                </button>
                                <button onClick={() => handleSharePost(msg.id, username, msg.content)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px', padding: '0', marginLeft: 'auto' }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                  <span style={{ fontWeight: '600', fontSize: '14px' }}>Share</span>
                                </button>
                            </div>

                            {openComments.has(msg.id) && (
                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f3f4f6' }}>
                                    {msg.comments?.map((c: any) => {
                                        const commenter = profilesMap[c.user_id]
                                        return (
                                            <div key={c.id} style={{ marginBottom: '12px', fontSize: '14px', wordBreak: 'break-word' }}>
                                                <span style={{ fontWeight: 'bold', color: '#111827', marginRight: '8px' }}>{commenter?.username || 'User'}</span>
                                                <span style={{ color: '#4b5563' }}>{c.content}</span>
                                            </div>
                                        )
                                    })}
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <input type="text" placeholder="Add a comment..." value={commentText[msg.id] || ''} onChange={(e) => setCommentText({ ...commentText, [msg.id]: e.target.value })} style={{ flex: 1, minWidth: 0, height: '44px', padding: '0 15px', borderRadius: '22px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }} />
                                        <button onClick={() => handlePostComment(msg.id)} style={{ minHeight: '44px', padding: '0 20px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '22px', fontWeight: 'bold', cursor: 'pointer' }}>Post</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })
            )}
         </div>

         <footer style={{ marginTop: '60px', padding: '20px', textAlign: 'center' }}>
            <Link href="/privacy" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>
               Privacy Policy
            </Link>
         </footer>
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