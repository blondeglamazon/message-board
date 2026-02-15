'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useParams } from 'next/navigation' 
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import BlockButton from '@/components/BlockButton'
import ReportButton from '@/components/ReportButton' 

export default function UserProfile() {
  const supabase = createClient()
  const params = useParams()
  const usernameParam = params?.username as string

  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setCurrentUser(authUser)
      if (!usernameParam) return
      const cleanUsername = decodeURIComponent(usernameParam)

      const { data: profileData } = await supabase.from('profiles').select('*').eq('username', cleanUsername).single()
      
      if (profileData) {
        setProfile(profileData)
        const { data: postsData } = await supabase.from('posts').select('*').eq('user_id', profileData.id).order('created_at', { ascending: false })
        setPosts(postsData || [])

        if (authUser) {
          const { data: followData } = await supabase.from('followers').select('*').eq('follower_id', authUser.id).eq('following_id', profileData.id).single()
          setIsFollowing(!!followData)
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [usernameParam, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const toggleFollow = async () => {
    if (!currentUser || !profile) return
    if (isFollowing) {
      await supabase.from('followers').delete().match({ follower_id: currentUser.id, following_id: profile.id })
      setIsFollowing(false)
    } else {
      await supabase.from('followers').insert({ follower_id: currentUser.id, following_id: profile.id })
      setIsFollowing(true)
    }
  }

  const renderMedia = (mediaUrl: string) => {
    if (!mediaUrl) return null
    const isVideo = mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i)
    return (
      <div style={{ marginTop: '15px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}>
        {isVideo ? (
          <video src={mediaUrl} controls playsInline style={{ width: '100%', display: 'block' }} />
        ) : (
          <img src={mediaUrl} alt="Post content" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />
        )}
      </div>
    )
  }

  const renderSafeHTML = (html: string, isEmbed: boolean = false) => {
    if (!html) return null;
    const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a'],
        ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'frameborder', 'allow', 'allowfullscreen', 'scrolling', 'href', 'target', 'rel']
    })
    return (
      <div style={{ 
        width: '100%', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        marginTop: '15px', 
        border: isEmbed ? 'none' : '2px solid #111827'
      }} 
      dangerouslySetInnerHTML={{ __html: clean }} 
      />
    )
  }

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#111827', fontWeight: 'bold' }}>Loading...</div>
  if (!profile) return <div style={{ padding: '100px', textAlign: 'center', color: '#111827' }}>User not found.</div>

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundImage: profile.background_url ? `url(${profile.background_url})` : 'none',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'
    }}>
      {/* Top Navigation Bar */}
      <div style={{ 
        position: 'fixed', top: 0, width: '100%', height: '60px', 
        backgroundColor: 'rgba(255,255,255,0.9)', borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', zIndex: 100 
      }}>
        {currentUser ? (
          <button onClick={handleSignOut} style={{ height: '40px', padding: '0 15px', borderRadius: '20px', border: '1px solid #111827', backgroundColor: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Log Out</button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/login" style={{ textDecoration: 'none', color: '#111827', fontWeight: 'bold' }}>Log In</Link>
            <Link href="/signup" style={{ textDecoration: 'none', padding: '5px 15px', borderRadius: '15px', backgroundColor: '#111827', color: 'white', fontWeight: 'bold' }}>Sign Up</Link>
          </div>
        )}
      </div>

      <div style={{ 
        maxWidth: '800px', margin: '0 auto', 
        paddingTop: 'calc(80px + env(safe-area-inset-top))', 
        paddingLeft: '20px', paddingRight: '20px', paddingBottom: '100px'
      }}>
        
        {/* Shortened Profile Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '24px', border: '2px solid #111827' }}>
          
          <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginBottom: '10px' }}>
            <img src={profile.avatar_url || '/default-avatar.png'} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: 0 }}>{profile.display_name || profile.username}</h1>
          {profile.bio && <p style={{ marginTop: '5px', color: '#111827', fontSize: '15px', fontWeight: '600' }}>{profile.bio}</p>}

          {profile.music_embed && renderSafeHTML(profile.music_embed)}

          {profile.canva_design_id && renderSafeHTML(`
            <div style="position: relative; width: 100%; height: 0; padding-top: 56.25%; overflow: hidden; border-radius: 12px;">
              <iframe loading="lazy" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none;"
                src="https://www.canva.com/design/${profile.canva_design_id}/view?embed" allowfullscreen="allowfullscreen" allow="fullscreen">
              </iframe>
            </div>
          `, true)}

          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {!isOwnProfile && currentUser && (
                <button onClick={toggleFollow} style={{ height: '44px', padding: '0 20px', borderRadius: '22px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: isFollowing ? '#ffffff' : '#111827', color: isFollowing ? '#111827' : '#ffffff', border: '2px solid #111827' }}>
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              {!isOwnProfile && currentUser && <BlockButton userId={profile.id} username={profile.display_name} />}
              
              {isOwnProfile && (
                <>
                  <Link href="/settings" style={{ textDecoration: 'none', padding: '0 20px', height: '44px', display:'flex', alignItems:'center', backgroundColor: '#111827', color: 'white', borderRadius: '22px', fontSize: '14px', fontWeight: 'bold' }}>Edit Profile</Link>
                  <Link href="/create" style={{ textDecoration: 'none', padding: '0 20px', height: '44px', display:'flex', alignItems:'center', backgroundColor: '#6366f1', color: 'white', borderRadius: '22px', fontSize: '14px', fontWeight: 'bold' }}>+ Post</Link>
                </>
              )}
          </div>
        </div>

        {/* Feed Section - High Contrast #111827 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#111827', textShadow: '0 1px 1px white' }}>Recent Posts</h3>
          {posts.map(post => (
            <div key={post.id} style={{ padding: '20px', borderRadius: '20px', border: '2px solid #111827', backgroundColor: 'rgba(255,255,255,0.95)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                 <span style={{ fontSize: '12px', color: '#111827', fontWeight: '900' }}>{new Date(post.created_at).toLocaleDateString()}</span>
                 {!isOwnProfile && <ReportButton postId={post.id} />}
              </div>
              <p style={{ color: '#111827', fontSize: '16px', margin: 0, lineHeight: '1.4', fontWeight: '500' }}>{post.content}</p>
              {post.media_url && renderMedia(post.media_url)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}