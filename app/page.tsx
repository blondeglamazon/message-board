'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'

export default function MessageBoard() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // 1. Get the current logged-in user so we can tag new posts
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // 2. Fetch ALL posts for the home feed (Restores the missing content)
    async function fetchAllPosts() {
      const { data } = await supabase
        .from('posts')
        .select('id, content, created_at, email, user_id') // explicitly selects email
        .order('created_at', { ascending: false })
      
      if (data) setMessages(data)
    }
    fetchAllPosts()

    // 3. Real-time updates (Optional, but keeps the list fresh)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        setMessages((prev) => [payload.new, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handlePost() {
    if (!newMessage.trim() || !user) return

    const { error } = await supabase.from('posts').insert([
      { 
        content: newMessage, 
        email: user.email, 
        user_id: user.id 
      }
    ])

    if (!error) setNewMessage('')
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', color: '#111827', margin: 0 }}>💎 VIMciety</h1>
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
            cursor: 'pointer' 
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
      </div>
    </div>
  )
}