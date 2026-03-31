import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

type Props = {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  if (username === 'placeholder') {
    return { title: 'VIMciety Storefront' };
  }

  const supabase = getSupabase();

  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, display_name')
    .eq('username', username)
    .single();

  const previewImage = profile?.avatar_url || 'https://www.vimciety.com/logo.png';
  const pageTitle = profile?.display_name
    ? `${profile.display_name}'s Storefront | VIMciety`
    : `${username}'s Storefront | VIMciety`;
  const pageDescription = `Shop exclusive products and services from ${username} on VIMciety!`;

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `https://www.vimciety.com/${username}`,
      images: [{ url: previewImage, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [previewImage],
    },
  };
}

export default function StorefrontLayout({ children }: Props) {
  return <>{children}</>;
}