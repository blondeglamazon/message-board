import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import PostRedirect from './PostRedirect' // <-- IMPORT THE CLIENT COMPONENT

type Props = { params: Promise<{ id: string }> }

export function generateStaticParams() {
  return [{ id: 'placeholder' }]
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  // 1. MUST SHORT CIRCUIT to prevent Supabase crashes during the static build
  if (id === 'placeholder') return { title: 'VIMciety' }

  const supabase = getSupabase()

  const { data: post } = await supabase
    .from('posts')
    .select('id, content, media_url, user_id')
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
  
  const description = post.content
    ? post.content.substring(0, 200) + (post.content.length > 200 ? '...' : '')
    : 'Check out this post on VIMciety!'

  const ogImage = post.media_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    ? post.media_url
    : 'https://www.vimciety.com/logo.png'

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
    }
  }
}

// 2. MUST DELEGATE TO YOUR CLIENT COMPONENT
export default async function PostPage({ params }: Props) {
  const { id } = await params
  return <PostRedirect id={id} /> // <-- RENDER IT HERE
}