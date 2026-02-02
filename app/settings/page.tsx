'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

  // Load existing profile data on page load
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
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          username, 
          bio,
          updated_at: new Date().toISOString() 
        })

      if (error) {
        alert('Error updating profile: ' + error.message)
      } else {
        alert('Profile updated successfully!')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '20px' }}>User Settings</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username</label>
        <input 
          style={{ 
            display: 'block', 
            width: '100%', 
            padding: '10px', 
            borderRadius: '5px', 
            border: '1px solid #ccc',
            color: 'black' 
          }}
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          placeholder="Enter username"
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bio</label>
        <textarea 
          style={{ 
            display: 'block', 
            width: '100%', 
            padding: '10px', 
            borderRadius: '5px', 
            border: '1px solid #ccc',
            color: 'black',
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
          fontSize: '16px'
        }}
      >
        {loading ? 'Saving Changes...' : 'Save Settings'}
      </button>

      <hr style={{ margin: '40px 0' }} />
      
      <div style={{ textAlign: 'center' }}>
        <p style={{ marginBottom: '15px', color: '#666' }}>Customize your profile banner or featured images:</p>
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
            fontWeight: 'bold'
          }}
        >
          Design on Canva
        </a>
      </div>
    </div>
  )
}