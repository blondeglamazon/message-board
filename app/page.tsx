'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify' 

// 1. MAIN CONTENT COMPONENT
function MessageBoardContent() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  
  // Post Types: text, image, video, audio, embed
  const [postType, setPostType] = useState<string>('text') 
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Detect "Create" signal
  const showCreateModal = searchParams.get('create') === 'true'

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    async function fetchMessages() {
      const { data } = await supabase
        .from('posts')
        .select('id, content, created_at, email, user_id, media_url, post_type')
        .order('created_at', { ascending: false })
      
      if (data) setMessages(data)
    }
    fetchMessages()

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        setMessages((prev) => [payload.new, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handlePost() {
    if (!user) {
      alert("You must be logged in to post!")
      return
    }
    if (!newMessage.trim() && !mediaFile) return

    try {
      setUploading(true)
      let publicUrl = null
      let type = postType

      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, mediaFile)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath)
        publicUrl = data.publicUrl
      }

      // Special Check: If Video was selected but user pasted a YouTube link, switch to text (auto-renderer)
      if (type === 'video' && !mediaFile && newMessage.match(/youtube\.com|youtu\.be/)) {
         type = 'text' 
      }

      const { error } = await supabase.from('posts').insert([
        { 
          content: newMessage, 
          email: user.email, 
          user_id: user.id,
          media_url: publicUrl,
          post_type: type
        }
      ])

      if (error) throw error

      setNewMessage('')
      setMediaFile(null)
      setPostType('text')
      router.push('/') 
      
    } catch (error: any) {
      alert("Error posting: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  // Handle Button Clicks in Modal
  const handleOptionClick = (type: string) => {
    setPostType(type)
    setMediaFile(null)
    if (type === 'image' || type === 'video' || type === 'audio') {
        setTimeout(() => fileInputRef.current?.click(), 100)
    }
  }

  const getAcceptType = () => {
      if (postType === 'image') return 'image/*'
      if (postType === 'video') return 'video/*'
      if (postType === 'audio') return 'audio/*'
      return '*'
  }

  const renderContent = (msg: any) => {
    // 1. EMBED / CODE (Canva, etc)
    if (msg.post_type === 'embed') {
        
        // --- SAFETY CONFIGURATION ---
        const cleanHTML = DOMPurify.sanitize(msg.content, {
            // Allow these tags (useful for Canva/Embeds)
            ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'blockquote', 'ul', 'li', 'br'],
            // Allow these attributes (essential for styling/sizing)
            ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'title', 'allow', 'allowfullscreen', 'frameborder', 'href', 'target', 'class', 'loading'],
            // Allow iframes from safe providers
            ADD_TAGS: ['iframe'], 
            ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
        });

        return (
            <div 
                style={{ marginTop: '10px', overflow: 'hidden', borderRadius: '8px' }}
                dangerouslySetInnerHTML={{ __html: cleanHTML }} 
            />
        )
    }

    // 2. REGULAR TEXT (with Auto-Link and YouTube detection)
    const text = msg.content || '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    const textContent = parts.map((part: string, index: number) => {
      if (part.match(urlRegex)) {
        // YouTube Auto-Embed
        const youtubeMatch = part.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (youtubeMatch) {
          return (
            <div key={index} style={{ margin: '15px 0' }}>
              <iframe 
                width="100%" height="300" src={`https://www.youtube.com/embed/${youtubeMatch[1]}`} 
                title="YouTube" frameBorder="0" allowFullScreen style={{ borderRadius: '12px' }}
              ></iframe>
            </div>
          );
        }
        // Standard Clickable Link
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'underline' }}>{part}</a>;
      }
      return <span key={index}>{part}</span>;
    });

    return (
      <div style={{ margin: '0 0 10px 0', color: 'white', lineHeight: '1.5' }}>
        {textContent}
        
        {/* 3. MEDIA UPLOADS */}
        {msg.media_url && (
            <div style={{ marginTop: '10px' }}>
                {msg.post_type === 'image' && (
                    <img src={msg.media_url} alt="Uploaded" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                )}
                {msg.post_type === 'video' && (
                    <video controls src={msg.media_url} style={{ maxWidth: '100%', borderRadius: '8px' }} />
                )}
                {msg.post_type === 'audio' && (
                    <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '10px', fontSize: '20px' }}>🎵</span>
                        <audio controls src={msg.media_url} style={{ width: '100%' }} />
                    </div>
                )}
            </div>
        )}
      </div>
    )
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      
      {/* HEADER */}
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px', color: '#111827', margin: 0 }}>💎 VIMciety</h1>
        {user && (
          <button 
            onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
            style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
          >
            Sign Out
          </button>
        )}
      </header>

      {/* FEED */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.map((msg: any) => (
          <div key={msg.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{msg.email || 'Anonymous User'}</span>
              <span style={{ color: '#888', fontSize: '12px' }}>{new Date(msg.created_at).toLocaleTimeString()}</span>
            </div>
            {renderContent(msg)}
          </div>
        ))}
      </div>

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a', width: '90%', maxWidth: '500px',
            borderRadius: '16px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            border: '1px solid #333'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ color: 'white', margin: 0, fontSize: '20px' }}>Create New Post</h2>
              <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '24px' }}>&times;</Link>
            </div>

            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }} 
                accept={getAcceptType()}
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
            />

            {/* 5 OPTION BUTTONS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
                {/* 1. Text */}
                <button onClick={() => handleOptionClick('text')} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: postType === 'text' ? '#6366f1' : '#333', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '20px' }}>📝</span>
                    <span style={{ fontSize: '10px' }}>Text</span>
                </button>
                {/* 2. Audio */}
                <button onClick={() => handleOptionClick('audio')} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: postType === 'audio' ? '#6366f1' : '#333', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '20px' }}>🎵</span>
                    <span style={{ fontSize: '10px' }}>Audio</span>
                </button>
                {/* 3. Picture */}
                <button onClick={() => handleOptionClick('image')} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: postType === 'image' ? '#6366f1' : '#333', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '20px' }}>📷</span>
                    <span style={{ fontSize: '10px' }}>Picture</span>
                </button>
                {/* 4. Video */}
                <button onClick={() => handleOptionClick('video')} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: postType === 'video' ? '#6366f1' : '#333', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '20px' }}>🎥</span>
                    <span style={{ fontSize: '10px' }}>Video</span>
                </button>
                {/* 5. EMBED (For Canva Code, etc) */}
                <button onClick={() => handleOptionClick('embed')} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: postType === 'embed' ? '#6366f1' : '#333', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '20px' }}>{'</>'}</span>
                    <span style={{ fontSize: '10px' }}>Embed</span>
                </button>
            </div>

            {mediaFile && (
                <div style={{ marginBottom: '15px', color: '#6366f1', fontSize: '14px', textAlign: 'center' }}>
                    File Selected: <strong>{mediaFile.name}</strong>
                </div>
            )}

            <textarea
              style={{ 
                width: '100%', padding: '15px', borderRadius: '10px', backgroundColor: '#333', color: 'white', 
                border: 'none', minHeight: '100px', fontSize: '16px', marginBottom: '20px', resize: 'none'
              }}
              placeholder={
                  postType === 'embed' ? "Paste your Canva/Embed code here..." :
                  postType === 'video' ? "Describe video or paste YouTube link..." :
                  postType === 'audio' ? "Describe your audio..." :
                  "What's on your mind?"
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />

            <button 
              onClick={handlePost}
              disabled={uploading}
              style={{ 
                width: '100%', padding: '14px', backgroundColor: uploading ? '#4b5563' : '#6366f1', 
                color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {uploading ? 'Publishing...' : 'Post Message'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

// 2. WRAPPER FOR BUILD SAFETY
export default function MessageBoard() {
  return (
    <Suspense fallback={<div style={{color: 'white', padding: '20px'}}>Loading...</div>}>
      <MessageBoardContent />
    </Suspense>
  )
}