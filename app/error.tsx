'use client' // Error components must ALWAYS be Client Components in Next.js

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // This logs the error to the console (you can later connect this to Sentry or Datadog)
    console.error('VIMciety App Crash Detected:', error)
  }, [error])

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#111827', // Matches your app's dark theme
      color: 'white',
      padding: '20px',
      textAlign: 'center',
      paddingBottom: '10vh' // Slight optical adjustment for mobile screens
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
      
      <h2 style={{ fontSize: '24px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
        Oops! Something went wrong.
      </h2>
      
      <p style={{ color: '#9ca3af', marginBottom: '30px', maxWidth: '400px', lineHeight: '1.5' }}>
        We encountered an unexpected error while trying to load this screen. Don't worry, your data is safe.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '300px' }}>
        {/* The "reset" function attempts to re-render the component that crashed */}
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            padding: '14px 24px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
            minHeight: '48px', // Apple minimum touch target size
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          🔄 Try Again
        </button>

        {/* Fallback escape hatch: send them back to the home feed */}
        <button
          onClick={() => router.push('/')}
          style={{
            backgroundColor: '#374151',
            color: 'white',
            border: '1px solid #4b5563',
            padding: '14px 24px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
            minHeight: '48px'
          }}
        >
          🏠 Return to Feed
        </button>
      </div>
    </div>
  )
}