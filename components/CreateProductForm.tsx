'use client'

import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { createClient } from '@/app/lib/supabase/client'

export default function CreateProductForm() {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 👈 Initialize Supabase
  const supabase = createClient() 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Convert dollar string (e.g. "5.50") to cents safely (e.g. 550)
    const priceInCents = Math.round(parseFloat(price) * 100)

    if (isNaN(priceInCents) || priceInCents <= 0) {
      setMessage('❌ Please enter a valid price greater than $0.')
      setLoading(false)
      return
    }

    try {
      // 1. Grab the user's active session token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      // 2. If on mobile, force the app to talk to the live web server
      const baseUrl = Capacitor.isNativePlatform() ? 'https://www.vimciety.com' : ''

      // 3. Pass the token securely in the headers
      const res = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          title, 
          price_in_cents: priceInCents,
          description 
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setMessage('✅ Product created successfully!')
      
      // Clear the form
      setTitle('')
      setPrice('')
      setDescription('')
      
    } catch (err: any) {
      setMessage(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#1F2937', padding: '24px', borderRadius: '12px', border: '1px solid #374151', marginTop: '24px' }}>
      <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
        ➕ Create a New Product
      </h3>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Title Input */}
        <div>
          <label style={{ display: 'block', color: '#9CA3AF', fontSize: '14px', marginBottom: '6px' }}>Product Title</label>
          <input
            type="text"
            required
            placeholder="e.g., 1-on-1 Coaching Call"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: '#374151', color: 'white' }}
          />
        </div>

        {/* 🛠️ ADDED: Description Input */}
        <div>
          <label style={{ display: 'block', color: '#9CA3AF', fontSize: '14px', marginBottom: '6px' }}>Description</label>
          <textarea
            required
            placeholder="Describe what your followers are getting..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: '#374151', color: 'white', minHeight: '80px', resize: 'vertical' }}
          />
        </div>

        {/* Price Input */}
        <div>
          <label style={{ display: 'block', color: '#9CA3AF', fontSize: '14px', marginBottom: '6px' }}>Price (USD)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }}>$</span>
            <input
              type="number"
              required
              min="0.50"
              step="0.01"
              placeholder="5.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 28px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: '#374151', color: 'white' }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{ 
            marginTop: '8px', padding: '12px', borderRadius: '8px', border: 'none', 
            backgroundColor: loading ? '#4B5563' : '#6366F1', color: 'white', 
            fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? 'Saving...' : 'Create Product'}
        </button>

        {/* Success/Error Message */}
        {message && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: message.startsWith('✅') ? '#34D399' : '#F87171' }}>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}