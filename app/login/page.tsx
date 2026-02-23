'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/')
      }
    }
    checkUser()
  }, [router, supabase])

  // --- OAuth Logic ---
  async function handleSocialLogin(provider: 'google' | 'apple') {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // This ensures the user is sent back to your site after the popup
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      alert(error.message)
      setLoading(false)
    }
  }

  // --- Email/Password Logic ---
  async function handleAuth() {
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        alert('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/')
        router.refresh()
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
      minHeight: '100vh', padding: '20px', backgroundColor: '#f9fafb'
    }}>
      <div style={{ 
        width: '100%', maxWidth: '400px', backgroundColor: 'white', 
        padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
      }}>
        
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

        {/* --- Social Logins Section --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          
          {/* APPLE BUTTON (Required by Apple if Google is present) */}
          <button 
            onClick={() => handleSocialLogin('apple')}
            disabled={loading}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '12px', backgroundColor: '#000000', color: 'white', 
              border: 'none', borderRadius: '8px', fontWeight: '600', 
              cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="white"><path d="M15.111 11.127C15.084 12.836 15.885 14.1 17.658 14.919C16.848 16.143 15.75 17.154 14.346 17.208C13.239 17.253 12.06 16.488 11.232 16.488C10.377 16.488 9.387 17.181 8.442 17.217C6.885 17.271 4.545 15.543 3.321 13.437C1.944 11.052 1.638 8.019 3.123 5.481C4.014 3.969 5.589 3.015 7.155 3.015C8.361 3.015 9.369 3.735 10.224 3.735C11.016 3.735 12.186 2.871 13.626 3.015C14.733 3.069 16.128 3.51 16.992 4.77C16.821 4.887 14.94 5.967 14.913 8.352C14.886 10.512 16.713 11.664 16.731 11.673C16.731 11.673 15.138 11.082 15.111 11.127ZM11.691 1.935C12.384 1.053 12.33 0.234 12.285 0C11.394 0.054 10.422 0.702 9.873 1.359C9.351 1.989 8.91 2.898 9.072 3.69C10.035 3.735 10.989 2.835 11.691 1.935Z"/></svg>
            Continue with Apple
          </button>

          {/* GOOGLE BUTTON */}
          <button 
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '12px', backgroundColor: '#ffffff', color: '#1f2937', 
              border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '600', 
              cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px'
            }}
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="18" height="18" alt="Google" />
            Continue with Google
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
          <span style={{ padding: '0 10px', color: '#9ca3af', fontSize: '13px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
        </div>

        {/* --- Traditional Auth Section --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', color: 'black' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', color: 'black' }}
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