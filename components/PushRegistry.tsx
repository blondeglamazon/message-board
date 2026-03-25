'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { usePushNotifications } from '@/hooks/usePushNotifications' // (Adjust path as needed)

export default function PushRegistry() {
  const [supabase] = useState(() => createClient())
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [supabase])

  // Fire the hook!
  usePushNotifications(userId, supabase)

  // This component renders absolutely nothing on the screen
  return null 
}