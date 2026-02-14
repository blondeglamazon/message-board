'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
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
          username: data.homepage_slug || '', // Note: using homepage_slug as username
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
    setMessage({ type: '', text: '' })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        homepage_slug: formData.username,
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

  // Helper to update state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (loading) return <div style={{padding: '40px', color: 'white'}}>Loading settings...</div>

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif', color: '#111827' }}>
      <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>Profile Settings</h1>
      
      {message.text && (
        <div style={{ 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '20px', 
          color: 'white',
          backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444' 
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username (Slug)</label>
          <input 
            name="username"
            value={formData.username} 
            onChange={handleChange}
            style={inputStyle}
            placeholder="username"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bio</label>
          <textarea 
            name="bio"
            value={formData.bio} 
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: '100px' }}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Spotify Playlist ID</label>
          <input 
            name="spotify_playlist_id"
            value={formData.spotify_playlist_id} 
            onChange={handleChange}
            style={inputStyle}
            placeholder="e.g. 37i9dQZF1DXcBWIGoYBM5M"
          />
        </div>

        <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>SoundCloud URL</label>
            <input 
              name="soundcloud_url"
              value={formData.soundcloud_url} 
              onChange={handleChange}
              style={inputStyle}
              placeholder="https://soundcloud.com/..."
            />
        </div>

        <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Canva Design ID</label>
            <input 
              name="canva_design_id"
              value={formData.canva_design_id} 
              onChange={handleChange}
              style={inputStyle}
              placeholder="Canva Embed ID"
            />
        </div>

        <button 
          type="submit"
          disabled={saving}
          style={{ 
            padding: '12px 24px', 
            background: '#6366f1', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginTop: '10px'
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}

const inputStyle = {
  display: 'block', 
  width: '100%', 
  padding: '10px', 
  borderRadius: '6px', 
  border: '1px solid #ccc',
  fontSize: '16px'
}