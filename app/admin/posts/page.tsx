'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PostModeration() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  // 1. Fetch Data on Load (Client Side)
  useEffect(() => {
    async function loadPosts() {
      // Auth Check
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Admin Check
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') { router.push('/'); return }

      // Fetch Posts
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      if (data) setPosts(data)
      setLoading(false)
    }

    loadPosts()
  }, [router, supabase])

  // 2. Handle Delete (Standard Client Function)
  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) {
      alert("Error deleting post: " + error.message)
    } else {
      // Update UI immediately
      setPosts(currentPosts => currentPosts.filter(p => p.id !== postId))
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading posts...</div>

  return (
    <div className="max-w-6xl mx-auto p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Post Moderation</h1>
          <p className="text-gray-500">Review and manage community content.</p>
        </div>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline mb-1">
          ← Back to User Management
        </Link>
      </header>

      <div className="grid gap-4">
        {posts.map((post) => {
          // Fallback logic to find the content column
          const content = post.content || post.body || post.text || post.message || "No content found";
          const userEmail = post.profiles?.email || 'Unknown User';
          
          return (
            <div key={post.id} className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Author:</span>
                  <span className="text-sm font-medium text-blue-600">{userEmail}</span>
                </div>
                <p className="text-gray-800 leading-relaxed">{content}</p>
                {post.media_url && (
                    <div className="mt-2 text-xs text-gray-400">[Contains Media]</div>
                )}
              </div>

              <div className="ml-4 flex gap-2">
                <button 
                  onClick={() => handleDelete(post.id)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                >
                  Delete Post
                </button>
              </div>
            </div>
          );
        })}

        {posts.length === 0 && !error && (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500">No posts found to moderate.</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}