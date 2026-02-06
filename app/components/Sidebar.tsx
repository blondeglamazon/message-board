'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import Link from 'next/link'

export default function Sidebar() {
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
        
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
      }
    }
    getUserData()
  }, [])

  // Smart Links: Default to Home ('/') if not logged in
  const profileLink = user ? '/profile' : '/'
  const followingLink = user ? '/?feed=following' : '/'
  const friendsLink = user ? '/?feed=friends' : '/'

  const renderMainButtonContent = () => {
    if (!user) return <span style={{ fontSize: '20px', fontWeight: 'bold' }}>V</span>
    if (avatarUrl) return <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
    const initial = user.email?.charAt(0).toUpperCase() || 'U'
    return <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{initial}</span>
  }

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: '75px',
      backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column',
      alignItems: 'center', paddingTop: '20px', gap: '30px',
      borderRight: '1px solid #e5e7eb', zIndex: 50
    }}>
      
      {/* 1. PROFILE / BRAND */}
      <Link href={profileLink} style={{ textDecoration: 'none' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          backgroundColor: user ? '#e0e7ff' : '#6366f1',
          color: user ? '#6366f1' : 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: user ? '2px solid #6366f1' : 'none', overflow: 'hidden'
        }}>
          {renderMainButtonContent()}
        </div>
      </Link>

      {/* 2. HOME */}
      <Link href="/">
        <div style={{ cursor: 'pointer', color: '#111827', padding: '10px' }} title="Global Feed">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
           </svg>
        </div>
      </Link>

      {/* 3. FOLLOWING (Users I follow) */}
      <Link href={followingLink}>
        <div style={{ cursor: 'pointer', color: '#111827', padding: '10px' }} title="Following">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
             <circle cx="9" cy="7" r="4"></circle>
             <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
             <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
           </svg>
        </div>
      </Link>

      {/* 4. FRIENDS (Mutual Follows) */}
      <Link href={friendsLink}>
        <div style={{ cursor: 'pointer', color: '#111827', padding: '10px' }} title="Friends (Mutual)">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
           </svg>
        </div>
      </Link>

      {/* 5. SEARCH */}
      <Link href="/?search=true">
        <div style={{ cursor: 'pointer', color: '#111827', padding: '10px' }} title="Search">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
           </svg>
        </div>
      </Link>

      {/* 6. CREATE POST */}
      <Link href="/?create=true">
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
  )
}