'use client';
import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'; 

export default function PushManager() {
  const [userId, setUserId] = useState<string | null>(null);

  // 👇 Feed the URL and Key directly into the client!
  // The "!" at the end tells TypeScript "I promise these environment variables exist"
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ); 

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUser();
  }, [supabase]);

  // 🚀 Pass BOTH the userId and the supabase client into the hook
  usePushNotifications(userId, supabase);

  return null; 
}