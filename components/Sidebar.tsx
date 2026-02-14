'use client'

import { useState, useEffect } from 'react'
// 1. UPDATE IMPORT
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  // 2. INITIALIZE CLIENT
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  const pathname = usePathname()

  // 1. Handle Window Resize (Mobile Detection)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsOpen(true) // Always open on desktop
      } else {
        setIsOpen(false) // Closed by default on mobile
      }
    }

    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 2. Fetch User Data
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
    // Added supabase to dependency array to satisfy linter
  }, [supabase])

  const profileLink = user ? '/profile' : '/'
  // Fixed logic for links to ensure they work with the feed filter
  const followingLink = user ? '/?feed=following' : '/'
  const friendsLink = user ? '/?feed=friends' : '/'

  const renderMainButtonContent = () => {
    if (!user) return <span style={{ fontSize: '20px', fontWeight: 'bold' }}>V</span>
    if (avatarUrl) return <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
    const initial = user.email?.charAt(0).toUpperCase() || 'U'
    return <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{initial}</span>
  }

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed', 
    left: 0, 
    top: 0, 
    bottom: 0, 
    width: '75px',
    backgroundColor: '#ffffff', 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    paddingTop: '60px',
    gap: '25px',
    borderRight: '1px solid #e5e7eb', 
    zIndex: 50,
    transition: 'transform 0.3s ease-in-out',
    transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
    boxShadow: isMobile && isOpen ? '2px 0 10px rgba(0,0,0,0.1)' : 'none'
  }

  return (
    <>
      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'fixed',
            top: '15px',
            left: '15px',
            zIndex: 60,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        >
          {isOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
      )}

      <div style={sidebarStyle}>
        
        <Link href={profileLink} style={{ textDecoration: 'none' }} onClick={() => isMobile && setIsOpen(false)}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: user ? '#e0e7ff' : '#6366f1',
            color: user ? '#6366f1' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: user ? '2px solid #6366f1' : 'none', overflow: 'hidden',
            transition: 'all 0.2s ease'
          }}>
            {renderMainButtonContent()}
          </div>
        </Link>

        <Link href="/" onClick={() => isMobile && setIsOpen(false)}>
          <div style={{ cursor: 'pointer', color: pathname === '/' ? '#6366f1' : '#111827', padding: '10px' }} title="Global Feed">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
             </svg>
          </div>
        </Link>

        {user && (
          <Link href="/notifications" onClick={() => isMobile && setIsOpen(false)}>
            <div style={{ cursor: 'pointer', color: pathname === '/notifications' ? '#6366f1' : '#111827', padding: '10px' }} title="Notifications">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
               </svg>
            </div>
          </Link>
        )}

        <Link href={followingLink} onClick={() => isMobile && setIsOpen(false)}>
          <div style={{ cursor: 'pointer', color: '#111827', padding: '10px' }} title="Following">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
               <circle cx="9" cy="7" r="4"></circle>
               <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
               <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
             </svg>
          </div>
        </Link>

        <Link href={friendsLink} onClick={() => isMobile && setIsOpen(false)}>
          <div style={{ cursor: 'pointer', color: '#111827', padding: '10px' }} title="Friends (Mutual)">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
             </svg>
          </div>
        </Link>

        <Link href="/?search=true" onClick={() => isMobile && setIsOpen(false)}>
          <div style={{ cursor: 'pointer', color: '#111827', padding: '10px' }} title="Search">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
             </svg>
          </div>
        </Link>

        <Link href="/?create=true" onClick={() => isMobile && setIsOpen(false)}>
          <div style={{ 
            cursor: 'pointer', color: '#6366f1', border: '2px solid #6366f1', borderRadius: '8px', 
            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px'
          }} title="Create Post">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
             </svg>
          </div>
        </Link>

      </div>
    </>
  )
}