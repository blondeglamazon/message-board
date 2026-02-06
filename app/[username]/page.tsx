'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'

export default function MessageBoard() {
  // Fix: Initialize the 'messages' state correctly to resolve TypeScript error 2552
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    async function fetchMessages() {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) setMessages(data)
    }
    fetchMessages()
  }, [])

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', color: '#111827' }}>💎 VIMciety</h1>
      </header>

      {/* Message List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.map((msg: any) => ( // Fix: Added 'any' type to resolve error 7006
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
              {/* This span makes the user email visible with a bright blue color */}
              <span style={{ fontWeight: 'bold', color: '#6366f1', fontSize: '14px' }}>
                {msg.email || 'Anonymous User'}
              </span>
              <span style={{ color: '#888', fontSize: '12px' }}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
            
            <p style={{ margin: 0, color: 'white', lineHeight: '1.5' }}>
              {msg.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}