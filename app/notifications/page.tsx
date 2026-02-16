'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // 1. Fetch Notifications
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!actor_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setNotifications(data)
        
        // 2. NEW: Mark Unread Notifications as Read
        const unreadIds = data.filter((n: any) => !n.is_read).map((n: any) => n.id)
        
        if (unreadIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds)
          
          // Refresh the router to ensure any server components or layouts know about the change
          router.refresh()
        }
      }
      
      if (error) console.error("Error fetching notifications:", error)
      setLoading(false)
    }

    loadNotifications()
  }, [supabase, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getMessage = (type: string) => {
    if (type === 'like') return 'liked your post.'
    if (type === 'comment') return 'commented on your post.'
    if (type === 'follow') return 'started following you.'
    return 'interacted with you.'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', paddingLeft: '75px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px', color: '#111827' }}>Notifications</h1>

        {loading ? (
           <p style={{ color: '#6b7280' }}>Loading updates...</p>
        ) : notifications.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
             No notifications yet.
           </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map((n) => (
              <div key={n.id} style={{ 
                  display: 'flex', alignItems: 'center', gap: '15px', 
                  padding: '15px', borderRadius: '12px', 
                  backgroundColor: n.is_read ? '#ffffff' : '#f0f9ff', // Subtle blue tint for unread/just read
                  border: n.is_read ? '1px solid #e5e7eb' : '1px solid #bfdbfe',
                  transition: 'background 0.2s'
              }}>
                <Link href={`/u/${n.actor?.username}`} style={{ textDecoration: 'none' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#e5e7eb', flexShrink: 0 }}>
                    {n.actor?.avatar_url ? (
                      <img src={n.actor.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#6b7280' }}>
                        {(n.actor?.display_name || n.actor?.username)?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>

                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: '#111827', fontSize: '14px' }}>
                    <span style={{ fontWeight: 'bold' }}>{n.actor?.display_name || n.actor?.username}</span> {getMessage(n.type)}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>
                    {formatDate(n.created_at)}
                  </p>
                </div>

                {n.post_id && (
                  <Link href={`/p/${n.post_id}`} style={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}