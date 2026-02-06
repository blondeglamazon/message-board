'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function MessageBoard() {
  // Fixes TypeScript Error 2552 by explicitly defining the state
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function getInitialData() {
      // 1. Get current user session
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // 2. Fetch messages - ensure 'email' is selected to fix "Anonymous" issue
      const { data } = await supabase
        .from('posts')
        .select('id, content, created_at, email, user_id')
        .order('created_at', { ascending: false })
      
      if (data) setMessages(data)
    }

    getInitialData()

    // 3. Real-time subscription
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
        email: user.email, // Explicitly pass email to DB
        user_id: user.id 
      }
    ])

    if (!error) setNewMessage('')
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px' 
      }}>
        <h1 style={{ fontSize: '32px', color: '#111827', margin: 0 }}>💎 VIMciety</h1>
      </header>

      {/* Message Input Section */}
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

      {/* Messages List - Fixed Visibility and Data Mapping */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.map((msg: any) => ( // Fixes TypeScript Error 7006
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              {/* This fix ensures the email from Supabase is displayed instead of "Anonymous" */}
              <span style={{ fontWeight: 'bold', color: '#6366f1', fontSize: '14px' }}>
                {msg.email ? msg.email : 'Anonymous User'}
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