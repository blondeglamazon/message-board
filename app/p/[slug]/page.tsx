import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import PostClientComponent from './PostClientComponent'

// Helper: Setup Supabase for server-side fetching
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 1. Define the placeholder to satisfy the mobile build
export async function generateStaticParams() {
  return [{ slug: 'placeholder' }]
}

// 2. Strictly disable dynamic generation (Recommended for Capacitor builds)
export const dynamicParams = false

// 3. SEO UPGRADE: Dynamic Metadata for OpenGraph, Twitter, and Web Crawlers
export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params

  // CRITICAL: Short-circuit for the Capacitor build to prevent database queries
  if (slug === 'placeholder') return { title: 'VIMciety' }

  const supabase = getSupabase()
  
  // Notice we query by 'slug' here instead of 'id'
  const { data: post } = await supabase
    .from('posts')
    .select('id, content, media_url, user_id, created_at') 
    .eq('slug', slug)
    .single()

  if (!post) return { title: 'Post not found | VIMciety' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', post.user_id)
    .single()

  const title = `${profile?.display_name || profile?.username || 'Someone'} on VIMciety`
  const description = post.content ? post.content.substring(0, 200) + '...' : 'Check out this post on VIMciety!'
  const ogImage = post.media_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? post.media_url : 'https://www.vimciety.com/logo.png'
  const postUrl = `https://www.vimciety.com/p/${slug}`

  return {
    title,
    description,
    alternates: { canonical: postUrl },
    openGraph: {
      title, description, url: postUrl, siteName: 'VIMciety',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'article', publishedTime: post.created_at,
      authors: [profile?.username || 'VIMciety User']
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] }
  }
}

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params

  // 4. Hide the placeholder path from showing content in the mobile app
  if (slug === 'placeholder') return null

  // SEO UPGRADE: Fetch data to inject JSON-LD and Semantic HTML for Googlebot
  const supabase = getSupabase()
  const { data: post } = await supabase
    .from('posts')
    .select('id, content, media_url, user_id, created_at')
    .eq('slug', slug)
    .single()
  
  let authorName = 'VIMciety User'
  if (post) {
    const { data: profile } = await supabase.from('profiles').select('username, display_name').eq('id', post.user_id).single()
    authorName = profile?.display_name || profile?.username || 'VIMciety User'
  }

  // SEO UPGRADE: Google Rich Snippet Data
  const jsonLd = post ? {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    headline: `${authorName} on VIMciety`,
    text: post.content || 'Check out this post on VIMciety',
    image: post.media_url || 'https://www.vimciety.com/logo.png',
    url: `https://www.vimciety.com/p/${slug}`,
    datePublished: post.created_at,
    author: {
      '@type': 'Person',
      name: authorName,
      url: `https://www.vimciety.com/${authorName}`
    }
  } : null

  return (
    <>
      {/* 5. Inject JSON-LD directly into the HTML head so Googlebot can read it instantly */}
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      {/* 6. SEO HTML Fallback: In case a bot strips JavaScript, it reads this instead */}
      {post && (
        <noscript>
          <article style={{ display: 'none' }}>
            <h1>{authorName} on VIMciety</h1>
            <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString()}</time>
            <p>{post.content}</p>
            {post.media_url && <img src={post.media_url} alt={`Post by ${authorName}`} />}
          </article>
        </noscript>
      )}

      {/* 7. Pass the baton back to your Client Component (Untouched!) */}
      <PostClientComponent slug={slug} />
    </>
  )
}