'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'

export default function MessageBoard() {
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    async function fetchAllPosts() {
      // Selecting all posts without filters to restore the home feed
      const { data } = await supabase
        .from('posts')
        .select('id, content, created_at, email, user_id') 
        .order('created_at', { ascending: false })
      
      if (data) setMessages(data)
    }
    fetchAllPosts()
  }, [])

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', color: '#111827' }}>💎 VIMciety</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.map((msg: any) => (
          <div 
            key={msg.id} 
            style={{ 
              backgroundColor: '#1a1a1a', 
              padding: '20px', 
              borderRadius: '12px', 
              border: '1px solid #333'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#6366f1' }}>
                {/* This fixes the "Anonymous" issue by ensuring email is used */}
                {msg.email || 'Anonymous User'}
              </span>
              <span style={{ color: '#888', fontSize: '12px' }}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p style={{ margin: 0, color: 'white' }}>{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}