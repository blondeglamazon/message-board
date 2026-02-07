import { createClient } from '../lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateUserRole } from './actions'

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>
}) {
  const supabase = await createClient()

  // 1. Auth & Admin Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') redirect('/')

  // 2. Pagination & Filter Setup
  const { q, role, page } = await searchParams
  const searchTerm = q || ''
  const roleFilter = role || 'all'
  
  const pageSize = 5 
  const currentPage = parseInt(page || '1')
  const from = (currentPage - 1) * pageSize
  const to = from + pageSize - 1

  // 3. Build Dynamic Query
  let query = supabase
    .from('profiles')
    .select('id, email, role', { count: 'exact' })
    .order('email', { ascending: true })
    .range(from, to)

  if (searchTerm) query = query.ilike('email', `%${searchTerm}%`)
  if (roleFilter !== 'all') query = query.eq('role', roleFilter)

  // 4. Fetch Data & Audit Logs
  const [profilesRes, statsUsers, statsPosts, auditRes] = await Promise.all([
    query,
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10)
  ])

  const allProfiles = profilesRes.data
  const filteredCount = profilesRes.count || 0
  const totalPages = Math.ceil(filteredCount / pageSize)
  const logs = auditRes.data

  return (
    <div className="max-w-6xl mx-auto p-8">
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">System overview and management.</p>
        </div>
        <div className="flex gap-3">
          <a href="/admin/posts" className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Moderate Content
          </a>
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100">
            Admin: {user.email}
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{statsUsers.count || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase">Total Posts</p>
          <p className="text-3xl font-bold text-gray-900">{statsPosts.count || 0}</p>
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
            {allProfiles?.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{profile.email}</td>
                <td className="px-6 py-4">
                    <form action={async () => { 
                        'use server'; 
                        await updateUserRole(profile.id, profile.role === 'admin' ? 'user' : 'admin'); 
                    }}>
                        <button type="submit" className="text-xs font-medium px-2 py-1 rounded border border-gray-200 hover:bg-gray-50">
                            {profile.role || 'user'} ✎
                        </button>
                    </form>
                </td>
                <td className="px-6 py-4 text-right">
                  <form action={async () => {
                    'use server'
                    const { deleteUser } = await import('./actions')
                    await deleteUser(profile.id)
                  }}>
                    <button type="submit" className="text-red-600 hover:text-red-900 text-sm font-semibold bg-red-50 px-3 py-1 rounded-md">
                      Delete
                    </button>
                  </form>
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
          {logs?.map((log) => (
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
          {logs?.length === 0 && <p className="p-4 text-gray-500 text-center italic">No logs recorded yet.</p>}
        </div>
      </div>
    </div>
  )
}