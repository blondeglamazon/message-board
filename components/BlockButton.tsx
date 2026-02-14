'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'

export default function BlockButton({ userId }: { userId: string }) {
  const [blocked, setBlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkBlockStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('blocks')
        .select('*')
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)
        .single()

      if (data) setBlocked(true)
      setLoading(false)
    }
    checkBlockStatus()
  }, [userId, supabase])

  const toggleBlock = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert("Please login to block users.")

    setLoading(true)
    if (blocked) {
      await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', userId)
      setBlocked(false)
    } else {
      if (confirm("Block this user? You will no longer see their posts in your feed.")) {
        await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: userId })
        setBlocked(true)
        window.location.reload() // Refresh to clear the feed of their posts
      }
    }
    setLoading(false)
  }

  if (loading) return null

  return (
    <button 
      onClick={toggleBlock}
      style={{
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        border: '1px solid #ef4444',
        backgroundColor: blocked ? '#ef4444' : 'transparent',
        color: blocked ? 'white' : '#ef4444'
      }}
    >
      {blocked ? 'Unblock User' : 'Block User'}
    </button>
  )
}