import UserClientComponent from './UserClientComponent'

export async function generateStaticParams() {
  return [{ username: 'placeholder' }]
}

// Strictly disable dynamic generation
export const dynamicParams = false

export default async function Page(props: { params: Promise<{ username: string }> }) {
  const { username } = await props.params;

  if (username === 'placeholder') return null;

  return <UserClientComponent username={username} />
}