// app/u/[slug]/FollowButton.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase/client'

export default function FollowButton({ 
  profileId, 
  initialIsFollowing, 
  userId 
}: { 
  profileId: string, 
  initialIsFollowing: boolean, 
  userId: string 
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)

  const handleToggle = async () => {
    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: userId, following_id: profileId })
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: userId, following_id: profileId })
      setIsFollowing(true)
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