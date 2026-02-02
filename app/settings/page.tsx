import { createClient } from '../lib/supabaseServer'
import { redirect } from 'next/navigation'
import { updateSettings } from './actions'
import CanvaButton from './CanvaButton'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>
}) {
  const supabase = await createClient()

  // 1. Auth & Admin Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 2. Fetch Data & Audit Logs
  const [statsUsers, statsPosts, auditRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10)
  ])

  const logs = auditRes.data

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 space-y-1">
          <h2 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Settings</h2>
          <nav>
            <a href="/settings" className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
              <span>👤</span> Public Profile
            </a>
            <a href="/admin" className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <span>🛠️</span> Admin Dashboard
            </a>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Public Profile</h1>
            <p className="text-gray-500 text-sm">This information will be visible to anyone visiting your homepage.</p>
          </header>

          <form action={updateSettings} className="space-y-8">

            {/* Find your "Page Content" section and paste these inside the grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Spotify Input */}
  <div>
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Spotify Playlist ID</label>
    <input 
      name="spotifyId" 
      defaultValue={profile?.spotify_playlist_id}
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none text-sm focus:border-blue-500"
      placeholder="e.g. 37i9dQZF1DXcBWIGoYBMmP"
    />
  </div>

  {/* SoundCloud Input */}
  <div>
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SoundCloud URL</label>
    <input 
      name="soundcloudUrl" 
      defaultValue={profile?.soundcloud_url}
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none text-sm focus:border-blue-500"
      placeholder="https://soundcloud.com/..."
    />
  </div>
</div>
            
            {/* Custom URL Card */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Homepage Identity</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Your Custom URL</label>
                    <div className="flex items-center group">
                      <span className="bg-gray-50 border border-r-0 border-gray-300 px-3 py-2.5 rounded-l-lg text-gray-400 text-sm">
                        localhost:3000/u/
                      </span>
                      <input 
                        name="slug" 
                        defaultValue={profile?.homepage_slug}
                        className="flex-1 px-3 py-2.5 border border-gray-300 rounded-r-lg outline-none text-sm focus:border-blue-500 transition-all"
                        placeholder="username"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Backdrop Card */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Design & Backdrop</h3>
              <div className="space-y-4">
                <p className="text-xs text-gray-500">Create a custom graphic to show at the top of your homepage.</p>
                <CanvaButton onSave={(url) => console.log("Design URL:", url)} />
                <input type="hidden" name="canvaUrl" value={profile?.canva_design_id} />
              </div>
            </section>

            {/* Profile Content Card */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Page Content</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">About Me (Bio)</label>
                  <textarea 
                    name="bio" 
                    defaultValue={profile?.bio}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none text-sm focus:border-blue-500"
                    placeholder="Tell your story..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Spotify Playlist ID</label>
                        <input 
                            name="spotifyId" 
                            defaultValue={profile?.spotify_playlist_id}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none text-sm focus:border-blue-500"
                            placeholder="e.g. 37i9dQZF1DXcBWIGoYBMmP"
                        />
                    </div>

                    {/* SoundCloud Input Added Here */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SoundCloud URL</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 opacity-50">☁️</span>
                            <input 
                                name="soundcloudUrl" 
                                defaultValue={profile?.soundcloud_url}
                                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg outline-none text-sm focus:border-blue-500"
                                placeholder="https://soundcloud.com/artist/track"
                            />
                        </div>
                    </div>
                </div>
              </div>
            </section>

            {/* Action Bar */}
            <footer className="flex items-center justify-end p-4 bg-white border border-gray-200 rounded-xl shadow-sm sticky bottom-8">
              <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all">
                Update Homepage
              </button>
            </footer>

          </form>

          {/* Audit Logs Section */}
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
      </div>
    </div>
  )
}