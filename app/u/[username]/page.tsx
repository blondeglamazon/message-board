import ProfileClient from './ProfileClient';

// Next.js 16 requires params to be a Promise!
export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  // We await the params before passing them to the client
  const resolvedParams = await params;
  
  return <ProfileClient username={resolvedParams.username} />;
}