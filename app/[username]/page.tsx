import { createClient } from '@/app/lib/supabase/server'
import Storefront from '@/components/Storefront'

export default async function PublicProfilePage({ 
  params 
}: { 
  params: { username: string } 
}) {
  const supabase = await createClient()

  // 1. Safely grab the username from the URL (handles Next.js 14/15 differences)
  const resolvedParams = await params;
  const targetUsername = decodeURIComponent(resolvedParams.username);

  // 2. Look up the creator
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', targetUsername)
    .single()

  // 3. IF IT FAILS: Print the exact reason directly to the screen!
  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '50px', textAlign: 'center', fontFamily: 'monospace' }}>
        <h1 style={{ color: '#EF4444' }}>🚨 Profile Fetch Failed</h1>
        <p style={{ fontSize: '18px', marginTop: '20px' }}>
          <strong>URL requested:</strong> {targetUsername}
        </p>
        <p style={{ fontSize: '18px' }}>
          <strong>Supabase Error:</strong> {error?.message || error?.details || error?.hint || "No user found with that exact username"}
        </p>
        <p style={{ marginTop: '20px', color: '#9CA3AF' }}>
          Check if the URL above perfectly matches the database row!
        </p>
      </div>
    )
  }
const { data: userPosts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
      .order('created_at', { ascending: false }); 
  // 4. IF IT SUCCEEDS: Render the Storefront!
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', padding: '40px 20px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        
        {/* --- Profile Header --- */}
        <div style={{ textAlign: 'center', marginBottom: '40px', padding: '32px', backgroundColor: '#1F2937', borderRadius: '16px', border: '1px solid #374151' }}>
          <div style={{ width: '96px', height: '96px', margin: '0 auto 16px auto', borderRadius: '50%', backgroundColor: '#6366F1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'white', fontWeight: 'bold' }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (profile.display_name || profile.username || '?').charAt(0).toUpperCase()
            )}
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>
            {profile.display_name || `@${profile.username}`}
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '16px', margin: '0 0 16px 0' }}>
            @{profile.username}
          </p>
          {profile.bio && (
            <p style={{ color: '#D1D5DB', fontSize: '15px', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto' }}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* --- SECTION 1: The Storefront --- */}
        <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>🛍️ Shop</h2>
        <Storefront userId={profile.id} />

        <hr style={{ margin: '40px 0', border: '0', borderTop: '1px solid #374151' }} />

        {/* --- SECTION 2: The Social Feed --- */}
        <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>📱 Feed</h2>
        {userPosts && userPosts.length > 0 ? (
          userPosts.map((post: any) => (
            <div key={post.id} style={{ backgroundColor: '#1F2937', padding: '20px', borderRadius: '12px', marginBottom: '16px', color: 'white', border: '1px solid #374151' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '15px', lineHeight: '1.5' }}>{post.content}</p>
              {post.media_url && (
                <img src={post.media_url} alt="Post attachment" style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }} />
              )}
            </div>
          ))
        ) : (
          <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '20px', backgroundColor: '#1F2937', borderRadius: '12px', border: '1px dashed #374151' }}>
            No posts yet.
          </p>
        )}

      </div>
    </div>
  );
}