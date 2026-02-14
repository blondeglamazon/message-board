'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'

export default function PostClientComponent({ slug }: { slug: string }) {
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadPost() {
      if (!slug) return
      
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .eq('id', slug)
        .single()
      
      if (!error) setPost(data)
      setLoading(false)
    }
    loadPost()
  }, [slug, supabase])

  if (loading) return <div style={{ padding: '40px', color: 'white' }}>Loading post...</div>
  if (!post) return <div style={{ padding: '40px', color: 'white' }}>Post not found.</div>

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', color: 'white' }}>
      <Link href="/" style={{ color: '#aaa', display: 'block', marginBottom: '20px' }}>← Back to Feed</Link>
      
      <div style={{ border: '1px solid #333', borderRadius: '12px', padding: '20px', background: '#111' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {post.profiles?.username || 'Anonymous'}
        </div>
        
        <p style={{ fontSize: '18px', lineHeight: '1.5' }}>{post.content}</p>
        
        {post.media_url && (
            <img src={post.media_url} style={{ width: '100%', marginTop: '15px', borderRadius: '8px' }} alt="Post media" />
        )}
      </div>
    </div>
  )
}