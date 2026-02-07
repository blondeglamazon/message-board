'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase/client'
import FollowButton from './FollowButton'
import { useParams } from 'next/navigation'

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

export default function UserProfilePage() {
  const params = useParams()
  const slug = params?.slug as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    async function fetchData() {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      // 2. Fetch profile by slug
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('homepage_slug', slug)
        .maybeSingle()

      if (profileError || !profileData || !profileData.is_public) {
        setProfile(null)
        setLoading(false)
        return
      }

      setProfile(profileData)

      // 3. Fetch posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })

      setPosts(postsData || [])

      // 4. Check follow status
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

  const handleFollowToggle = async () => {
    if (!userId || !profile) return

    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: userId, following_id: profile.id })
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: userId, following_id: profile.id })
      setIsFollowing(true)
    }
  }

  if (loading) return <div style={{ padding: 40, color: 'white' }}>Loading...</div>
  if (!profile) return <div style={{ padding: 40, color: 'white' }}>Profile not found.</div>

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
          <div style={{ width: 120, height: 120, borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
            {profile.username?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1>{profile.username || profile.email}</h1>
          <p>{profile.bio || 'No bio yet.'}</p>
          {userId && profile.id !== userId && (
            <button
              onClick={handleFollowToggle}
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

      <h2>Posts</h2>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post) => (
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
