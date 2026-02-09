import { createClient } from '@/app/lib/supabase/server'
import FollowButton from './FollowButton'
import { notFound } from 'next/navigation'

interface Profile {
  id: string
  username: string
  email: string
  avatar_url?: string
  bio?: string
  homepage_slug: string
  is_public?: boolean
}

interface UserProfilePageProps {
  params: Promise<{ slug: string }>
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  // 1. Await params (CRITICAL for Next.js 15)
  const { slug } = await params
  const supabase = await createClient()

  // 2. Fetch profile with case-insensitive search
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('homepage_slug', slug) // .ilike matches 'User' to 'user'
    .maybeSingle()

  // 3. Handle 404 or Private Profiles
  if (error || !profile || profile.is_public === false) {
    console.error("Profile Load Error:", error)
    return (
      <div style={{ padding: 40, color: 'white', textAlign: 'center' }}>
        <h1>Profile Not Found</h1>
        <p>This profile does not exist or is set to private.</p>
      </div>
    )
  }

  // 4. Fetch posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  // 5. Get Current User (for Follow Button)
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  let isFollowing = false
  if (currentUser) {
    const { data: followData } = await supabase
      .from('follows')
      .select('*')
      .match({ follower_id: currentUser.id, following_id: profile.id })
      .maybeSingle()
    isFollowing = !!followData
  }

  return (
    <div style={{ padding: 40, color: 'white', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {profile.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt={profile.username} 
            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
            {profile.username?.charAt(0).toUpperCase()}
          </div>
        )}
        
        <div>
          <h1 style={{ margin: 0 }}>{profile.username}</h1>
          <p style={{ color: '#aaa', marginTop: 5 }}>{profile.bio || 'No bio yet.'}</p>
          
          {currentUser && currentUser.id !== profile.id && (
            <div style={{ marginTop: 10 }}>
              <FollowButton 
                profileId={profile.id} 
                userId={currentUser.id} 
                initialIsFollowing={isFollowing} 
              />
            </div>
          )}
        </div>
      </div>

      <hr style={{ margin: '30px 0', borderColor: '#333' }} />

      <h2>Posts</h2>
      {(!posts || posts.length === 0) ? (
        <p style={{ color: '#888' }}>No posts yet.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} style={{ background: '#111', padding: 20, borderRadius: 12, marginBottom: 15, border: '1px solid #222' }}>
            <p>{post.content}</p>
            <span style={{ fontSize: 12, color: '#666' }}>
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
        ))
      )}
    </div>
  )
}