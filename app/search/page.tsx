'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import Link from 'next/link'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const supabase = createClient()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .ilike('username', `%${query}%`)
      .limit(10)

    setResults(data || [])
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: 'calc(80px + env(safe-area-inset-top)) 20px' }}>
      <h1 style={{ color: '#111827', fontSize: '28px', fontWeight: '800' }}>Search</h1>
      
      <form onSubmit={handleSearch} style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search usernames..."
          style={{ 
            flex: 1, height: '44px', borderRadius: '22px', border: '2px solid #111827', 
            padding: '0 20px', fontSize: '16px', color: '#111827' 
          }}
        />
        <button type="submit" style={{ 
          height: '44px', padding: '0 24px', borderRadius: '22px', 
          backgroundColor: '#111827', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer'
        }}>
          Find
        </button>
      </form>

      <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {results.map(user => (
          <Link key={user.username} href={`/u/${user.username}`} style={{ textDecoration: 'none' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', 
              borderRadius: '12px', border: '1px solid #111827', backgroundColor: 'white' 
            }}>
              <img src={user.avatar_url || '/default-avatar.png'} alt="" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ color: '#111827', fontWeight: 'bold', fontSize: '18px' }}>
                {user.display_name || user.username}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}