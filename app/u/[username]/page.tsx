import { createClient } from '@/app/lib/supabase/server'
import PublicProfileContent from '@/components/PublicProfileContent' 

// 1. Update type to expect 'username' (matches folder name)
export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  // 2. Await params and grab 'username'
  const { username } = await params
  
  const supabase = await createClient()

  // 3. Search the database
  // We use the URL value (username) to search the 'homepage_slug' column
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('homepage_slug', username) // Case-insensitive match
    .maybeSingle()

  // 4. Handle 404
  if (!profile) {
    return (
      <div style={{ padding: '40px', color: 'white', textAlign: 'center' }}>
        <h1>Profile Not Found</h1>
        <p>The user @{username} does not exist or has not set a homepage slug.</p>
      </div>
    )
  }

  // 5. Render Component
  return <PublicProfileContent profile={profile} />
}