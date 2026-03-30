import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Storefront from '@/components/Storefront'; // 👈 Import your fixed Storefront!
import Sidebar from '@/components/Sidebar';

type Props = {
  params: Promise<{ username: string }>;
};

export function generateStaticParams() {
  return [{ username: 'placeholder' }];
}

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

export default async function Page({ params }: Props) {
  const { username } = await params;
  
  if (username === 'placeholder') return null;

  const supabase = getSupabase();

  // 1. Look up the user's ID and Premium status using their username
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, is_premium, avatar_url')
    .eq('username', username)
    .single();

  // 2. Handle missing or free users gracefully
  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Storefront not found.</h2>
      </div>
    );
  }

  if (!profile.is_premium) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2>This user has not unlocked their storefront yet.</h2>
      </div>
    );
  }

  // 3. Render the dedicated Storefront page!
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
      <Sidebar />
      
      <main style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '80px', paddingLeft: '20px', paddingRight: '20px', paddingBottom: '100px' }}>
        
        {/* Storefront Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#374151', flexShrink: 0 }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : null}
          </div>
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: '28px' }}>{profile.display_name}'s Shop</h1>
            <p style={{ color: '#10B981', margin: '4px 0 0 0', fontWeight: 'bold', fontSize: '14px' }}>
              ✓ Verified VIMciety Seller
            </p>
          </div>
        </div>

        <hr style={{ borderColor: '#374151', marginBottom: '30px' }} />

        {/* The actual Storefront grid component */}
        <Storefront userId={profile.id} />
        
      </main>
    </div>
  );
}