'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import Link from 'next/link'

export default function Sidebar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
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
    getProfile()
  }, [])

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: '75px',
      backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column',
      alignItems: 'center', paddingTop: '20px', gap: '30px',
      borderRight: '1px solid #e5e7eb', zIndex: 50
    }}>
      {/* Brand / Home Link */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          backgroundColor: '#6366f1', color: 'white', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px'
        }}>
          V
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

      {/* Create Post Icon */}
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

      {/* USER PROFILE AVATAR (At Bottom) */}
      <div style={{ marginTop: 'auto', marginBottom: '30px' }}>
        <Link href="/profile">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Profile" 
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} 
            />
          ) : (
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#d1d5db',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563'
            }}>
              👤
            </div>
          )}
        </Link>
      </div>

    </div>
  )
}