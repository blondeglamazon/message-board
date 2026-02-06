'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, bio')
          .eq('id', user.id)
          .single()

        if (data) {
          setUsername(data.username || '')
          setBio(data.bio || '')
        }
      }
    }
    getProfile()
  }, [])

  async function handleSave() {
    setLoading(true)
    setMessage({ type: '', text: '' })
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to save settings.' })
      setLoading(false)
      return
    }

    // Clean username one last time before saving
    const finalUsername = username.trim().toLowerCase()

    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id, 
        username: finalUsername, 
        bio: bio.trim()
      })

    if (error) {
      console.error('Update error:', error)
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    }
    
    setLoading(false)
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif', color: 'white' }}>
      <h1 style={{ marginBottom: '20px' }}>User Settings</h1>
      
      {message.text && (
        <div style={{ 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '20px', 
          backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444' 
        }}>
          {message.text}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username</label>
        <input 
          style={{ 
            display: 'block', 
            width: '100%', 
            padding: '10px', 
            borderRadius: '5px', 
            border: '1px solid #444',
            backgroundColor: '#111',
            color: 'white' 
          }}
          value={username} 
          onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())} 
          placeholder="Enter username"
          pattern="^[a-z0-9_]+$"
          title="Usernames can only contain lowercase letters, numbers, and underscores."
        />
        <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
          Only lowercase letters, numbers, and underscores. No spaces allowed.
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bio</label>
        <textarea 
          style={{ 
            display: 'block', 
            width: '100%', 
            padding: '10px', 
            borderRadius: '5px', 
            border: '1px solid #444',
            backgroundColor: '#111',
            color: 'white',
            minHeight: '100px'
          }}
          value={bio} 
          onChange={(e) => setBio(e.target.value)} 
          placeholder="Tell us about yourself"
        />
      </div>

      <button 
        onClick={handleSave}
        disabled={loading}
        style={{ 
          padding: '12px 24px', 
          background: '#0070f3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          width: '100%'
        }}
      >
        {loading ? 'Saving Changes...' : 'Save Settings'}
      </button>

      <hr style={{ margin: '40px 0', borderColor: '#333' }} />
      
      <div style={{ textAlign: 'center' }}>
        <p style={{ marginBottom: '15px', color: '#aaa' }}>Customize your profile banner or featured images:</p>
        <a 
          href="https://www.canva.com/developers/app/AAHAAAsgl1s" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            textDecoration: 'none',
            padding: '10px 20px',
            border: '2px solid #00d4ff',
            color: '#00d4ff',
            borderRadius: '5px',
            fontWeight: 'bold',
            display: 'inline-block'
          }}
        >
          Design on Canva
        </a>
      </div>
    </div>
  )
}