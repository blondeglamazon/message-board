'use client';
import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'; 

export default function PushManager() {
  const [userId, setUserId] = useState<string | null>(null);

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

  usePushNotifications(userId, supabase);

  return null; 
}