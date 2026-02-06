'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function MessageBoard() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    async function fetchMessages() {
      const { data, error } = await supabase
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
      let type = 'text'

      // 1. Upload Image logic
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
        type = 'image'
      }

      // 2. Save Post
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
      
    } catch (error: any) {
      alert("Error posting: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  // Helper function to detect Links and YouTube Videos
  const renderContent = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const youtubeMatch = part.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (youtubeMatch) {
          return (
            <div key={index} style={{ margin: '15px 0' }}>
              <iframe 
                width="100%" 
                height="300" 
                src={`https://www.youtube.com/embed/${youtubeMatch[1]}`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                style={{ borderRadius: '12px' }}
              ></iframe>
            </div>
          );
        }
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'underline' }}>
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', color: '#111827', margin: '0 0 20px 0' }}>💎 VIMciety</h1>
        
        {loading ? (
          <p style={{ color: '#666' }}>Loading user...</p>
        ) : user ? (
          <div style={{ 
            backgroundColor: '#d1fae5', color: '#065f46', padding: '10px', borderRadius: '8px', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'
          }}>
            <span>Logged in as: <strong>{user.email}</strong></span>
            <button 
              onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
              style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
             <p style={{ color: 'red', marginBottom: '10px' }}>You are not logged in.</p>
             <button onClick={() => router.push('/login')} style={{ backgroundColor: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Go to Login Page</button>
          </div>
        )}
      </header>

      {/* Input Area - NOW HAS ID for Sidebar Navigation */}
      <div id="create-post" style={{ marginBottom: '40px', backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px' }}>
        <textarea
          style={{ 
            width: '100%', padding: '15px', borderRadius: '10px', backgroundColor: '#333', color: 'white', 
            border: 'none', minHeight: '80px', fontSize: '16px', marginBottom: '15px'
          }}
          placeholder="Write a message or paste a YouTube link..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        
        {/* Post Options */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '10px' }}>
          <label style={{ color: '#ccc', fontSize: '14px' }}>Attach Image:</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
            style={{ color: 'white' }}
          />
        </div>

        <button 
          onClick={handlePost}
          disabled={uploading}
          style={{ 
            width: '100%', padding: '12px', backgroundColor: uploading ? '#4b5563' : '#6366f1', 
            color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? 'Uploading...' : 'Post Message'}
        </button>
      </div>

      {/* Message List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.map((msg: any) => (
          <div key={msg.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{msg.email || 'Anonymous User'}</span>
              <span style={{ color: '#888', fontSize: '12px' }}>{new Date(msg.created_at).toLocaleTimeString()}</span>
            </div>
            
            <div style={{ margin: '0 0 10px 0', color: 'white', lineHeight: '1.5' }}>
              {renderContent(msg.content)}
            </div>
            
            {msg.post_type === 'image' && msg.media_url && (
              <img 
                src={msg.media_url} 
                alt="User upload" 
                style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px' }} 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}