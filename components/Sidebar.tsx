'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

export default function Sidebar() {
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // 1. Mobile Detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setIsOpen(true)
      else setIsOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 2. Auth & Profile Data
  useEffect(() => {
    const fetchProfile = async (currentUser: any) => {
      setUser(currentUser)
      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', currentUser.id)
          .single()
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
      } else {
        setAvatarUrl(null)
      }
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      fetchProfile(user)
    }
    init()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      fetchProfile(session?.user || null)
    })

    return () => { authListener.subscription.unsubscribe() }
  }, [supabase])

  // 3. Handle Sign Out
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
    router.refresh()
  }

  const profileLink = user ? '/profile' : '/login'
  const followingLink = user ? '/?feed=following' : '/login'
  const friendsLink = user ? '/?feed=friends' : '/login'

  const renderAvatar = () => {
    if (avatarUrl) return <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
    const letter = user?.email?.charAt(0).toUpperCase() || '?'
    return <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{letter}</span>
  }

  const handleLinkClick = () => {
    if (isMobile) setIsOpen(false)
  }

  // --- STYLES ---
  const sidebarContainerStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: '75px',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 'calc(60px + env(safe-area-inset-top))', 
    paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
    gap: '15px',
    borderRight: '1px solid #e5e7eb',
    zIndex: 50,
    transition: 'transform 0.3s ease-in-out',
    transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
    boxShadow: isMobile && isOpen ? '4px 0 15px rgba(0,0,0,0.1)' : 'none'
  }

  const toggleButtonStyle: React.CSSProperties = {
    position: 'fixed',
    top: 'calc(15px + env(safe-area-inset-top))', 
    left: '15px',
    zIndex: 60,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    minWidth: '44px',
    minHeight: '44px',
    display: isMobile ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 40,
    display: isMobile && isOpen ? 'block' : 'none'
  }

  const linkStyle = { 
    color: '#111827', padding: '10px', minWidth: '44px', minHeight: '44px', 
    display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer' 
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button onClick={() => setIsOpen(!isOpen)} style={toggleButtonStyle} aria-label="Toggle Menu">
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        )}
      </button>

      <div style={overlayStyle} onClick={() => setIsOpen(false)} />

      <div style={sidebarContainerStyle}>
        
        {/* --- MAIN NAVIGATION (Top) --- */}

        <Link href={profileLink} onClick={handleLinkClick}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: user ? '#e0e7ff' : '#6366f1',
            color: user ? '#6366f1' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: user ? '2px solid #6366f1' : 'none', overflow: 'hidden'
          }}>
            {renderAvatar()}
          </div>
        </Link>

        <Link href="/" onClick={handleLinkClick} title="Global Feed">
          <div style={{...linkStyle, color: pathname === '/' ? '#6366f1' : '#111827'}}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </div>
        </Link>

        {user && (
          <Link href="/notifications" onClick={handleLinkClick} title="Notifications">
            <div style={{...linkStyle, color: pathname === '/notifications' ? '#6366f1' : '#111827'}}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
          </Link>
        )}

        <Link href={followingLink} onClick={handleLinkClick} title="Following">
          <div style={linkStyle}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
        </Link>

        <Link href={friendsLink} onClick={handleLinkClick} title="Friends">
          <div style={linkStyle}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
        </Link>

        <Link href="/?search=true" onClick={handleLinkClick} title="Search">
          <div style={linkStyle}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </Link>

        <Link href="/?create=true" onClick={handleLinkClick} title="Create Post">
          <div style={{ 
            color: '#6366f1', border: '2px solid #6366f1', borderRadius: '8px', 
            width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </div>
        </Link>

        {/* Spacer to push bottom items down */}
        <div style={{ flex: 1 }} />

        {/* --- BOTTOM ACTIONS (Settings & Auth) --- */}

        {/* SETTINGS (Required for Legal) */}
        <Link href="/settings" onClick={handleLinkClick} title="Settings & Legal">
          <div style={{...linkStyle, color: pathname === '/settings' ? '#6366f1' : '#6b7280'}}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </div>
        </Link>

        {/* AUTH BUTTON (Sign Out / Login) */}
        {user ? (
          <button onClick={handleSignOut} title="Sign Out" style={{ ...linkStyle, border: 'none', background: 'none' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        ) : (
          <Link href="/login" onClick={handleLinkClick} title="Login">
            <div style={{ ...linkStyle, color: '#10b981' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
            </div>
          </Link>
        )}

      </div>
    </>
  )
}