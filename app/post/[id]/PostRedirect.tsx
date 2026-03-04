'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PostRedirect({ id }: { id: string }) {
  const router = useRouter()

  useEffect(() => {
    if (id && id !== 'placeholder') {
      router.replace(`/?post=${id}`)
    } else {
      router.replace('/')
    }
  }, [id, router])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
      <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading post...</p>
    </div>
  )
}