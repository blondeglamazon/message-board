import { createClient } from '@/app/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function PostModeration() {
  const supabase = await createClient()

  // 1. Security Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  // 2. Fetch Posts - Using '*' to avoid "column not found" errors
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        email
      )
    `)

  return (
    <div className="max-w-6xl mx-auto p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Post Moderation</h1>
          <p className="text-gray-500">Review and manage community content.</p>
        </div>
        <a href="/admin" className="text-sm text-blue-600 hover:underline mb-1">
          ← Back to User Management
        </a>
      </header>

      <div className="grid gap-4">
        {posts?.map((post: any) => {
          // Fallback logic to find the content column
          const content = post.content || post.body || post.text || post.message || "No content found";
          
          return (
            <div key={post.id} className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Author:</span>
                  <span className="text-sm font-medium text-blue-600">{post.profiles?.email || 'Unknown User'}</span>
                </div>
                <p className="text-gray-800 leading-relaxed">{content}</p>
                {/* Debug hint: if you still don't see text, uncomment the line below to see all keys */}
                {/* <pre className="text-[10px] text-gray-400 mt-2">{JSON.stringify(Object.keys(post))}</pre> */}
              </div>

              <div className="ml-4 flex gap-2">
                <form action={async () => {
                  'use server'
                 const { createClient: createActionClient } = await import('@/app/lib/supabaseServer')
                  const supabaseAction = await createActionClient()
                  
                  await supabaseAction.from('posts').delete().eq('id', post.id)
                  revalidatePath('/admin/posts')
                }}>
                  <button className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200">
                    Delete Post
                  </button>
                </form>
              </div>
            </div>
          );
        })}

        {posts?.length === 0 && !error && (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500">No posts found to moderate.</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <strong>Error:</strong> {error.message}
        </div>
      )}
    </div>
  )
}