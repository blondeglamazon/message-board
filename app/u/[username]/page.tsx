import { createClient } from '@/app/lib/supabase/server'
import { notFound } from 'next/navigation'
import PublicProfileContent from '@/components/PublicProfileContent' 

// 1. Update the type to match your folder name [slug]
export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  // 2. Await params (Required in Next.js 15) and extract 'slug'
  const { slug } = await params
  
  const supabase = await createClient()

  // 3. Fetch the profile
  // We use the 'slug' from the URL to search the 'homepage_slug' column
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('homepage_slug', slug) // Case-insensitive match
    .maybeSingle()

  // 4. Handle 404 (Profile not found)
  if (!profile) {
    return (
      <div style={{ padding: '40px', color: 'white', textAlign: 'center' }}>
        <h1>Profile Not Found</h1>
        <p>The user @{slug} does not exist or has not set a homepage slug.</p>
      </div>
    )
  }

  // 5. Render the profile component
  return <PublicProfileContent profile={profile} />
}