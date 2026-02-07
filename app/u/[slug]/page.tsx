// app/u/[slug]/page.tsx
'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

interface Profile {
  id: string
  username: string
  email: string
  avatar_url?: string
  bio?: string
  homepage_slug: string
  is_public: boolean
}

interface Post {
  id: string
  content: string
  created_at: string
}

interface UserProfilePageProps {
  params: { slug: string }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const supabase = await createClient()
  const slug = params.slug

  // 1️⃣ Fetch profile by slug (public profiles only)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('homepage_slug', slug)
    .eq('is_public', true) // ensures only public profiles
    .maybeSingle()

  if (profileError || !profile) {
    return (
      <div style={{ padding: 40, color: 'white' }}>
        Profile not found.
      </div>
    )
  }

  // 2️⃣ Fetch posts for this profile
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  // 3️⃣ Determine if current logged-in user is following this profile
  let isFollowing = false
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.id) {
    const { data: follows } = await supabase
      .from('follows')
      .select('*')
      .match({ follower_id: user.id, following_id: profile.id })
    isFollowing = (follows || []).length > 0
  }

  // 4️⃣ Server-side toggle follow function
  const toggleFollow = async () => {
    if (!user?.id) return

    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: user.id, following_id: profile.id })
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id })
    }
    revalidatePath(`/u/${slug}`)
  }

  return (
    <div style={{ padding: 40, color: 'white', maxWidth: '800px', margin: '0 auto' }}>
      {/* Profile Header */}
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
              fontSize: '40px',
            }}
          >
            {profile.username?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 style={{ margin: 0 }}>{profile.username || profile.email}</h1>
          <p>{profile.bio || 'No bio yet.'}</p>

          {user?.id && profile.id !== user.id && (
            <button
              onClick={toggleFollow}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isFollowing ? '#374151' : '#6366f1',
                color: 'white',
                cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              {isFollowing ? 'Following' : '+ Follow'}
            </button>
          )}
        </div>
      </div>

      <hr style={{ margin: '20px 0', borderColor: '#374151' }} />

      {/* Posts */}
      <h2>Posts</h2>
      {(!posts || posts.length === 0) ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post: Post) => (
          <div
            key={post.id}
            style={{
              backgroundColor: '#111827',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '15px',
            }}
          >
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
