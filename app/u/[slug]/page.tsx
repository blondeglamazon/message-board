// app/u/[slug]/page.tsx
import { createClient } from '@/app/lib/supabase/server'
import FollowButton from './FollowButton'

interface Profile {
  id: string
  username: string
  email: string
  avatar_url?: string
  bio?: string
  homepage_slug: string
  is_public?: boolean
}

interface Post {
  id: string
  content: string
  created_at: string
}

interface UserProfilePageProps {
  params: Promise<{ slug: string }>
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('homepage_slug', slug)
    .maybeSingle()

  if (profileError || !profile || profile.is_public === false) {
    return (
      <div style={{ padding: 40, color: 'white' }}>
        Profile not found at this custom URL.
      </div>
    )
  }

  // Fetch posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  // Auth check
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  let initialIsFollowing = false

  if (currentUser && currentUser.id !== profile.id) {
    const { data: follows } = await supabase
      .from('follows')
      .select('*')
      .match({ follower_id: currentUser.id, following_id: profile.id })
    initialIsFollowing = (follows || []).length > 0
  }

  return (
    <div style={{ padding: 40, color: 'white', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
            }}
          >
            {profile.username?.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <h1>{profile.username || profile.email}</h1>
          <p>{profile.bio || 'No bio yet.'}</p>
          {currentUser && currentUser.id !== profile.id && (
            <FollowButton
              profileId={profile.id}
              userId={currentUser.id}
              initialIsFollowing={initialIsFollowing}
            />
          )}
        </div>
      </div>

      <hr style={{ margin: '20px 0', borderColor: '#333' }} />

      <h2>Posts</h2>
      {(!posts || posts.length === 0) ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            style={{
              backgroundColor: '#111',
              padding: 15,
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <p>{post.content}</p>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              {new Date(post.created_at).toLocaleString()}
            </span>
          </div>
        ))
      )}
    </div>
  )
}
