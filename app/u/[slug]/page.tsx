import { createClient } from '@/app/lib/supabase/server' // Path must match your folder exactly
import FollowButton from './FollowButton'

interface UserProfilePageProps {
  params: Promise<{ slug: string }>
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  // 1. Next.js 15+ REQUIRES awaiting params
  const { slug } = await params
  
  // 2. Initialize the async server client
  const supabase = await createClient()

  // 3. Fetch profile (ilike handles Blondeglamazon vs blondeglamazon)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('homepage_slug', slug)
    .maybeSingle()

  // 4. Handle visibility
  if (error || !profile || profile.is_public === false) {
    return (
      <div style={{ padding: 40, color: 'white' }}>
        Profile not found at this custom URL.
      </div>
    )
  }

  // 5. Fetch posts for this specific profile
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