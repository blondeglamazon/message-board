import ProfileClient from './ProfileClient';



export default function Page({ params }: { params: { username: string } }) {
  return <ProfileClient username={params.username} />;
}