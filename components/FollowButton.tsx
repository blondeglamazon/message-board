'use client'

import { useState } from 'react'
// 1. Change import to createClient
import { createClient } from '@/app/lib/supabase/client'

interface FollowButtonProps {
  profileId: string
  initialIsFollowing: boolean
  userId: string
}

export default function FollowButton({ profileId, initialIsFollowing, userId }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  // 2. Initialize supabase
  const supabase = createClient()

  const handleToggle = async () => {
    if (isFollowing) {
      const { error } = await supabase.from('follows').delete().match({ follower_id: userId, following_id: profileId })
      if (!error) setIsFollowing(false)
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: userId, following_id: profileId })
      if (!error) setIsFollowing(true)
    }
  }

  return (
    <button
      onClick={handleToggle}
      style={{
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: isFollowing ? '#374151' : '#6366f1',
        color: 'white',
        cursor: 'pointer',
        marginTop: '8px',
      }}
    >
      {isFollowing ? 'Following' : '+ Follow'}
    </button>
  )
}