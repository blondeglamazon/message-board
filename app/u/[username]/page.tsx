'use client'
import { useState, useEffect, use } from 'react' // Added 'use'
import { supabase } from '@/app/lib/supabase/client'

export default function Page({ params }: { params: Promise<{ username: string }> }) {
  // Unwrap params safely for Next.js 15
  const { username } = use(params)
  
  const [debugError, setDebugError] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function load() {
      // 1. We look for the user
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username) // Case-insensitive search
        .single()

      if (error) {
        console.error("Supabase Error:", error)
        setDebugError(error) // Show error on screen
      } else {
        setProfile(data)
      }
    }
    load()
  }, [username])

  if (debugError) {
    return (
      <div className="p-10 text-white bg-red-900">
        <h2 className="text-xl font-bold">Database Error</h2>
        <pre className="mt-4 bg-black p-4 rounded">
          {JSON.stringify(debugError, null, 2)}
        </pre>
        <p className="mt-4">
          <strong>Code:</strong> {debugError.code} <br/>
          <strong>Message:</strong> {debugError.message} <br/>
          <strong>Hint:</strong> {debugError.hint || 'No hint'}
        </p>
      </div>
    )
  }

  if (!profile) return <div className="p-10 text-white">Loading or Not Found...</div>

  return (
    <div className="p-10 text-white">
      <h1 className="text-2xl font-bold">Success!</h1>
      <p>Found user: {profile.username}</p>
      <p>ID: {profile.id}</p>
    </div>
  )
}