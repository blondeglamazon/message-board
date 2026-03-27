'use client'; // 👈 1. Add this at the very top!

import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client'; // 👈 2. Use the CLIENT import
import Storefront from '@/components/Storefront';
import { useParams } from 'next/navigation'; // 👈 3. Use the hook for params

export default function PublicProfilePage() {
  const params = useParams();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUsername = typeof params?.username === 'string' 
    ? decodeURIComponent(params.username) 
    : '';

  useEffect(() => {
    async function loadProfileData() {
      if (!targetUsername) return;

      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', targetUsername)
        .maybeSingle();

      if (profileError || !profileData) {
        setError(profileError?.message || "No user found with that exact username");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch Posts
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      setUserPosts(posts || []);
      setLoading(false);
    }

    loadProfileData();
  }, [targetUsername]);

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '50px' }}>Loading...</div>;

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '50px', textAlign: 'center' }}>
        <h1 style={{ color: '#EF4444' }}>🚨 Profile Fetch Failed</h1>
        <p>URL requested: {targetUsername}</p>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', padding: '40px 20px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        
        {/* Profile Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px', padding: '32px', backgroundColor: '#1F2937', borderRadius: '16px', border: '1px solid #374151' }}>
          <div style={{ width: '96px', height: '96px', margin: '0 auto 16px auto', borderRadius: '50%', backgroundColor: '#6366F1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'white' }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (profile.display_name || profile.username || '?').charAt(0).toUpperCase()
            )}
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{profile.display_name || `@${profile.username}`}</h1>
          <p style={{ color: '#9CA3AF' }}>@{profile.username}</p>
        </div>

        {/* SECTION 1: The Storefront */}
        <h2 style={{ color: 'white', marginBottom: '20px' }}>🛍️ Shop</h2>
        <Storefront userId={profile.id} />

        <hr style={{ margin: '40px 0', border: '0', borderTop: '1px solid #374151' }} />

        {/* SECTION 2: The Social Feed */}
        <h2 style={{ color: 'white', marginBottom: '20px' }}>📱 Feed</h2>
        {userPosts.length > 0 ? (
          userPosts.map((post: any) => (
            <div key={post.id} style={{ backgroundColor: '#1F2937', padding: '20px', borderRadius: '12px', marginBottom: '16px', color: 'white', border: '1px solid #374151' }}>
              <p>{post.content}</p>
              {post.media_url && <img src={post.media_url} style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }} />}
            </div>
          ))
        ) : <p style={{ color: '#9CA3AF', textAlign: 'center' }}>No posts yet.</p>}

      </div>
    </div>
  );
}