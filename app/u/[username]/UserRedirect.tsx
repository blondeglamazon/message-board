'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function UserRedirectContent({ username }: { username: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (username === 'placeholder') {
      router.replace('/')
      return
    }
    const postId = searchParams.get('post')
    if (postId) {
      router.replace(`/?post=${postId}`)
    } else {
      router.replace(`/profile?u=${username}`)
    }
  }, [username, searchParams, router])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
      <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading profile...</p>
    </div>
  )
}

export default function UserRedirect({ username }: { username: string }) {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><p>Loading...</p></div>}>
      <UserRedirectContent username={username} />
    </Suspense>
  )
}