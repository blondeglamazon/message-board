'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'

export default function DeleteAccountPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requestSent, setRequestSent] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase])

  const handleRequest = () => {
    // In a static export, we can't delete the user record directly from the client 
    // for security reasons. Instead, we instruct them or trigger a support flow.
    setRequestSent(true)
  }

  if (loading) return <div className="p-8 text-white">Loading...</div>

  return (
    <div className="max-w-xl mx-auto p-8 text-gray-100 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-red-500">Delete Your Account</h1>
      
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
        <p className="mb-4 leading-relaxed">
          We are sorry to see you go. Deleting your account is **permanent**:
        </p>
        <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-400">
          <li>Your profile and username will be removed.</li>
          <li>All your posts and media will be permanently deleted.</li>
          <li>This action cannot be undone.</li>
        </ul>

        {user ? (
          <div className="space-y-4">
            <p className="text-sm">Logged in as: <span className="text-blue-400 font-mono">{user.email}</span></p>
            
            {!requestSent ? (
              <button 
                onClick={handleRequest}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
              >
                Confirm Deletion Request
              </button>
            ) : (
              <div className="p-4 bg-green-900/30 border border-green-800 text-green-400 rounded-lg text-sm">
                <strong>Request Received.</strong> To finalize your account deletion, please send a brief email from <strong>{user.email}</strong> to <a href="mailto:support@vimciety.com" className="underline">support@vimciety.com</a>. This ensures you are the true owner of the account.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="mb-4">Please log in to request deletion, or contact us directly:</p>
            <a 
              href="mailto:support@vimciety.com" 
              className="inline-block bg-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
            >
              Email Support
            </a>
          </div>
        )}
      </div>

      <div className="mt-8 text-center space-x-4">
        <Link href="/" className="text-gray-500 hover:text-white underline text-sm">Back to Home</Link>
        <Link href="/settings" className="text-gray-500 hover:text-white underline text-sm">Settings</Link>
      </div>
    </div>
  )
}