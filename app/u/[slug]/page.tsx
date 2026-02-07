'use client'

import { useEffect, useState, use } from 'react'
import { supabase } from '@/app/lib/supabase/client'
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

export default function UserProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  // 1. Unwrap the params Promise using the use() hook (Required for Next.js 15)
  const { slug } = use(params)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    async function fetchData() {
      // Get current logged-in user
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      // 2. Fetch profile by slug (Using .ilike for case-insensitive matching)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('homepage_slug', slug)
        .maybeSingle()

      // 3. Check if profile exists and is public
      if (profileError || !profileData || profileData.is_public === false) {
        setProfile(null)
        setLoading(false)
        return
      }

      setProfile(profileData)

      // 4. Fetch posts for this user
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })

      setPosts(postsData || [])

      // 5. Check follow status
      if (user?.id && user.id !== profileData.id) {
        const { data: follows } = await supabase
          .from('follows')
          .select('*')
          .match({ follower_id: user.id, following_id: profileData.id })
        setIsFollowing((follows || []).length > 0)
      }

      setLoading(false)
    }

    if (slug) fetchData()
  }, [slug])

  if (loading) return <div style={{ padding: 40, color: 'white' }}>Loading...</div>
  if (!profile) return <div style={{ padding: 40, color: 'white' }}>Profile not found at this address.</div>

  return (
    <div style={{ padding: 40, color: 'white', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
            {profile.username?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 style={{ margin: 0 }}>{profile.username || profile.email}</h1>
          <p>{profile.bio || 'No bio yet.'}</p>
          {userId && profile.id !== userId && (
            <FollowButton profileId={profile.id} initialIsFollowing={isFollowing} userId={userId} />
          )}
        </div>
      </div>

      <hr style={{ margin: '20px 0', borderColor: '#374151' }} />

      <h2>Posts</h2>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} style={{ backgroundColor: '#111827', padding: 15, borderRadius: 8, marginBottom: 15 }}>
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