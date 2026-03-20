'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Capacitor } from '@capacitor/core'
import { SocialLogin } from '@capgo/capacitor-social-login'

// 💸 ADDED: Import RevenueCat to sync user IDs
import { Purchases } from '@revenuecat/purchases-capacitor'

// We wrap the main logic in this component so Next.js doesn't fail the build when using useSearchParams()
function LoginContent() {
  const [supabase] = useState(() => createClient())

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPlatform = Capacitor.getPlatform()

  // 👇 GRAB THE REFERRAL ID FROM THE URL (e.g. ?ref=1234-abcd)
  const referrerId = searchParams.get('ref')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // 1. First useEffect (Check User)
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) router.push('/')
    }
    checkUser()
  }, [router, supabase])

  // --- OAuth Logic ---
  async function handleSocialLogin(provider: 'google' | 'apple') {
    setLoading(true)
    try {
      if (Capacitor.isNativePlatform()) {
        const loginConfig: any = {
          google: {
            webClientId: '733174050338-8eknm8lt8m5fmrbcic8nghjuhttmjh2j.apps.googleusercontent.com',
            iOSClientId: '733174050338-rivgs1aue97ekrnfjui99dsuav762u10.apps.googleusercontent.com',
          }
        };

        if (Capacitor.getPlatform() === 'ios') {
          loginConfig.apple = {};
        }

        await SocialLogin.initialize(loginConfig);

        const authResult = await SocialLogin.login({
          provider,
          options: {
            scopes: provider === 'google' ? ['email', 'profile'] : ['name', 'email'],
          },
        })

        const result = authResult.result as any;
        const idToken = result.idToken || result.identityToken;
        const nonce = result.nonce; 
        
        if (!idToken) throw new Error('Failed to retrieve ID token from device.')

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider,
          token: idToken,
          nonce: nonce, 
        })

        if (error) throw error

        if (data?.session) {
          await supabase.auth.setSession(data.session)
          
          // 💸 ADDED: Tell RevenueCat exactly who just logged in via Social Auth
          if (Capacitor.isNativePlatform() && data.session.user) {
            try {
              await Purchases.logIn({ appUserID: data.session.user.id });
              console.log("✅ Synced Social User with RevenueCat");
            } catch (rcError) {
              console.error("RevenueCat Sync Error:", rcError);
            }
          }
        }

        window.location.href = '/';

      } else {
        // WE ARE ON THE WEB (VERCEL) - KEEP OLD FLOW
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            // Note: Supabase OAuth handles metadata differently. If you want to support referrals 
            // via Google/Apple signups, it usually requires a follow-up trigger in the database.
          },
        })
        if (error) throw error
      }
    } catch (error: any) {
      console.error("Social Login Error:", error)
      showToast(error.message || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  // --- Email/Password Logic ---
  async function handleAuth() {
    setLoading(true)
    try {
      if (isSignUp) {
        // 👇 PASS THE REFERRER ID TO SUPABASE ON SIGNUP
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              referred_by: referrerId ? referrerId : null, 
            }
          }
        })
        if (error) throw error
        showToast('Check your email for the confirmation link!')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        
        // 💸 ADDED: Tell RevenueCat exactly who just logged in via Email
        if (Capacitor.isNativePlatform() && data?.user) {
          try {
            await Purchases.logIn({ appUserID: data.user.id });
            console.log("✅ Synced Email User with RevenueCat");
          } catch (rcError) {
            console.error("RevenueCat Sync Error:", rcError);
          }
        }

        router.push('/')
        router.refresh()
      }
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // --- Password Reset Request ---
  async function handlePasswordReset() {
    if (!email.trim()) return showToast('Please enter your email address.', 'error')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.vimciety.com/auth/callback?next=/reset-password',
      })
      if (error) throw error
      showToast('Password reset link sent! Check your email.')
      setIsForgotPassword(false)
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      minHeight: '100vh', padding: '20px', backgroundColor: '#f9fafb'
    }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#22c55e',
          color: 'white', padding: '12px 24px', borderRadius: '24px', zIndex: 9999,
          fontWeight: 'bold', fontSize: '14px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
          maxWidth: '90%', textAlign: 'center'
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ 
        width: '100%', maxWidth: '400px', backgroundColor: 'white', 
        padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
      }}>
        
        {isForgotPassword ? (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: '8px', color: '#111827' }}>
              Reset Password
            </h2>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
              Enter your email and we'll send you a link to reset your password.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', color: 'black', minHeight: '44px', boxSizing: 'border-box' }}
              />
              <button 
                onClick={handlePasswordReset}
                disabled={loading}
                style={{ 
                  padding: '12px', backgroundColor: '#6366f1', color: 'white', 
                  border: 'none', borderRadius: '8px', fontWeight: 'bold', 
                  cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px',
                  minHeight: '44px', opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={() => setIsForgotPassword(false)}
                style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', fontWeight: '600', minHeight: '44px' }}
              >
                ← Back to Login
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
              <button 
                onClick={() => setIsSignUp(false)}
                style={{ 
                  flex: 1, padding: '10px', border: 'none', background: 'none', 
                  borderBottom: !isSignUp ? '2px solid #6366f1' : 'none',
                  fontWeight: !isSignUp ? 'bold' : 'normal',
                  color: !isSignUp ? '#6366f1' : '#6b7280', cursor: 'pointer',
                  minHeight: '44px'
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
                  color: isSignUp ? '#6366f1' : '#6b7280', cursor: 'pointer',
                  minHeight: '44px'
                }}
              >
                Sign Up
              </button>
            </div>

            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#111827' }}>
              {isSignUp ? 'Create an Account' : 'Welcome Back'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {currentPlatform !== 'android' && (
                <button 
                  onClick={() => handleSocialLogin('apple')}
                  disabled={loading}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    padding: '12px', backgroundColor: '#000000', color: 'white', 
                    border: 'none', borderRadius: '8px', fontWeight: '600', 
                    cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px',
                    minHeight: '44px'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="white"><path d="M15.111 11.127C15.084 12.836 15.885 14.1 17.658 14.919C16.848 16.143 15.75 17.154 14.346 17.208C13.239 17.253 12.06 16.488 11.232 16.488C10.377 16.488 9.387 17.181 8.442 17.217C6.885 17.271 4.545 15.543 3.321 13.437C1.944 11.052 1.638 8.019 3.123 5.481C4.014 3.969 5.589 3.015 7.155 3.015C8.361 3.015 9.369 3.735 10.224 3.735C11.016 3.735 12.186 2.871 13.626 3.015C14.733 3.069 16.128 3.51 16.992 4.77C16.821 4.887 14.94 5.967 14.913 8.352C14.886 10.512 16.713 11.664 16.731 11.673C16.731 11.673 15.138 11.082 15.111 11.127ZM11.691 1.935C12.384 1.053 12.33 0.234 12.285 0C11.394 0.054 10.422 0.702 9.873 1.359C9.351 1.989 8.91 2.898 9.072 3.69C10.035 3.735 10.989 2.835 11.691 1.935Z"/></svg>
                  Continue with Apple
                </button>
              )}
              <button 
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  padding: '12px', backgroundColor: '#ffffff', color: '#1f2937', 
                  border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '600', 
                  cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px',
                  minHeight: '44px'
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', color: 'black', minHeight: '44px', boxSizing: 'border-box' }}
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', color: 'black', minHeight: '44px', boxSizing: 'border-box' }}
              />

              {!isSignUp && (
                <button 
                  onClick={() => setIsForgotPassword(true)}
                  style={{ 
                    background: 'none', border: 'none', color: '#6366f1', 
                    cursor: 'pointer', fontSize: '14px', textAlign: 'right',
                    padding: '0', marginTop: '-8px', fontWeight: '600'
                  }}
                >
                  Forgot Password?
                </button>
              )}

              <button 
                onClick={handleAuth}
                disabled={loading}
                style={{ 
                  padding: '12px', backgroundColor: '#6366f1', color: 'white', 
                  border: 'none', borderRadius: '8px', fontWeight: 'bold', 
                  cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', 
                  marginTop: '10px', minHeight: '44px', opacity: loading ? 0.6 : 1
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
          </>
        )}
      </div>
    </div>
  )
}

// Wrap the main UI in a Suspense boundary for Next.js build safety
export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}