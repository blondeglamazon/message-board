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
        // Fetch the profile to get the avatar_url
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
        
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url)
        }
      }
    }
    getUserData()
  }, [])

  // LOGIC: Where should the main button go?
  // If logged in -> Go to Profile. If logged out -> Go to Home.
  const mainButtonLink = user ? '/profile' : '/'

  // LOGIC: What should the main button look like?
  const renderMainButtonContent = () => {
    if (!user) {
      // 1. Logged Out: Show "V" Logo
      return <span style={{ fontSize: '20px', fontWeight: 'bold' }}>V</span>
    }
    if (avatarUrl) {
      // 2. Logged In & Has Photo: Show Photo
      return (
        <img 
          src={avatarUrl} 
          alt="Profile" 
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
        />
      )
    }
    // 3. Logged In & No Photo: Show First Letter of Email
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
      
      {/* --- SMART PROFILE / BRAND BUTTON --- */}
      <Link href={mainButtonLink} style={{ textDecoration: 'none' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          backgroundColor: user ? '#e0e7ff' : '#6366f1', // Light purple if user, Dark purple if logo
          color: user ? '#6366f1' : 'white',             // Colored text if user, White text if logo
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: user ? '2px solid #6366f1' : 'none',
          overflow: 'hidden'
        }}>
          {renderMainButtonContent()}
        </div>
      </Link>

      {/* Home Icon */}
      <Link href="/">
        <div style={{ cursor: 'pointer', color: '#111827', padding: '10px' }} title="Home">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
             <polyline points="9 22 9 12 15 12 15 22"></polyline>
           </svg>
        </div>
      </Link>

      {/* Search Icon - Triggers Search Modal */}
      <Link href="/?search=true">
        <div style={{ cursor: 'pointer', color: '#111827', padding: '10px' }} title="Search">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <circle cx="11" cy="11" r="8"></circle>
             <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
           </svg>
        </div>
      </Link>

      {/* Create Post Icon (Plus) */}
      <Link href="/?create=true">
        <div style={{ 
          cursor: 'pointer', color: '#6366f1', border: '2px solid #6366f1', borderRadius: '8px', 
          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px'
        }} title="Create Post">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <line x1="12" y1="5" x2="12" y2="19"></line>
             <line x1="5" y1="12" x2="19" y2="12"></line>
           </svg>
        </div>
      </Link>

    </div>
  )
}