'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'

// @ts-ignore
import Microlink from '@microlink/react'

export default function PostRedirect({ id }: { id: string }) {
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadPost() {
      if (!id) return
      
      const { data, error } = await supabase
        .from('posts')
        // 👇 Added display_name to match your feed's schema
        .select('*, profiles(username, display_name, avatar_url)')
        .eq('id', id) 
        .single()
      
      if (!error) setPost(data)
      setLoading(false)
    }
    loadPost()
  }, [id, supabase])

  // --- REUSED FROM HOME PAGE FOR CONSISTENCY ---
  const renderSafeHTML = (html: string) => {
    if (!html) return null;
    const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'br', 'strong', 'em', 'b', 'i', 'ul', 'li', 'link'],
        ALLOWED_ATTR: [
          'src', 'width', 'height', 'style', 'frameborder', 'allow', 
          'allowfullscreen', 'scrolling', 'href', 'target', 'rel', 
          'title', 'class', 'id', 'loading', 'referrerpolicy',
          'data-url', 'data-image', 'data-description' 
        ],
        ADD_TAGS: ['iframe']
    })
    return <div style={{ width: '100%', overflow: 'hidden', marginTop: '10px', borderRadius: '12px' }} dangerouslySetInnerHTML={{ __html: clean }} />
  }

  const renderContent = (msg: any) => {
    if (msg.post_type === 'embed' || (typeof msg.content === 'string' && msg.content.trim().startsWith('<'))) {
      return <div style={{marginTop:'10px', overflow:'hidden', borderRadius:'8px'}}>{renderSafeHTML(msg.content)}</div>;
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = msg.content?.match(urlRegex);
    const firstUrl = urls ? urls[0] : null;

    const renderTextWithLinks = (text: string) => {
      if (!text) return null;
      const parts = text.split(urlRegex);
      return parts.map((part, i) => {
        if (part.match(urlRegex)) return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'underline' }}>{part}</a>;
        return <span key={i}>{part}</span>;
      });
    };

    return (
      <div>
        <div style={{ lineHeight: '1.6', color: '#111827', fontSize: '16px' }}>
          <p style={{ whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word', maxWidth: '100%' }}>
            {renderTextWithLinks(msg.content)}
          </p>
          
          {firstUrl && (
            <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', marginTop: '15px' }}>
                <Microlink url={firstUrl} size="large" style={{ width: '100%', minWidth: 0, borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', color: '#111827' }} />
            </div>
          )}
        </div>

        {msg.media_url && (
          <div style={{ marginTop: '15px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', maxWidth: '100%' }}>
            {msg.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
              <video src={msg.media_url} controls playsInline preload="metadata" style={{ width: '100%', display: 'block' }} />
            ) : msg.media_url.match(/\.(mp3|wav|m4a)$/i) ? (
              <div style={{padding:'20px', background:'#f3f4f6'}}>
                <audio controls src={msg.media_url} preload="metadata" style={{ width: '100%' }} />
              </div>
            ) : (
              <img src={msg.media_url} alt="Post media" loading="lazy" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />
            )}
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div aria-live="polite" style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontWeight: 'bold' }}>Loading post...</div>
  if (!post) return <div role="alert" style={{ padding: '40px', textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>Post not found.</div>

  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const username = profile?.username || 'Anonymous';
  const displayName = profile?.display_name || username;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingTop: '40px' }}>
        
        <nav aria-label="Breadcrumb">
            <Link href="/" style={{ color: '#6b7280', display: 'inline-block', marginBottom: '20px', textDecoration: 'none', fontWeight: 'bold' }}>
            ← Back to Feed
            </Link>
        </nav>
        
        <article style={{ border: '1px solid #e5e7eb', borderRadius: '20px', padding: '20px', backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            
            <header style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    <img src={profile?.avatar_url || '/default-avatar.png'} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                    <h1 style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                        {displayName}
                    </h1>
                    {post.created_at && (
                        <time dateTime={post.created_at} style={{ color: '#6b7280', fontSize: '12px' }}>
                        {new Date(post.created_at).toLocaleDateString()}
                        </time>
                    )}
                </div>
            </header>
            
            {/* Render the post exactly like the home feed does! */}
            {renderContent(post)}
            
        </article>
        </main>
    </div>
  )
}