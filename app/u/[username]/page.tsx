import { Metadata } from 'next';
// Import your Supabase client here so we can fetch the image
import { createClient } from '@supabase/supabase-js';
import UserClientComponent from './UserClientComponent'; // (Make sure this matches your actual file name!)

// Initialize Supabase (Use your actual Supabase URL and Anon Key)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Props = {
  params: { username: string }
  searchParams: { [key: string]: string | string[] | undefined } // 👈 This catches ?post=123
};

// 👇 THIS IS THE MISSING FIX: It gives Appflow a dummy page to build so it doesn't crash!
export function generateStaticParams() {
  return [{ username: 'placeholder' }];
}

// 👇 Your Social Media Link Preview Code (Runs on Web only)
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const username = params.username;
  const postId = searchParams.post as string; // Look for a ?post= query in the URL

  let previewImage = 'https://www.vimciety.com/logo.png'; // Default fallback
  let pageTitle = `${username} | VIMciety`;
  let pageDescription = `Check out ${username}'s profile on VIMciety!`;

  // IF the URL has a specific post ID (e.g., vimciety.com/u/john?post=123)
  if (postId) {
    const { data: post } = await supabase
      .from('posts')
      .select('content, media_url, post_type')
      .eq('id', postId)
      .single();

    if (post) {
      // Use the post's image if it has one!
      if (post.media_url && post.post_type === 'image') {
        previewImage = post.media_url;
      }
      pageTitle = `Post by ${username} | VIMciety`;
      // Use the post text as the description (cut off after 150 chars)
      pageDescription = post.content ? post.content.substring(0, 150) + '...' : pageDescription;
    }
  } 
  // IF it's just a normal profile link (vimciety.com/u/john)
  else {
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url, bio')
      .eq('username', username)
      .single();

    if (profile?.avatar_url) {
      previewImage = profile.avatar_url;
    }
    if (profile?.bio) {
      pageDescription = profile.bio;
    }
  }

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `https://www.vimciety.com/u/${username}${postId ? `?post=${postId}` : ''}`,
      images: [
        {
          url: previewImage,
          width: 1200,
          height: 630,
          alt: `VIMciety Preview`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [previewImage],
    },
  };
}

// 👇 Your Actual Page UI Component
export default function Page({ params }: { params: { username: string } }) {
  // We just pass the username down to your Client Component!
  return <UserClientComponent username={params.username} />;
}