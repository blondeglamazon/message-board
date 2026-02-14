'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Verify Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') { router.push('/'); return }

    // Fetch Reports + Post Data + Reported User Data
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        posts (
          content,
          media_url,
          user_id
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (data) setReports(data)
    setLoading(false)
  }

  const handleAction = async (reportId: string, postId: string, action: 'dismiss' | 'delete') => {
    if (action === 'delete') {
      if(!confirm("Delete this post permanently?")) return
      await supabase.from('posts').delete().eq('id', postId)
      alert("Post deleted.")
    }

    // Mark report as resolved
    await supabase.from('reports').update({ status: 'reviewed' }).eq('id', reportId)
    
    // Remove from UI
    setReports(current => current.filter(r => r.id !== reportId))
  }

  if (loading) return <div className="p-8">Loading reports...</div>

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Content Reports</h1>
      
      {reports.length === 0 ? (
        <p className="text-gray-500">No pending reports.</p>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="bg-white p-6 border rounded shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold mb-2">
                    Reason: {report.reason}
                  </span>
                  <p className="text-gray-800 mt-2 font-medium">
                    Post Content: "{report.posts?.content || '[Media Only]'}"
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Reported at: {new Date(report.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAction(report.id, report.post_id, 'dismiss')}
                    className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Dismiss
                  </button>
                  <button 
                    onClick={() => handleAction(report.id, report.post_id, 'delete')}
                    className="px-3 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    Delete Post
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}