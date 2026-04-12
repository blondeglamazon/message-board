import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import PostRedirect from './PostRedirect'

const DELETED_USER_ID = '00000000-0000-0000-0000-000000000000';

type Props = { params: Promise<{ id: string }> }

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function generateStaticParams() {
  return [{ id: 'placeholder' }]
}

export const dynamicParams = true

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
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

  const isAuthorDeleted = post.user_id === DELETED_USER_ID

  let authorLabel = 'Deleted User'
  let authorForOg: string[] = ['VIMciety User']

  if (!isAuthorDeleted) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', post.user_id)
      .single()

    authorLabel = profile?.display_name || profile?.username || 'Someone'
    authorForOg = [profile?.username || 'VIMciety User']
  }

  const title = `${authorLabel} on VIMciety`
  const description = post.content
    ? post.content.substring(0, 200) + '...'
    : 'Check out this post on VIMciety!'
  const postUrl = `https://www.vimciety.com/post/${id}`

  const isVideo = post.media_url?.match(/\.(mp4|webm|ogg|mov)$/i)
  const isImage = post.media_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  const ogImage = isImage ? post.media_url : 'https://www.vimciety.com/logo.png'

  const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: postUrl },
    openGraph: {
      title,
      description,
      url: postUrl,
      siteName: 'VIMciety',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: isVideo ? 'video.other' : 'article',
      publishedTime: post.created_at,
      authors: authorForOg,
      ...(isVideo && {
        videos: [{
          url: post.media_url,
          secureUrl: post.media_url,
          type: `video/${post.media_url.split('.').pop()}`,
          width: 1280,
          height: 720,
        }]
      })
    },
    twitter: {
      card: isVideo ? 'player' : 'summary_large_image',
      title,
      description,
      images: [ogImage],
      ...(isVideo && {
        players: [{
          playerUrl: post.media_url,
          streamUrl: post.media_url,
          width: 1280,
          height: 720,
        }]
      })
    }
  }

  return metadata
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  if (id === 'placeholder') return null

  const supabase = getSupabase()
  const { data: post } = await supabase
    .from('posts')
    .select('id, content, media_url, user_id, created_at')
    .eq('id', id)
    .single()

  const isAuthorDeleted = post?.user_id === DELETED_USER_ID
  let authorName = isAuthorDeleted ? 'Deleted User' : 'VIMciety User'

  if (post && !isAuthorDeleted) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', post.user_id)
      .single()
    authorName = profile?.display_name || profile?.username || 'VIMciety User'
  }

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
      // Omit the author URL entirely for deleted users so crawlers don't follow a dead link
      ...(!isAuthorDeleted && {
        url: `https://www.vimciety.com/${authorName}`
      })
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

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

      <PostRedirect id={id} />
    </>
  )
}