import ProfileClient from './ProfileClient';

export function generateStaticParams() {
  return [{ username: 'user' }];
}

export default function Page({ params }: { params: { username: string } }) {
  return <ProfileClient username={params.username} />;
}