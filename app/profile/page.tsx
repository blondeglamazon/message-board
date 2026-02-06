'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify' 

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Profile Data
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [canvaBg, setCanvaBg] = useState<string>('')
  const [spotifyLink, setSpotifyLink] = useState<string>('')
  
  // Inputs for Editing
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [editMode, setEditMode] = useState(false) // Toggles the "Edit Theme" box
  
  const [userPosts, setUserPosts] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Get Profile Data (Avatar + Background + Spotify)
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, canva_background, spotify_url')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setAvatarUrl(profile.avatar_url)
        setCanvaBg(profile.canva_background || '')
        setSpotifyLink(profile.spotify_url || '')
      }

      // Get Post History
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (posts) setUserPosts(posts)
      setLoading(false)
    }
    getData()
  }, [])

  async function handleSaveProfile() {
    if (!user) return
    try {
      setSaving(true)
      let publicUrl = avatarUrl

      // 1. Upload new Avatar if selected
      if (uploadFile) {
        const fileExt = uploadFile.name.split('.').pop()
        const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, uploadFile)

        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath)
        publicUrl = urlData.publicUrl
      }

      // 2. Save All Data to Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
            id: user.id, 
            avatar_url: publicUrl,
            canva_background: canvaBg,
            spotify_url: spotifyLink,
            updated_at: new Date().toISOString()
        })

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setEditMode(false) // Close the edit box
      alert("Profile updated!")
      setUploadFile(null)

    } catch (error: any) {
      alert("Error updating profile: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function deletePost(postId: string) {
    if (!confirm("Are you sure you want to delete this post?")) return
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) alert(error.message)
    else setUserPosts(userPosts.filter(p => p.id !== postId))
  }

  // --- SAFE RENDERERS ---

  // 1. Render Background (Safe HTML + Fixed Position)
  const renderBackground = () => {
    if (!canvaBg) return null
    const cleanHTML = DOMPurify.sanitize(canvaBg, {
        ALLOWED_TAGS: ['iframe', 'div', 'span'],
        ALLOWED_ATTR: ['src', 'style', 'class', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder'],
        ADD_TAGS: ['iframe']
    })
    return (
        <div 
            style={{ 
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
                zIndex: -1, pointerEvents: 'none', overflow: 'hidden' // pointerEvents: none allows clicking buttons ON TOP of background
            }}
            dangerouslySetInnerHTML={{ __html: cleanHTML }}
        />
    )
  }

  // 2. Render Spotify (Converts standard link to Embed)
  const renderSpotify = () => {
    if (!spotifyLink) return null
    // Auto-convert standard links to embed links if needed
    let embedUrl = spotifyLink
    if (spotifyLink.includes('open.spotify.com') && !spotifyLink.includes('/embed')) {
        embedUrl = spotifyLink.replace('open.spotify.com/', 'open.spotify.com/embed/')
    }
    return (
        <div style={{ marginTop: '15px', width: '100%' }}>
            <iframe 
                style={{ borderRadius: '12px' }} 
                src={embedUrl} 
                width="100%" height="152" 
                frameBorder="0" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy">
            </iframe>
        </div>
    )
  }

  // 3. Render Post Content (Safe HTML for Embeds)
  const renderPostContent = (msg: any) => {
    if (msg.post_type === 'embed') {
        const cleanHTML = DOMPurify.sanitize(msg.content, {
            ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'blockquote', 'ul', 'li', 'br'],
            ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'title', 'allow', 'allowfullscreen', 'frameborder', 'href', 'target', 'class', 'loading'],
            ADD_TAGS: ['iframe'], 
            ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
        });
        return <div style={{ marginTop: '10px', overflow: 'hidden', borderRadius: '8px' }} dangerouslySetInnerHTML={{ __html: cleanHTML }} />
    }
    const text = msg.content || '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return (
      <div style={{ margin: '0 0 10px 0', color: 'white', lineHeight: '1.5' }}>
        {parts.map((part: string, index: number) => {
            if (part.match(urlRegex)) {
                const youtubeMatch = part.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
                if (youtubeMatch) return (
                    <div key={index} style={{ margin: '15px 0' }}>
                      <iframe width="100%" height="300" src={`https://www.youtube.com/embed/${youtubeMatch[1]}`} title="YouTube" frameBorder="0" allowFullScreen style={{ borderRadius: '12px' }}></iframe>
                    </div>
                );
                return <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'underline' }}>{part}</a>;
            }
            return <span key={index}>{part}</span>;
        })}
        {msg.media_url && (
            <div style={{ marginTop: '10px' }}>
                {msg.post_type === 'image' && <img src={msg.media_url} style={{ maxWidth: '100%', borderRadius: '8px' }} />}
                {msg.post_type === 'video' && <video controls src={msg.media_url} style={{ maxWidth: '100%', borderRadius: '8px' }} />}
                {msg.post_type === 'audio' && (
                    <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '10px', fontSize: '20px' }}>🎵</span>
                        <audio controls src={msg.media_url} style={{ width: '100%' }} />
                    </div>
                )}
            </div>
        )}
      </div>
    )
  }

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading profile...</div>

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px', color: '#111827', position: 'relative' }}>
      
      {/* 1. BACKGROUND LAYER */}
      {renderBackground()}

      {/* 2. HEADER */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: '32px', margin: 0, textShadow: canvaBg ? '0 2px 10px rgba(255,255,255,0.8)' : 'none' }}>My Profile</h1>
        <Link href="/" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold', backgroundColor: 'white', padding: '5px 10px', borderRadius: '8px' }}>← Back to Feed</Link>
      </div>

      {/* 3. PROFILE CARD */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '30px', flexWrap: 'wrap' }}>
          
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
             {avatarUrl ? (
               <img src={avatarUrl} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #e0e7ff' }} />
             ) : (
               <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                 {user.email?.charAt(0).toUpperCase()}
               </div>
             )}
          </div>

          {/* Info & Controls */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{user.email}</h2>
            <p style={{ color: '#6b7280', margin: 0 }}>Member since: {new Date(user.created_at).toLocaleDateString()}</p>
            
            {/* EDIT BUTTON */}
            <button 
                onClick={() => setEditMode(!editMode)}
                style={{ marginTop: '15px', backgroundColor: '#4b5563', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
                {editMode ? 'Close Editor' : '🎨 Edit Theme & Photo'}
            </button>

            {/* EDIT FORM (Shows when editMode is true) */}
            {editMode && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '12px' }}>
                    
                    {/* Upload Avatar */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Change Profile Picture:</label>
                        <input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} style={{ fontSize: '14px' }} />
                    </div>

                    {/* Spotify Link */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Spotify Song/Playlist Link:</label>
                        <input 
                            type="text" 
                            placeholder="https://open.spotify.com/track/..." 
                            value={spotifyLink} 
                            onChange={(e) => setSpotifyLink(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                    </div>

                    {/* Canva Embed Code */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Canva Background Embed Code:</label>
                        <textarea 
                            placeholder="Paste your Canva embed code here..." 
                            value={canvaBg} 
                            onChange={(e) => setCanvaBg(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '60px', fontSize: '12px' }}
                        />
                    </div>

                    <button 
                        onClick={handleSaveProfile}
                        disabled={saving}
                        style={{ width: '100%', backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            )}

            {/* SPOTIFY PLAYER (Visible when NOT editing) */}
            {!editMode && renderSpotify()}

          </div>
        </div>
      </div>

      {/* 4. POST HISTORY */}
      <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginBottom: '20px', position: 'relative', zIndex: 1, textShadow: canvaBg ? '0 1px 5px white' : 'none' }}>My Post History</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', zIndex: 1 }}>
        {userPosts.length === 0 ? (
          <p style={{ color: '#666', backgroundColor: 'white', padding: '10px', borderRadius: '8px', display: 'inline-block' }}>You haven't posted anything yet.</p>
        ) : (
          userPosts.map((post) => (
            <div key={post.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', color: 'white', border: '1px solid #333' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                 <span style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(post.created_at).toLocaleString()}</span>
                 <button onClick={() => deletePost(post.id)} style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
               </div>
               {renderPostContent(post)}
            </div>
          ))
        )}
      </div>

    </div>
  )
}