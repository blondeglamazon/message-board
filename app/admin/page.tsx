'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { updateUserRole, deleteUser } from './actions' // Imports the client versions we just made

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [stats, setStats] = useState({ users: 0, posts: 0 })
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      // 1. Auth Check
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { 
        router.push('/login') 
        return 
      }
      
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (adminProfile?.role !== 'admin') { 
        router.push('/') 
        return 
      }

      setCurrentUser(user)

      // 2. Fetch Live Data
      const [allProfiles, usersCount, postsCount, auditLogs] = await Promise.all([
        supabase.from('profiles').select('*').order('email'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10)
      ])

      setProfiles(allProfiles.data || [])
      setStats({ users: usersCount.count || 0, posts: postsCount.count || 0 })
      setLogs(auditLogs.data || [])
      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  // --- Handlers (Client Side) ---

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    try {
        const success = await updateUserRole(userId, newRole)
        if (success) {
            // Manually update UI state
            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p))
        }
    } catch (e: any) { 
        alert('Failed to update role: ' + e.message) 
    }
  }

  const handleDelete = async (userId: string) => {
    if(!confirm('Are you sure you want to delete this user? This cannot be undone.')) return
    try {
        const success = await deleteUser(userId)
        if (success) {
            // Manually remove from UI
            setProfiles(prev => prev.filter(p => p.id !== userId))
        }
    } catch (e: any) { 
        alert('Failed to delete user: ' + e.message) 
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Admin Dashboard...</div>

  return (
    <div className="max-w-6xl mx-auto p-8 text-gray-900">
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">System overview and management.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Moderate Content
          </button>
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100">
            Admin: {currentUser?.email}
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase">Total Users</p>
          <p className="text-3xl font-bold">{stats.users}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase">Total Posts</p>
          <p className="text-3xl font-bold">{stats.posts}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <p className="text-sm font-medium text-gray-500 uppercase">Status</p>
            <p className="text-xl font-bold text-green-600">Connected</p>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {profiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium">{profile.email}</td>
                <td className="px-6 py-4">
                    <button 
                        onClick={() => handleRoleToggle(profile.id, profile.role)}
                        className="text-xs font-medium px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 transition"
                    >
                        {profile.role || 'user'} ✎
                    </button>
                </td>
                <td className="px-6 py-4 text-right">
                    <button 
                        onClick={() => handleDelete(profile.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-semibold bg-red-50 px-3 py-1 rounded-md hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- RECENT AUDIT LOGS SECTION --- */}
      <div className="mt-12 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-700">Recent Audit Logs</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {logs.map((log) => (
            <div key={log.id} className="p-4 text-sm flex justify-between">
              <div>
                <span className="font-medium text-blue-600">{log.admin_email}</span>
                <span className="text-gray-500"> performed </span>
                <span className="font-mono bg-gray-100 px-1 rounded">{log.action_type}</span>
                <span className="text-gray-500"> on {log.target_id.slice(0, 8)}</span>
              </div>
              <div className="text-gray-400">
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))}
          {logs.length === 0 && <p className="p-4 text-gray-500 text-center italic">No logs recorded yet.</p>}
        </div>
      </div>
    </div>
  )
}