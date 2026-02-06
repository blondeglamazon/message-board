'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false) // Toggle between Login and Sign Up
  const router = useRouter()

  // Check if already logged in
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/')
      }
    }
    checkUser()
  }, [])

  async function handleAuth() {
    setLoading(true)
    try {
      if (isSignUp) {
        // --- SIGN UP ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        alert('Check your email for the confirmation link!')
      } else {
        // --- SIGN IN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/') // Go to Home on success
        router.refresh() // Force refresh to update Sidebar
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      minHeight: '80vh', padding: '20px' 
    }}>
      <div style={{ 
        width: '100%', maxWidth: '400px', backgroundColor: 'white', 
        padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
      }}>
        
        {/* Header / Toggle */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <button 
            onClick={() => setIsSignUp(false)}
            style={{ 
              flex: 1, padding: '10px', border: 'none', background: 'none', 
              borderBottom: !isSignUp ? '2px solid #6366f1' : 'none',
              fontWeight: !isSignUp ? 'bold' : 'normal',
              color: !isSignUp ? '#6366f1' : '#6b7280', cursor: 'pointer'
            }}
          >
            Login
          </button>
          <button 
            onClick={() => setIsSignUp(true)}
            style={{ 
              flex: 1, padding: '10px', border: 'none', background: 'none', 
              borderBottom: isSignUp ? '2px solid #6366f1' : 'none',
              fontWeight: isSignUp ? 'bold' : 'normal',
              color: isSignUp ? '#6366f1' : '#6b7280', cursor: 'pointer'
            }}
          >
            Sign Up
          </button>
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#111827' }}>
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h2>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px' }}
          />

          <button 
            onClick={handleAuth}
            disabled={loading}
            style={{ 
              padding: '12px', backgroundColor: '#6366f1', color: 'white', 
              border: 'none', borderRadius: '8px', fontWeight: 'bold', 
              cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', marginTop: '10px'
            }}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  )
}