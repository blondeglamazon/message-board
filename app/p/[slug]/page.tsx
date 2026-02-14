import PostClientComponent from './PostClientComponent'

// 1. Define the placeholder to satisfy the build
export async function generateStaticParams() {
  return [{ slug: 'placeholder' }]
}

// 2. Strictly disable dynamic generation (Recommended for Capacitor builds)
export const dynamicParams = false

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  // 3. Hide the placeholder path from showing content
  if (slug === 'placeholder') return null;

  return <PostClientComponent slug={slug} />
}