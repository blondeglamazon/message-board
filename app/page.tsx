'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify' 

function MessageBoardContent() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  
  const [postType, setPostType] = useState<string>('text') 
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Follow System State
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const showCreateModal = searchParams.get('create') === 'true'
  const showSearchModal = searchParams.get('search') === 'true'
  const currentFeed = searchParams.get('feed') || 'global' 
  
  // Load initial search from URL if present
  const urlSearchQuery = searchParams.get('q') || ''

  useEffect(() => {
    // Sync local state with URL query on load
    if (urlSearchQuery) setSearchQuery(urlSearchQuery)
  }, [urlSearchQuery])

  useEffect(() => {
    async function initData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Fetch Admins
      const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
      setAdminIds(new Set(admins?.map(a => a.id) || []))

      if (user) {
        // Fetch Follows
        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
        setFollowingIds(new Set(follows?.map(f => f.following_id) || []))
      }

      // Fetch Posts
      let query = supabase
        .from('posts')
        .select('id, content, created_at, email, user_id, media_url, post_type')
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

      const { data: posts } = await query
      if (posts) setMessages(posts)
    }
    initData()

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        setMessages((prev) => [payload.new, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentFeed]) 

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

  // --- UPDATED SEARCH LOGIC ---
  const handleSearchSubmit = () => {
    // When "Done" is clicked, push the query to the URL so it persists
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push('/')
    }
  }

  const filteredMessages = messages.filter(msg => {
    // 1. If we have a URL query (?q=...), use that. Otherwise use local input.
    const query = urlSearchQuery || searchQuery
    if (!query) return true;
    
    const lowerQ = query.toLowerCase();
    // 2. Search both CONTENT and EMAIL (Username)
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
        const fileExt = mediaFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${fileName}`
        
        const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, mediaFile)
        if (uploadError) throw uploadError
        
        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath)
        publicUrl = data.publicUrl

        // MODERATION HOOK (If you added the API)
        if (type === 'image' || type === 'video') {
            const response = await fetch('/api/moderator', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: publicUrl, type: type })
            });
            const result = await response.json();
            if (!response.ok || !result.safe) {
                await supabase.storage.from('uploads').remove([filePath]);
                throw new Error(result.reason || "Content flagged as inappropriate.");
            }
        }
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
    if (msg.post_type === 'embed') {
        const cleanHTML = DOMPurify.sanitize(msg.content, {
            ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'blockquote', 'ul', 'li', 'br'],
            ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'title', 'allow', 'allowfullscreen', 'frameborder', 'href', 'target', 'class', 'loading'],
            ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
        });
        return <div style={{ marginTop: '10px', overflow: 'hidden', borderRadius: '8px' }} dangerouslySetInnerHTML={{ __html: cleanHTML }} />
    }

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

    return (
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
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      
      {/* HEADER */}
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '32px', color: '#111827', margin: 0 }}>💎 VIMciety</h1>
            {currentFeed !== 'global' && (
                <span style={{ backgroundColor: '#6366f1', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {currentFeed}
                </span>
            )}
            {/* Show active search pill */}
            {urlSearchQuery && (
                 <span style={{ backgroundColor: '#111827', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    🔍 "{urlSearchQuery}" 
                    <button onClick={() => { setSearchQuery(''); router.push('/') }} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0 }}>&times;</button>
                </span>
            )}
        </div>
        
        {user ? (
          <button 
            onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
            style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
          >
            Sign Out
          </button>
        ) : (
          <Link href="/login" style={{ backgroundColor: '#6366f1', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
            Login / Sign Up
          </Link>
        )}
      </header>

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {filteredMessages.length > 0 ? (
           filteredMessages.map((msg: any) => (
             <div key={msg.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{msg.email || 'Anonymous'}</span>
                    
                    {user && user.id !== msg.user_id && (
                        <button 
                            onClick={() => toggleFollow(msg.user_id)}
                            disabled={adminIds.has(msg.user_id)} 
                            style={{ 
                                padding: '2px 8px', fontSize: '10px', borderRadius: '4px', 
                                cursor: adminIds.has(msg.user_id) ? 'not-allowed' : 'pointer', 
                                border: (followingIds.has(msg.user_id) || adminIds.has(msg.user_id)) ? '1px solid #4b5563' : '1px solid #6366f1',
                                backgroundColor: (followingIds.has(msg.user_id) || adminIds.has(msg.user_id)) ? 'transparent' : '#6366f1',
                                color: (followingIds.has(msg.user_id) || adminIds.has(msg.user_id)) ? '#9ca3af' : 'white',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            {adminIds.has(msg.user_id) ? <><span>🔒</span> Admin</> : (followingIds.has(msg.user_id) ? 'Following' : '+ Follow')}
                        </button>
                    )}
                 </div>
                 <span style={{ color: '#888', fontSize: '12px' }}>{new Date(msg.created_at).toLocaleTimeString()}</span>
               </div>
               {renderContent(msg)}
             </div>
           ))
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