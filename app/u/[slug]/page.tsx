// app/u/[slug]/page.tsx
import { createClient } from '@/app/lib/supabase/server'
import FollowButton from './FollowButton'

interface Post {
  id: string
  content: string
  created_at: string
}

interface Profile {
  id: string
  username: string
  email: string
  avatar_url?: string
  bio?: string
  homepage_slug: string
  is_public: boolean
}

// In Next.js 15, params is a Promise
export default async function UserProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  // 0️⃣ Await the params before using them
  const { slug } = await params
  
  const supabase = await createClient()

  // 1️⃣ Fetch the profile by slug
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('homepage_slug', slug) // Case-insensitive match
    .maybeSingle()

  // 2️⃣ Check if profile exists and is public
  if (profileError || !profile || !profile.is_public) {
    return <div style={{ padding: 40, color: 'white' }}>Profile not found.</div>
  }

  // 3️⃣ Fetch posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  // 4️⃣ Get currently logged-in user (optional)
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || null

  // 5️⃣ Check if current user is following this profile
  let isFollowing = false
  if (userId && userId !== profile.id) {
    const { data: follows } = await supabase
      .from('follows')
      .select('*')
      .match({ follower_id: userId, following_id: profile.id })
    isFollowing = (follows || []).length > 0
  }

  return (
    <div style={{ padding: 40, color: 'white', maxWidth: '800px', margin: '0 auto' }}>
      {/* PROFILE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
            {profile.username?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1>{profile.username || profile.email}</h1>
          <p>{profile.bio || 'No bio yet.'}</p>
          {userId && profile.id !== userId && (
            <FollowButton profileId={profile.id} initialIsFollowing={isFollowing} userId={userId} />
          )}
        </div>
      </div>

      <hr style={{ margin: '20px 0', borderColor: '#374151' }} />

      {/* POSTS */}
      <h2>Posts</h2>
      {(!posts || posts.length === 0) ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post: Post) => (
          <div key={post.id} style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <p>{post.content}</p>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              {new Date(post.created_at).toLocaleString()}
            </span>
          </div>
        ))
      )}
    </div>
  )
}
