'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function PushRegistry() {
  const [supabase] = useState(() => createClient())
  const [userId, setUserId] = useState<string | null>(null)

  // Boot ping: write immediately on mount, no guards. If this doesn't show up
  // in push_debug_log, the new build isn't actually on the device.
  useEffect(() => {
    supabase
      .from('push_debug_log')
      .insert({
        event: 'PUSH_REGISTRY_MOUNT',
        details: {
          ts: new Date().toISOString(),
          ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        },
      })
      .then(({ error }: any) => {
        if (error) console.error('[PushRegistry] mount ping failed:', error.message)
        else console.log('[PushRegistry] mount ping ok')
      })
  }, [supabase])

  // Fetch initial user AND subscribe to auth changes so account switches propagate
  useEffect(() => {
    const sync = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      // Log the initial user state so we can see it in push_debug_log
      supabase
        .from('push_debug_log')
        .insert({
          event: 'INITIAL_USER',
          user_id: user?.id ?? null,
          details: { hasUser: !!user },
        })
        .then(() => {})
    }
    sync()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id ?? null
      setUserId(newUserId)

      supabase
        .from('push_debug_log')
        .insert({
          event: 'AUTH_STATE_CHANGE',
          user_id: newUserId,
          details: { event, hasSession: !!session },
        })
        .then(() => {})
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  usePushNotifications(userId, supabase)

  return null
}