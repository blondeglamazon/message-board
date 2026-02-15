'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: string, text: string } | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    spotify_playlist_id: '',
    canva_design_id: '',
    soundcloud_url: ''
  })

  // 1. Load Data
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setFormData({
          username: data.username || '', 
          bio: data.bio || '',
          spotify_playlist_id: data.spotify_playlist_id || '',
          canva_design_id: data.canva_design_id || '',
          soundcloud_url: data.soundcloud_url || ''
        })
      }
      setLoading(false)
    }
    loadProfile()
  }, [router, supabase])

  // 2. Handle Save
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        username: formData.username,
        bio: formData.bio,
        spotify_playlist_id: formData.spotify_playlist_id,
        canva_design_id: formData.canva_design_id,
        soundcloud_url: formData.soundcloud_url
      })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: 'Error: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      router.refresh()
    }
    setSaving(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (loading) return <div style={{padding: '40px', textAlign:'center'}}>Loading settings...</div>

  // Styles
  const inputStyle = {
    display: 'block', width: '100%', padding: '12px', borderRadius: '8px', 
    border: '1px solid #d1d5db', fontSize: '16px', backgroundColor: '#fff', color: '#111827'
  }
  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }
  const sectionTitleStyle = { fontSize: '14px', fontWeight: 'bold', color: '#6b7280', marginTop: '30px', marginBottom: '10px', letterSpacing: '0.05em' }
  const menuItemStyle = { 
    padding: '15px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    textDecoration: 'none', color: '#111827', fontWeight: '500' 
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif', color: '#111827', paddingBottom: '80px' }}>
      <h1 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: '800' }}>Settings</h1>
      
      {message && (
        <div style={{ 
          padding: '12px', borderRadius: '8px', marginBottom: '20px', color: 'white', fontWeight: '500',
          backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444' 
        }}>
          {message.text}
        </div>
      )}

      {/* --- EDIT PROFILE SECTION --- */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={labelStyle}>Username</label>
          <input name="username" value={formData.username} onChange={handleChange} style={inputStyle} placeholder="username" />
        </div>

        <div>
          <label style={labelStyle}>Bio</label>
          <textarea name="bio" value={formData.bio} onChange={handleChange} style={{ ...inputStyle, minHeight: '100px' }} placeholder="Tell us about yourself..." />
        </div>

        <div>
          <label style={labelStyle}>Spotify Playlist ID</label>
          <input name="spotify_playlist_id" value={formData.spotify_playlist_id} onChange={handleChange} style={inputStyle} placeholder="e.g. 37i9dQZF1DXc..." />
        </div>

        <div>
            <label style={labelStyle}>SoundCloud URL</label>
            <input name="soundcloud_url" value={formData.soundcloud_url} onChange={handleChange} style={inputStyle} placeholder="https://soundcloud.com/..." />
        </div>

        <button 
          type="submit"
          disabled={saving}
          style={{ 
            padding: '14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px',
            cursor: saving ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold', marginTop: '10px'
          }}
        >
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>

      {/* --- LEGAL & ACCOUNT SECTION (REQUIRED FOR APP STORE) --- */}
      
      <div style={sectionTitleStyle}>LEGAL & PRIVACY</div>
      <div style={{ borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <Link href="/PrivacyPolicy.md" target="_blank" style={menuItemStyle}>
           <span>📄 Privacy Policy</span> <span style={{color:'#9ca3af'}}>›</span>
        </Link>
        <Link href="/Content_Moderation_Policy.md" target="_blank" style={{ ...menuItemStyle, borderBottom: 'none' }}>
           <span>⚖️ Terms & Moderation</span> <span style={{color:'#9ca3af'}}>›</span>
        </Link>
      </div>

      <div style={sectionTitleStyle}>DANGER ZONE</div>
      <div style={{ borderRadius: '12px', border: '1px solid #fee2e2', overflow: 'hidden' }}>
        <Link href="/delete-account" style={{ ...menuItemStyle, backgroundColor: '#fef2f2', color: '#b91c1c', borderBottom: 'none' }}>
           <span>🗑️ Delete Account</span> <span style={{color:'#b91c1c'}}>›</span>
        </Link>
      </div>

    </div>
  )
}