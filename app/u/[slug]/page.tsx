import { createClient } from '@/app/lib/supabase/server' // Corrected import path
import FollowButton from './FollowButton'

interface UserProfilePageProps {
  params: Promise<{ slug: string }>
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  // 1. You MUST await params in Next.js 15
  const { slug } = await params
  
  // 2. createClient is now async
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('homepage_slug', slug)
    .maybeSingle()

  if (error || !profile || profile.is_public === false) {
    return (
      <div style={{ padding: 40, color: 'white' }}>
        Profile not found at this custom URL.
      </div>
    )
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: 40, color: 'white', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{profile.username || profile.email}</h1>
      <p>{profile.bio || 'No bio yet.'}</p>
      
      <hr style={{ margin: '20px 0', borderColor: '#333' }} />
      
      <h2>Posts</h2>
      {(!posts || posts.length === 0) ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post: any) => (
          <div key={post.id} style={{ background: '#111', padding: 15, borderRadius: 8, marginBottom: 10 }}>
            <p>{post.content}</p>
          </div>
        ))
      )}
    </div>
  )
}