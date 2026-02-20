import ProfileClient from './ProfileClient';

export function generateStaticParams() {
  // Giving it at least one dummy path forces the compiler to build the route!
  return [{ username: 'user' }];
}

export default function Page({ params }: { params: { username: string } }) {
  return <ProfileClient username={params.username} />;
}