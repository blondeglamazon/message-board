'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function Sidebar() {
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function getData() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)

      if (authUser) {
        // 1. Get Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', authUser.id)
          .single()
        setProfile(profileData)

        // 2. Get Unread Notifications Count
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .eq('is_read', false)
        
        setUnreadCount(count || 0)
      }
    }
    getData()
    
    // Realtime Subscription: Update badge instantly when new notifications arrive
    const channel = supabase
      .channel('realtime_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        (payload) => {
          if (payload.new.user_id === user?.id) {
             setUnreadCount((prev) => prev + 1)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, user?.id])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Mobile Policy: 44px minimum touch target
  const iconStyle = (active: boolean) => ({
    color: active ? '#6366f1' : '#111827',
    fontSize: '24px',
    padding: '10px',
    minHeight: '44px', 
    minWidth: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    transition: 'color 0.2s',
    fontWeight: active ? 'bold' : 'normal',
    position: 'relative' as 'relative' // Needed for the badge positioning
  })

  // Badge Style for Counter
  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '5px',
    right: '5px',
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold',
    height: '18px',
    minWidth: '18px',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    border: '2px solid white'
  }

  return (
    <>
      {/* Toggle Button (Mobile) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', left: isOpen ? '75px' : '0', top: 'calc(20px + env(safe-area-inset-top))',
          width: '44px', height: '44px', backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb', borderLeft: 'none', borderRadius: '0 8px 8px 0',
          zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', cursor: 'pointer', color: '#111827', transition: 'left 0.3s ease'
        }}
        aria-label={isOpen ? "Close Sidebar" : "Open Sidebar"}
      >
        {isOpen ? '◀' : '▶'}
      </button>

      {/* Sidebar Container */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: '75px',
        backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: 'calc(20px + env(safe-area-inset-top)) 0 20px 0',
        borderRight: '1px solid #e5e7eb', zIndex: 50,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        boxShadow: isOpen ? '4px 0 12px rgba(0,0,0,0.1)' : 'none'
      }}>
        
        {/* Avatar */}
        {user && profile && (
          <Link href={`/u/${profile.username}`} style={{ marginBottom: '20px', marginTop: '40px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #111827' }}>
              <img src={profile.avatar_url || '/default-avatar.png'} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </Link>
        )}

        <Link href="/"><div style={iconStyle(pathname === '/')}>🏠</div></Link>
        <Link href="/search"><div style={iconStyle(pathname === '/search')}>🔍</div></Link>
        <Link href="/following"><div style={iconStyle(pathname === '/following')}>👣</div></Link>
        <Link href="/friends"><div style={iconStyle(pathname === '/friends')}>👥</div></Link>
        
        {/* RESTORED: Notifications Button with Counter */}
        <Link href="/notifications">
            <div style={iconStyle(pathname === '/notifications')}>
                🔔
                {unreadCount > 0 && <span style={badgeStyle}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </div>
        </Link>
        
        <div style={{ flex: 1 }} />
        <Link href="/settings"><div style={iconStyle(pathname === '/settings')}>⚙️</div></Link>

        {user && (
          <button onClick={handleSignOut} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px', minHeight: '44px', minWidth: '44px', fontSize: '24px', color: '#111827' }}>🚪</button>
        )}
      </div>
    </>
  )
}