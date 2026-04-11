import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import BroadcastForm from './BroadcastForm';

export const dynamic = 'force-dynamic';

export default async function BroadcastPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error || !profile?.is_admin) {
    redirect('/');
  }

  return <BroadcastForm />;
}