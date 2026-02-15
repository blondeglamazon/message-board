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

  useEffect(() => {
    async function getAuth() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
    }
    getAuth()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Mobile Policy: Minimum 44x44 touch target
  const iconStyle = (active: boolean) => ({
    color: active ? '#6366f1' : '#111827',
    fontSize: '24px',
    padding: '12px',
    minHeight: '44px', 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    transition: 'color 0.2s',
    fontWeight: active ? 'bold' : 'normal'
  })

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: '75px',
      backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: 'calc(60px + env(safe-area-inset-top)) 0 20px 0',
      borderRight: '1px solid #e5e7eb', zIndex: 50
    }}>
      {/* Navigation Items */}
      <Link href="/"><div style={iconStyle(pathname === '/')}>🏠</div></Link>
      <Link href="/search"><div style={iconStyle(pathname === '/search')}>🔍</div></Link>
      <Link href="/friends"><div style={iconStyle(pathname === '/friends')}>👥</div></Link>
      
      <div style={{ flex: 1 }} />

      {/* Settings & Compliance */}
      <Link href="/settings"><div style={iconStyle(pathname === '/settings')}>⚙️</div></Link>

      {user && (
        <button 
          onClick={handleSignOut} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '12px', minHeight: '44px', fontSize: '24px' }}
        >
          🚪
        </button>
      )}
    </div>
  )
}