'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
// ✅ CORRECTED IMPORT: Now points to the shared components folder
import FollowButton from '@/components/FollowButton'

export default function UserClientComponent({ username }: { username: string }) {
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      if (!username) return

      // 1. Get Current User
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // 2. Fetch Profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .maybeSingle()

      if (error || !profileData) {
        setLoading(false)
        return
      }
      setProfile(profileData)

      // 3. Fetch Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })
      
      setPosts(postsData || [])

      // 4. Check Follow Status
      if (user) {
        const { data: followData } = await supabase
          .from('followers')
          .select('*')
          .match({ follower_id: user.id, following_id: profileData.id })
          .maybeSingle()
        setIsFollowing(!!followData)
      }

      setLoading(false)
    }

    loadData()
  }, [username, supabase])

  // 👇 ADDED SHARE LOGIC: Profile Share
  const handleShareProfile = async () => {
    const shareUrl = `https://www.vimciety.com/u/${username}`;
    const shareData = {
      title: `${profile?.display_name || username} | VIMciety`,
      text: `Check out @${username}'s profile on VIMciety!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing profile:', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Profile link copied to clipboard!');
    }
  };

  // 👇 ADDED SHARE LOGIC: Specific Post Share
  const handleSharePost = async (postId: string, postContent: string) => {
    const shareUrl = `https://www.vimciety.com/u/${username}?post=${postId}`;
    const shareData = {
      title: `Post by @${username} | VIMciety`,
      text: postContent ? postContent.substring(0, 100) + '...' : `Check out this post by @${username} on VIMciety!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing post:', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Post link copied to clipboard!');
    }
  };

  const renderSafeHTML = (html: string) => {
      if (!html) return null;
      const clean = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'br', 'strong', 'em', 'b', 'i', 'ul', 'li'],
          ALLOWED_ATTR: [
            'src', 'width', 'height', 'style', 'title', 'class', 'id',
            'allow', 'allowfullscreen', 'frameborder', 'scrolling', 
            'loading', 'referrerpolicy'
          ],
          ADD_TAGS: ['iframe', 'link']
      })
      return <div dangerouslySetInnerHTML={{ __html: clean }} />
  }

  if (loading) return <div style={{ padding: 40, color: 'white', backgroundColor: '#111827', minHeight: '100vh' }}>Loading profile...</div>

  if (!profile) {
    return (
      <div style={{ padding: 40, color: 'white', textAlign: 'center', backgroundColor: '#111827', minHeight: '100vh' }}>
        <h1>Profile Not Found</h1>
        <p>The user @{username} does not exist.</p>
        <Link href="/" style={{ color: '#aaa', textDecoration: 'underline' }}>Return Home</Link>
      </div>
    )
  }

  const memberSince = profile.created_at 
    ? new Date(profile.created_at).toLocaleDateString() 
    : 'Unknown'

  const isEmbedBackground = profile.background_url && profile.background_url.trim().startsWith('<');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', backgroundColor: '#111827', color: 'white' }}>
        
        {/* === BACKGROUND LAYER === */}
        <div style={{ 
            position: 'fixed', 
            top: 0, left: 0, width: '100%', height: '100%', 
            zIndex: 0, 
            overflow: 'hidden',
            pointerEvents: 'none' 
        }}>
            {isEmbedBackground ? (
                <div style={{ width: '100%', height: '100%', opacity: 0.6 }}> 
                    {renderSafeHTML(profile.background_url)}
                </div>
            ) : (
                <div style={{ 
                    width: '100%', height: '100%', 
                    backgroundImage: profile.background_url ? `url(${profile.background_url})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center'
                }} />
            )}
        </div>

        {/* === CONTENT LAYER === */}
        <div style={{ 
            position: 'relative', 
            zIndex: 1, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            minHeight: '100vh', 
            padding: '20px' 
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <Link href="/" style={{ padding: '8px 16px', backgroundColor: 'white', borderRadius: '6px', textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
                        ← Back
                    </Link>
                </header>

                <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '30px', marginBottom: '30px', color: '#111827' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                (profile.display_name || profile.username)?.[0]?.toUpperCase()
                            )}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>
                                {profile.display_name || profile.username}
                            </h2>
                            <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px' }}>@{profile.username}</p>
                            <p style={{ margin: '5px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>Member since: {memberSince}</p>
                            
                            <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {/* Follow Button */}
                                {currentUser && currentUser.id !== profile.id && (
                                    <FollowButton 
                                        profileId={profile.id} 
                                        userId={currentUser.id} 
                                        initialIsFollowing={isFollowing} 
                                    />
                                )}

                                {/* 👇 ADDED SHARE BUTTON: Profile */}
                                <button 
                                  onClick={handleShareProfile} 
                                  style={{ padding: '6px 16px', backgroundColor: '#e5e7eb', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                  Share Profile
                                </button>
                            </div>
                        </div>
                    </div>

                    {profile.bio && <p style={{ color: '#374151', fontStyle: 'italic', borderLeft: '3px solid #6366f1', paddingLeft: '10px' }}>"{profile.bio}"</p>}

                    {profile.music_embed && (
                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px', marginTop: '15px' }}>
                            <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase', fontWeight: 'bold' }}>Featured Music</p>
                            {renderSafeHTML(profile.music_embed)}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {posts.map(post => (
                        <div key={post.id} style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', color: 'white', border: '1px solid #374151' }}>
                            <div style={{fontSize: '12px', color: '#9ca3af', marginBottom: '8px', display:'flex', justifyContent:'space-between'}}>
                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                            
                            {post.post_type === 'embed' ? renderSafeHTML(post.content) : <p style={{lineHeight: 1.5}}>{post.content}</p>}
                            
                            {post.media_url && post.post_type === 'image' && <img src={post.media_url} style={{maxWidth:'100%', borderRadius:'8px', marginTop:'10px'}} />}
                            {post.media_url && post.post_type === 'video' && <video controls src={post.media_url} style={{maxWidth:'100%', borderRadius:'8px', marginTop:'10px'}} />}
                            
                            {/* 👇 ADDED SHARE BUTTON: Post */}
                            <div style={{ borderTop: '1px solid #374151', marginTop: '15px', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => handleSharePost(post.id, post.content)} 
                                  style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: '500' }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                  Share
                                </button>
                            </div>
                        </div>
                    ))}
                    {posts.length === 0 && (
                        <div style={{ color: '#9ca3af', textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>No posts to show.</div>
                    )}
                </div>
            </div>
        </div>
    </div>
  )
}