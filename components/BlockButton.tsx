'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'

export default function BlockButton({ userId, username }: { userId: string, username?: string }) {
  const [blocked, setBlocked] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function checkBlockStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      const { data } = await supabase
        .from('blocks')
        .select('*')
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)
        .single()

      if (data) setBlocked(true)
    }
    checkBlockStatus()
  }, [userId, supabase])

  const toggleBlock = async () => {
    if (!currentUserId) return alert("Please login to block users.")

    if (blocked) {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .match({ blocker_id: currentUserId, blocked_id: userId })
        
      if (!error) setBlocked(false)
    } else {
      if (confirm(`Are you sure you want to block ${username || 'this user'}?`)) {
        const { error } = await supabase
            .from('blocks')
            .insert({ blocker_id: currentUserId, blocked_id: userId })
        
        if (!error) {
            setBlocked(true)
            alert("User blocked.")
        }
      }
    }
  }

  if (!currentUserId) return null

 return (
    <button 
      onClick={toggleBlock}
      style={{
        height: '44px', // Apple/Android Compliance (44pt touch target)
        padding: '0 20px',
        borderRadius: '22px', 
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid', // Slightly thicker for better visibility
        
        // IMPROVED CONTRAST LOGIC
        // Blocked (Red/Pink): High contrast red text on light pink
        // Unblocked (Dark): Dark gray border/text to clearly signal "Active"
        borderColor: blocked ? '#374151' : '#b91c1c',
        backgroundColor: blocked ? '#374151' : '#fef2f2',
        color: blocked ? '#ffffff' : '#b91c1c',
        
        transition: 'all 0.2s ease-in-out'
      }}
    >
      {blocked ? 'Unblock User' : 'Block User'}
    </button>
  )}