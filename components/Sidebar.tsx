'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function Sidebar() {
  const [supabase] = useState(() => createClient()) 
  
  const pathname = usePathname()
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(true)

  // 1. Handle Screen Resize (Responsive Logic)
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setIsOpen(false) 
    }

    checkScreenSize()
    
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // 2. Auto-close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile])

  // 3. Data Fetching & Realtime
  useEffect(() => {
    let mounted = true

    async function getData() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!mounted) return
      
      setUser(authUser)

      if (authUser) {
        // Get Profile - ADDED THE NEW STORE AND CALENDAR URLS HERE
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, avatar_url, calendly_url, google_calendar_url, store_url')
          .eq('id', authUser.id)
          .single()
        
        if (mounted) setProfile(profileData)

        // Get Unread Notifications Count
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .eq('is_read', false)
        
        if (mounted) setUnreadCount(count || 0)

        // Realtime Subscription
        const channel = supabase
          .channel('realtime_notifications')
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${authUser.id}` 
          }, 
            (payload) => {
               setUnreadCount((prev) => prev + 1)
            }
          )
          .subscribe()

        return () => { supabase.removeChannel(channel) }
      }
    }

    getData()
    
    return () => { mounted = false }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Styles
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
    transition: 'all 0.2s',
    fontWeight: active ? 'bold' : 'normal',
    position: 'relative' as 'relative',
    backgroundColor: active ? '#f3f4f6' : 'transparent', 
    borderRadius: '8px',
    margin: '4px 0'
  })

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '0px',
    right: '0px',
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold',
    height: '16px',
    minWidth: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid white'
  }

  const sidebarTransform = isMobile 
    ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') 
    : 'translateX(0)'

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: isMobile ? 'flex' : 'none',
          position: 'fixed', 
          left: isOpen ? '75px' : '0', 
          top: 'calc(20px + env(safe-area-inset-top))',
          width: '30px', 
          height: '44px', 
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb', 
          borderLeft: 'none', 
          borderRadius: '0 8px 8px 0',
          zIndex: 60, 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '14px', 
          cursor: 'pointer', 
          color: '#111827', 
          transition: 'left 0.3s ease',
          boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
        }}
        aria-label={isOpen ? "Close Sidebar" : "Open Sidebar"}
      >
        {isOpen ? '◀' : '▶'}
      </button>

      <div style={{
        position: 'fixed', 
        left: 0, 
        top: 0, 
        bottom: 0, 
        width: '75px',
        backgroundColor: '#ffffff', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        padding: 'calc(20px + env(safe-area-inset-top)) 0 20px 0',
        borderRight: '1px solid #e5e7eb', 
        zIndex: 50,
        transform: sidebarTransform,
        transition: 'transform 0.3s ease',
        boxShadow: (isMobile && isOpen) ? '4px 0 12px rgba(0,0,0,0.1)' : 'none'
      }}>
        
        {user && profile && (
          <Link href={`/u/${profile.username}`} style={{ marginBottom: '20px', marginTop: '10px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              overflow: 'hidden', 
              border: '2px solid #e5e7eb',
              padding: '2px' 
            }}>
              <img 
                src={profile.avatar_url || '/default-avatar.png'} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
              />
            </div>
          </Link>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link href="/"><div style={iconStyle(pathname === '/')}>🏠</div></Link>
          <Link href="/search"><div style={iconStyle(pathname === '/search')}>🔍</div></Link>
          <Link href="/following"><div style={iconStyle(pathname === '/following')}>👣</div></Link>
          <Link href="/friends"><div style={iconStyle(pathname === '/friends')}>👥</div></Link>
          
          <Link href="/notifications">
              <div style={iconStyle(pathname === '/notifications')}>
                  🔔
                  {unreadCount > 0 && <span style={badgeStyle}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </div>
          </Link>

          {/* ----- SELLER / BUSINESS ICONS ADDED HERE ----- */}
          
          {/* Scheduling Icon */}
          {(profile?.calendly_url || profile?.google_calendar_url) && (
            <a 
              href={profile.calendly_url || profile.google_calendar_url} 
              target="_blank" 
              rel="noopener noreferrer"
              title="Book an Appointment"
              style={iconStyle(false)}
            >
              📅
            </a>
          )}

          {/* Store / Shop Icon */}
          {profile?.store_url && (
            <a 
              href={profile.store_url} 
              target="_blank" 
              rel="noopener noreferrer"
              title="Visit My Store"
              style={iconStyle(false)}
            >
              🛍️
            </a>
          )}
        </div>
        
        <div style={{ flex: 1 }} />
        
        <Link href="/settings"><div style={iconStyle(pathname === '/settings')}>⚙️</div></Link>

        {user && (
          <button 
            onClick={handleSignOut} 
            title="Sign Out"
            style={{ ...iconStyle(false), border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            🚪
          </button>
        )}
      </div>
    </>
  )
}