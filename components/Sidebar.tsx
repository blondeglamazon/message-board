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
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function getAuthAndProfile() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)

      if (authUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', authUser.id)
          .single()
        setProfile(profileData)
      }
    }
    getAuthAndProfile()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Mobile Policy: Minimum 44x44 touch target & High Contrast
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
    fontWeight: active ? 'bold' : 'normal'
  })

  return (
    <>
      {/* Collapsible Toggle Handle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          left: isOpen ? '75px' : '0', 
          top: 'calc(20px + env(safe-area-inset-top))',
          width: '44px', height: '44px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          zIndex: 60, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', cursor: 'pointer',
          color: '#111827',
          transition: 'left 0.3s ease',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
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
          <Link href={`/u/${profile.username}`} style={{ textDecoration: 'none', marginBottom: '20px', marginTop: '40px' }}>
            <div style={{ 
              width: '44px', height: '44px', borderRadius: '50%', 
              overflow: 'hidden', border: '2px solid #111827',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#f3f4f6'
            }}>
              <img 
                src={profile.avatar_url || '/default-avatar.png'} 
                alt="My Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
          </Link>
        )}

        {/* Navigation Items */}
        <Link href="/"><div style={iconStyle(pathname === '/')}>🏠</div></Link>
        <Link href="/search"><div style={iconStyle(pathname === '/search')}>🔍</div></Link>
        
        {/* RESTORED: Following Button */}
        <Link href="/following"><div style={iconStyle(pathname === '/following')}>👣</div></Link>

        {/* RESTORED: Friends Button */}
        <Link href="/friends"><div style={iconStyle(pathname === '/friends')}>👥</div></Link>
        
        <div style={{ flex: 1 }} />

        {/* Settings */}
        <Link href="/settings"><div style={iconStyle(pathname === '/settings')}>⚙️</div></Link>

        {user && (
          <button 
            onClick={handleSignOut} 
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', 
              padding: '10px', minHeight: '44px', minWidth: '44px', 
              fontSize: '24px', color: '#111827' 
            }}
            title="Sign Out"
          >
            🚪
          </button>
        )}
      </div>
    </>
  )
}