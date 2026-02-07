import { createClient } from '@/app/lib/supabase/server'
import FollowButton from './FollowButton'
import { notFound } from 'next/navigation'

interface UserProfilePageProps {
  params: Promise<{ slug: string }>
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  // 1. Await params for Next.js 15
  const { slug } = await params
  const supabase = await createClient()

  // 2. Fetch the profile by slug
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('homepage_slug', slug)
    .maybeSingle()

  // 3. Handle 'Not Found' or 'Private'
  if (error || !profile || profile.is_public === false) {
    return (
      <div style={{ padding: 40, color: 'white' }}>
        Profile not found at this custom URL.
      </div>
    )
  }

  // 4. Fetch the posts for this profile
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  // 5. Get current user for the Follow Button
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  let isFollowing = false
  if (authUser) {
    const { data: followData } = await supabase
      .from('follows')
      .select('*')
      .match({ follower_id: authUser.id, following_id: profile.id })
      .maybeSingle()
    isFollowing = !!followData
  }

  return (
    <div style={{ padding: 40, color: 'white', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
          {profile.username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ margin: 0 }}>{profile.username}</h1>
          <p style={{ color: '#aaa' }}>{profile.bio || 'No bio yet.'}</p>
          {authUser && authUser.id !== profile.id && (
            <FollowButton 
              profileId={profile.id} 
              userId={authUser.id} 
              initialIsFollowing={isFollowing} 
            />
          )}
        </div>
      </div>

      <hr style={{ margin: '30px 0', borderColor: '#333' }} />

      <h2>Posts</h2>
      {(!posts || posts.length === 0) ? (
        <p>No posts yet.</p>
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