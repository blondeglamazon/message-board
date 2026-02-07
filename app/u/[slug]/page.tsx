import { createClient } from '@/app/lib/supabase/server'
import { notFound } from 'next/navigation'
import { toggleFollow, likePost } from './actions'

export default async function UserHomepage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  
  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('homepage_slug', params.slug)
    .single()

  if (!profile) notFound()

  // 2. Fetch Social Stats (Followers/Following)
  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id)

  // 3. Fetch Posts with Comments (Pinned first, then Newest)
  // Logic matches your BIGINT post_id and UUID user_id schema 
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles(email),
      comments (
        id,
        content,
        created_at,
        user_id
      )
    `)
    .eq('author_id', profile.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  // 4. Auth & Follow Status Check
  const { data: { user } } = await supabase.auth.getUser()
  let isFollowing = false
  if (user) {
    const { data: followData } = await supabase
      .from('follows')
      .select('id')
      .match({ follower_id: user.id, following_id: profile.id })
      .single()
    isFollowing = !!followData
  }

  return (
    <div className="min-h-screen p-12 bg-fixed bg-cover" style={{ 
      backgroundImage: `url(${profile.canva_design_id})`,
      backgroundAttachment: 'fixed'
    }}>
      {/* --- HEADER --- */}
      <header className="max-w-6xl mx-auto mb-16">
        <div className="rounded-3xl overflow-hidden shadow-2xl h-80 bg-white/10 backdrop-blur-md mb-8 border border-white/20">
          {profile.canva_banner_url && (
            <img src={profile.canva_banner_url} className="w-full h-full object-cover" alt="Banner" />
          )}
        </div>

        <div className="flex justify-between items-end px-4">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/40">
            <h1 className="text-4xl font-bold text-gray-900">{profile.email?.split('@')[0]}'s Space</h1>
            <div className="flex gap-4 mt-2 text-sm font-semibold text-blue-600">
              <span>{followersCount || 0} Followers</span>
              <span>{followingCount || 0} Following</span>
            </div>
            <p className="text-gray-600 mt-2 text-lg">{profile.bio || "Welcome to my custom homepage!"}</p>
          </div>

          {user && user.id !== profile.id && (
            <form action={toggleFollow.bind(null, user.id, profile.id, isFollowing)}>
              <button type="submit" className={`px-8 py-3 rounded-full font-bold shadow-lg transition-all ${
                isFollowing ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            </form>
          )}
        </div>
      </header>

      {/* --- 2-COLUMN POST GRID --- */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {posts?.map((post) => (
          <article key={post.id} className="bg-white/95 p-8 rounded-3xl shadow-xl border border-white/20 flex flex-col">
            {post.is_pinned && <div className="text-blue-600 text-xs font-bold mb-3 flex items-center">📌 PINNED POST</div>}
            
            {/* DYNAMIC MEDIA HANDLING */}
            <div className="mb-6 rounded-2xl overflow-hidden shadow-inner bg-gray-50">
              {post.post_type === 'audio' && (
                <iframe 
                  width="100%" height="166" scrolling="no" frameBorder="no" 
                  src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(post.media_url)}&color=%23ff5500&auto_play=false&show_user=true`} 
                />
              )}
              {post.post_type === 'picture' && <img src={post.media_url} className="w-full h-auto max-h-[400px] object-cover" alt="Post content" />}
              {post.post_type === 'video' && <video src={post.media_url} controls className="w-full" />}
              {post.post_type === 'link' && (
                <a href={post.media_url} target="_blank" className="p-4 block text-blue-600 hover:underline bg-blue-50/50 truncate">
                  🔗 {post.media_url}
                </a>
              )}
            </div>

            <p className="text-gray-800 text-lg leading-relaxed mb-6 flex-grow">{post.content}</p>
            
            {/* INTERACTION BAR */}
            <footer className="pt-6 border-t border-gray-100 flex gap-6 text-gray-500 font-medium">
              <form action={likePost.bind(null, post.id, params.slug)}>
                <button type="submit" className="flex items-center gap-2 hover:text-red-500 transition-colors">
                  ❤️ {post.likes_count || 0} Likes
                </button>
              </form>
              <div className="flex items-center gap-2 hover:text-blue-500 cursor-default">
                💬 {post.comments?.length || 0} Comments
              </div>
            </footer>
          </article>
        ))}
      </main>
    </div>
  )
}