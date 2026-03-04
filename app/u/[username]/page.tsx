import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import UserRedirect from './UserRedirect'; // Ensure this matches the file we created earlier!

// ✅ FIX: Define params as a Promise for Next.js 15/16 compliance
// Note: searchParams is REMOVED because using it in metadata crashes static exports
type Props = {
  params: Promise<{ username: string }>;
};

// 👇 1. Gives Appflow a dummy page to build so it doesn't crash!
export function generateStaticParams() {
  return [{ username: 'placeholder' }];
}

// Lazy init — prevents Next.js scanner from complaining about missing env vars
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 👇 2. Your Social Media Link Preview Code (Runs on Web only)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  // 🚨 CRITICAL FIX: MUST SHORT CIRCUIT during the Appflow static build
  if (username === 'placeholder') {
    return { title: 'VIMciety' };
  }

  const supabase = getSupabase();

  // Fetch the user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url, bio, display_name')
    .eq('username', username)
    .single();

  const previewImage = profile?.avatar_url || 'https://www.vimciety.com/logo.png';
  const pageTitle = profile?.display_name 
    ? `${profile.display_name} (@${username}) | VIMciety` 
    : `${username} | VIMciety`;
  const pageDescription = profile?.bio || `Check out ${username}'s profile on VIMciety!`;

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `https://www.vimciety.com/u/${username}`,
      images: [
        {
          url: previewImage,
          width: 1200,
          height: 630,
          alt: `VIMciety Preview`,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [previewImage],
    },
  };
}

// 👇 3. Your Actual Page UI Component (Delegates purely to the client)
export default async function Page({ params }: Props) {
  const { username } = await params;
  
  // Render the Client Component that uses useSearchParams() safely inside a <Suspense> boundary
  return <UserRedirect username={username} />;
}