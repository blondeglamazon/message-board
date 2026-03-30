import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// ✅ FIX 1: Tell Next.js to generate this dynamically when Google asks for it, NOT during the build!
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.vimciety.com'

  // ✅ FIX 2: Add dummy fallbacks so the static analyzer doesn't panic
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-for-build.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key_for_build'
  )

  // ✅ FIX 3: Short-circuit during the build phase so it doesn't try to query the dummy database
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [
      {
        url: baseUrl, 
        lastModified: new Date(),
        changeFrequency: 'always',
        priority: 1.0, 
      }
    ]
  }

  // 2. Fetch all posts from Supabase
  const { data: posts } = await supabase
    .from('posts')
    .select('id, slug, updated_at, created_at')
    .order('created_at', { ascending: false })
    .limit(10000)

  // 3. Map the /post/[id] routes
  const postEntries: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${baseUrl}/post/${post.id}`,
    lastModified: post.updated_at || post.created_at || new Date(),
    changeFrequency: 'daily',
    priority: 0.6,
  }))

  // 4. Map the /p/[slug] routes (Only if the post actually has a slug!)
  const slugEntries: MetadataRoute.Sitemap = (posts || [])
    .filter((post) => post.slug)
    .map((post) => ({
      url: `${baseUrl}/p/${post.slug}`,
      lastModified: post.updated_at || post.created_at || new Date(),
      changeFrequency: 'daily',
      priority: 0.8, 
    }))

  // 5. Add your static core pages
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl, 
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0, 
    }
  ]

  // 6. Combine them all into one massive array
  return [...staticEntries, ...postEntries, ...slugEntries]
}