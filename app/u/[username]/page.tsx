'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useParams } from 'next/navigation' 
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import BlockButton from '@/components/BlockButton'
import CanvaButton from '@/components/CanvaButton'
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

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanUsername)
        .single()
      
      if (profileData) {
        setProfile(profileData)
        
        // Fetch Posts
        const { data: postsData } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', profileData.id)
            .order('created_at', { ascending: false })
        setPosts(postsData || [])

        // Fetch Following Status
        if (authUser) {
          const { data: followData } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', authUser.id)
            .eq('following_id', profileData.id)
            .single()
          setIsFollowing(!!followData)
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [usernameParam, supabase])

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

  const renderSafeHTML = (html: string) => {
    if (!html) return null;
    const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['iframe', 'div', 'p', 'span'],
        ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'frameborder', 'allow', 'allowfullscreen', 'scrolling']
    })
    return <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', marginTop: '20px' }} dangerouslySetInnerHTML={{ __html: clean }} />
  }

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#111827', fontWeight: 'bold' }}>Loading profile...</div>
  if (!profile) return <div style={{ padding: '100px', textAlign: 'center', color: '#111827' }}>User not found.</div>

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div style={{ 
      maxWidth: '600px', margin: '0 auto', 
      paddingTop: 'calc(60px + env(safe-area-inset-top))', 
      paddingLeft: '20px', paddingRight: '20px', paddingBottom: '80px'
    }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        {/* Avatar */}
        <div style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '15px' }}>
          <img src={profile.avatar_url || '/default-avatar.png'} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Display Name Only (Handle Removed per request) */}
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: 0 }}>
          {profile.display_name || profile.username}
        </h1>

        {profile.bio && (
          <p style={{ marginTop: '15px', color: '#111827', fontSize: '16px', lineHeight: '1.6' }}>{profile.bio}</p>
        )}

        {/* Music Embeds Restored */}
        {profile.music_embed && renderSafeHTML(profile.music_embed)}

        {/* Action Buttons */}
        <div style={{ marginTop: '25px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            
            {/* Follow Button - High Contrast */}
            {!isOwnProfile && currentUser && (
              <button onClick={toggleFollow} style={{
                height: '44px', padding: '0 24px', borderRadius: '22px', fontWeight: 'bold', cursor: 'pointer',
                backgroundColor: isFollowing ? '#ffffff' : '#111827',
                color: isFollowing ? '#111827' : '#ffffff',
                border: '2px solid #111827'
              }}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}

            {profile.canva_design_id && <CanvaButton designId={profile.canva_design_id} />}
            
            {!isOwnProfile && currentUser && (
                <BlockButton userId={profile.id} username={profile.display_name || profile.username} />
            )}

            {isOwnProfile && (
                <Link href="/settings" style={{ textDecoration: 'none', padding: '0 24px', height: '44px', display:'flex', alignItems:'center', backgroundColor: '#111827', color: 'white', borderRadius: '22px', fontSize: '14px', fontWeight: 'bold' }}>
                    Edit Profile
                </Link>
            )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '2px solid #111827', margin: '35px 0' }} />

      {/* Feed Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Recent Posts</h3>
        {posts.length === 0 ? (
           <p style={{ textAlign: 'center', color: '#111827', fontStyle: 'italic', padding: '20px' }}>No posts yet.</p>
        ) : (
          posts.map(post => (
            <div key={post.id} style={{ padding: '24px', borderRadius: '16px', border: '2px solid #111827', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                 <span style={{ fontSize: '12px', color: '#111827', fontWeight: 'bold' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                 </span>
                 {!isOwnProfile && <ReportButton postId={post.id} />}
              </div>
              <p style={{ color: '#111827', fontSize: '16px', margin: 0, lineHeight: '1.5' }}>{post.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}