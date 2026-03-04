'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // When the user clicks the email link, Supabase appends a token to the URL.
  // The Supabase client automatically picks it up and creates a session.
  // We listen for the PASSWORD_RECOVERY event to know the session is ready.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    // Also check if we already have a session (user may have refreshed the page)
    async function checkExistingSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setSessionReady(true)
    }
    checkExistingSession()

    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleUpdatePassword() {
    if (!newPassword.trim()) return showToast('Please enter a new password.', 'error')
    if (newPassword.length < 6) return showToast('Password must be at least 6 characters.', 'error')
    if (newPassword !== confirmPassword) return showToast('Passwords do not match.', 'error')

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      showToast('Password updated successfully! Redirecting...')
      setTimeout(() => router.push('/'), 2000)
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
      {/* Toast */}
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
        <h2 style={{ textAlign: 'center', marginBottom: '8px', color: '#111827' }}>
          Set New Password
        </h2>

        {!sessionReady ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              Verifying your reset link...
            </p>
            <p style={{ color: '#9ca3af', fontSize: '13px' }}>
              If this takes more than a few seconds, your link may have expired. 
              <button 
                onClick={() => router.push('/login')}
                style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: '600', fontSize: '13px', padding: '0', marginLeft: '4px' }}
              >
                Request a new one.
              </button>
            </p>
          </div>
        ) : (
          <>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
              Enter your new password below.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="password" 
                placeholder="New Password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', color: 'black', minHeight: '44px', boxSizing: 'border-box' }}
              />
              <input 
                type="password" 
                placeholder="Confirm New Password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', color: 'black', minHeight: '44px', boxSizing: 'border-box' }}
              />
              <button 
                onClick={handleUpdatePassword}
                disabled={loading}
                style={{ 
                  padding: '12px', backgroundColor: '#6366f1', color: 'white', 
                  border: 'none', borderRadius: '8px', fontWeight: 'bold', 
                  cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px',
                  minHeight: '44px', opacity: loading ? 0.6 : 1, marginTop: '5px'
                }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            onClick={() => router.push('/login')}
            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', fontWeight: '600', minHeight: '44px' }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}