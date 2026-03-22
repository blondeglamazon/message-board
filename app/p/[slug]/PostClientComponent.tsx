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
      
      // Ensure your database column is actually named 'slug'. 
      // If it's named 'id', change this line to: .eq('id', slug)
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .eq('slug', slug) 
        .single()
      
      if (!error) setPost(data)
      setLoading(false)
    }
    loadPost()
  }, [slug, supabase])

  if (loading) return <div aria-live="polite" style={{ padding: '40px', color: 'white' }}>Loading post...</div>
  
  if (!post) return <div role="alert" style={{ padding: '40px', color: 'white' }}>Post not found.</div>

  const username = post.profiles?.username || 'Anonymous'

  return (
    <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', color: 'white' }}>
      <nav aria-label="Breadcrumb">
        <Link href="/" style={{ color: '#aaa', display: 'inline-block', marginBottom: '20px' }}>
          ← Back to Feed
        </Link>
      </nav>
      
      <article style={{ border: '1px solid #333', borderRadius: '12px', padding: '20px', background: '#111' }}>
        
        <header style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '16px', margin: 0 }}>
            {username}
          </h1>
          {post.created_at && (
            <time dateTime={post.created_at} style={{ color: '#888', fontSize: '14px' }}>
              • {new Date(post.created_at).toLocaleDateString()}
            </time>
          )}
        </header>
        
        <p style={{ fontSize: '18px', lineHeight: '1.5', margin: '10px 0' }}>
          {post.content}
        </p>
        
        {post.media_url && (
          <figure style={{ margin: 0, marginTop: '15px' }}>
            <img 
              src={post.media_url} 
              style={{ width: '100%', borderRadius: '8px' }} 
              alt={`Post media uploaded by ${username}`} 
              loading="lazy" 
            />
          </figure>
        )}
      </article>
    </main>
  )
}