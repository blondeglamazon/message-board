import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import PostRedirect from './PostRedirect' 

type Props = { params: Promise<{ id: string }> }

// Helper: Keep Supabase logic clean
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 1. MUST DEFINE PLACEHOLDER for the Capacitor export
export function generateStaticParams() {
  return [{ id: 'placeholder' }]
}

// 2. THE FACEBOOK FIX: Allow Vercel to dynamically generate real posts!
export const dynamicParams = true 

// 3. SEO: Dynamic Metadata for Links/iMessage
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  // CRITICAL MOBILE FIX: Short circuit to prevent Supabase crashes during static build
  if (id === 'placeholder') return { title: 'VIMciety' }

  const supabase = getSupabase()

  const { data: post } = await supabase
    .from('posts')
    .select('id, content, media_url, user_id, created_at')
    .eq('id', id)
    .single()

  if (!post) {
    return { title: 'Post not found | VIMciety' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url')
    .eq('id', post.user_id)
    .single()

  const title = `${profile?.display_name || profile?.username || 'Someone'} on VIMciety`
  const description = post.content ? post.content.substring(0, 200) + '...' : 'Check out this post on VIMciety!'
  
  // Facebook strictly requires absolute URLs and hates video files in the image tag
  const ogImage = post.media_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) 
    ? post.media_url 
    : 'https://www.vimciety.com/logo.png' // Make sure this logo actually exists on your site!
    
  const postUrl = `https://www.vimciety.com/post/${id}`

  return {
    title,
    description,
    alternates: { canonical: postUrl },
    openGraph: {
      title,
      description,
      url: postUrl,
      siteName: 'VIMciety',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: post.created_at,
      authors: [profile?.username || 'VIMciety User'], 
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] }
  }
}

// 4. MAIN PAGE COMPONENT
export default async function PostPage({ params }: Props) {
  const { id } = await params

  // CRITICAL MOBILE FIX: Stop the component from rendering/fetching the placeholder!
  if (id === 'placeholder') return null;

  // Fetch data again for the page body (Next.js auto-caches this so it doesn't double-charge your DB)
  const supabase = getSupabase()
  const { data: post } = await supabase.from('posts').select('id, content, media_url, user_id, created_at').eq('id', id).single()
  
  let authorName = 'VIMciety User'
  if (post) {
    const { data: profile } = await supabase.from('profiles').select('username, display_name').eq('id', post.user_id).single()
    authorName = profile?.display_name || profile?.username || 'VIMciety User'
  }

  // SEO: JSON-LD Structured Data for Google Rich Snippets
  const jsonLd = post ? {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    headline: `${authorName} on VIMciety`,
    text: post.content || 'Check out this post on VIMciety',
    image: post.media_url || 'https://www.vimciety.com/logo.png',
    url: `https://www.vimciety.com/post/${id}`,
    datePublished: post.created_at,
    author: {
      '@type': 'Person',
      name: authorName,
      url: `https://www.vimciety.com/${authorName}`
    }
  } : null;

  return (
    <>
      {/* Inject JSON-LD directly into HTML head for Googlebot */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* SEO HTML Fallback: Hidden semantic HTML for scrapers/bots that ignore JS */}
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

      {/* Delegate interactive logic to the Client Component */}
      <PostRedirect id={id} />
    </>
  )
}