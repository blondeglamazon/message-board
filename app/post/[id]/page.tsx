import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// 1. Initialize Supabase for the Server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type Props = { params: Promise<{ id: string }> }

// 2. This runs on the Vercel Server BEFORE the page loads. Bots read this!
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  // Fetch the post from Supabase
  const { data: post } = await supabase
    .from('posts')
    .select('id, content, media_url, user_id')
    .eq('id', id)
    .single()

  if (!post) {
    return { title: 'Post not found | VIMciety' }
  }

  // Fetch the author's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url')
    .eq('id', post.user_id)
    .single()

  const title = `${profile?.display_name || profile?.username || 'Someone'} on VIMciety`
  
  // Clean up the text for the preview snippet
  const description = post.content
    ? post.content.substring(0, 200) + (post.content.length > 200 ? '...' : '')
    : 'Check out this post on VIMciety!'

  // Use the post's media as the image, or fall back to your logo
  const ogImage = post.media_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    ? post.media_url
    : 'https://www.vimciety.com/logo.png' // Make sure this logo actually exists on your site!

  // Return the rich data to Facebook/Pinterest
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.vimciety.com/post/${id}`,
      siteName: 'VIMciety',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

// 3. What happens when a REAL HUMAN clicks the link?
export default async function PostPage({ params }: Props) {
  const { id } = await params
  
  // Instantly redirect them to your actual feed/profile, passing the post ID
  // so your client-side code can scroll to it or open it!
  redirect(`/?post=${id}`)
}