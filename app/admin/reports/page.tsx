'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { dismissReport, deleteReportedPost } from '../actions' // Import your secure actions

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null) // Added state to track the admin
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadReports() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Verify Admin
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/'); return }

      setCurrentUser(user) // Save the user so we can pass their ID to server actions

      // Fetch Reports + Post Data
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

    loadReports()
  }, [router, supabase])

  const handleAction = async (reportId: string, postId: string, action: 'dismiss' | 'delete') => {
    if (!currentUser) return;

    try {
      if (action === 'delete') {
        if(!confirm("Delete this post permanently?")) return
        
        // Use the secure server action
        const success = await deleteReportedPost(currentUser.id, reportId, postId)
        if (success) {
            alert("Post deleted and report resolved.")
            setReports(current => current.filter(r => r.id !== reportId))
        }
      } else {
        // Dismiss action
        const success = await dismissReport(currentUser.id, reportId)
        if (success) {
            setReports(current => current.filter(r => r.id !== reportId))
        }
      }
    } catch (error: any) {
      alert("Action failed: " + error.message)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading reports...</div>

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Content Reports</h1>
        <button 
          onClick={() => router.push('/admin')}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Dashboard
        </button>
      </div>
      
      {reports.length === 0 ? (
        <div className="bg-white p-10 border border-gray-200 rounded-xl shadow-sm text-center">
            <p className="text-gray-500 font-medium">No pending reports.</p>
            <p className="text-sm text-gray-400 mt-1">Your community is behaving nicely!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div className="flex-1">
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold mb-2 uppercase tracking-wide">
                    Reason: {report.reason}
                  </span>
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg mt-2">
                    <p className="text-gray-800 font-medium italic">
                      "{report.posts?.content || '[Media Only]'}"
                    </p>
                    {report.posts?.media_url && (
                        <p className="text-xs text-blue-500 mt-2 hover:underline cursor-pointer">View Attached Media</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-3 font-mono">
                    Reported at: {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAction(report.id, report.post_id, 'dismiss')}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Dismiss
                  </button>
                  <button 
                    onClick={() => handleAction(report.id, report.post_id, 'delete')}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm transition"
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