'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function MessageBoard() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 1. Get Current User
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    // 2. Fetch Messages
    async function fetchMessages() {
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, created_at, email, user_id')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching posts:', error)
      } else if (data) {
        setMessages(data)
      }
    }
    fetchMessages()

    // 3. Real-time Subscription
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
    if (!newMessage.trim()) return

    const { error } = await supabase.from('posts').insert([
      { 
        content: newMessage, 
        email: user.email, 
        user_id: user.id 
      }
    ])

    if (error) {
      alert("Error posting: " + error.message)
    } else {
      setNewMessage('')
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', color: '#111827', margin: '0 0 20px 0' }}>💎 VIMciety</h1>
        
        {/* User Status Bar */}
        {loading ? (
          <p style={{ color: '#666' }}>Loading user...</p>
        ) : user ? (
          <div style={{ 
            backgroundColor: '#d1fae5', 
            color: '#065f46', 
            padding: '10px', 
            borderRadius: '8px', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
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
             <button 
               onClick={() => router.push('/login')}
               style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
             >
               Go to Login Page
             </button>
          </div>
        )}
      </header>

      {/* Input Area */}
      <div style={{ marginBottom: '40px' }}>
        <textarea
          style={{ 
            width: '100%', 
            padding: '15px', 
            borderRadius: '10px', 
            backgroundColor: '#1a1a1a', 
            color: 'white', 
            border: '1px solid #333', 
            minHeight: '100px',
            fontSize: '16px' 
          }}
          placeholder="Write a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button 
          onClick={handlePost}
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: '#6366f1', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            marginTop: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            opacity: user ? 1 : 0.5 
          }}
        >
          Post Message
        </button>
      </div>

      {/* Message List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.map((msg: any) => (
          <div 
            key={msg.id} 
            style={{ 
              backgroundColor: '#1a1a1a', 
              padding: '20px', 
              borderRadius: '12px', 
              border: '1px solid #333',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#6366f1', fontSize: '14px' }}>
                {msg.email || 'Anonymous User'}
              </span>
              <span style={{ color: '#888', fontSize: '12px' }}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p style={{ margin: 0, color: 'white', lineHeight: '1.5' }}>{msg.content}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666' }}>No posts found.</p>
        )}
      </div>
    </div>
  )
}