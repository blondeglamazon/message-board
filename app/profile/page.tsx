'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [userPosts, setUserPosts] = useState<any[]>([])
  
  const router = useRouter()

  useEffect(() => {
    async function getData() {
      // 1. Get Auth User
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // 2. Get Profile Data (Avatar)
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setAvatarUrl(profile.avatar_url)
      }

      // 3. Get User's Post History
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (posts) setUserPosts(posts)
      
      setLoading(false)
    }
    getData()
  }, [])

  // Handle Profile Picture Upload
  async function handleUpdateProfile() {
    if (!uploadFile || !user) return

    try {
      setSaving(true)
      
      // 1. Upload File
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, uploadFile)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath)
      const publicUrl = urlData.publicUrl

      // 3. Update Profile Table
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
            id: user.id, 
            avatar_url: publicUrl,
            updated_at: new Date().toISOString()
        })

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      alert("Profile updated! The sidebar will update on refresh.")
      setUploadFile(null)

    } catch (error: any) {
      alert("Error updating profile: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Simple Helper to Delete a Post
  async function deletePost(postId: string) {
    if (!confirm("Are you sure you want to delete this post?")) return

    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) alert(error.message)
    else {
      setUserPosts(userPosts.filter(p => p.id !== postId))
    }
  }

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading profile...</div>

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px', color: '#111827' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>My Profile</h1>
        <Link href="/" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Feed</Link>
      </div>

      {/* Profile Card */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          
          {/* Avatar Area */}
          <div style={{ position: 'relative' }}>
             {avatarUrl ? (
               <img src={avatarUrl} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #e0e7ff' }} />
             ) : (
               <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                 {user.email?.charAt(0).toUpperCase()}
               </div>
             )}
          </div>

          {/* Info Area */}
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{user.email}</h2>
            <p style={{ color: '#6b7280', margin: 0 }}>Member since: {new Date(user.created_at).toLocaleDateString()}</p>
            
            {/* Upload Control */}
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                style={{ fontSize: '14px' }}
              />
              {uploadFile && (
                <button 
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {saving ? 'Saving...' : 'Save New Photo'}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Post History */}
      <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginBottom: '20px' }}>My Post History</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {userPosts.length === 0 ? (
          <p style={{ color: '#666' }}>You haven't posted anything yet.</p>
        ) : (
          userPosts.map((post) => (
            <div key={post.id} style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', color: 'white' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                 <span style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(post.created_at).toLocaleString()}</span>
                 <button 
                   onClick={() => deletePost(post.id)}
                   style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                 >
                   Delete
                 </button>
               </div>
               <div style={{ fontSize: '16px' }}>{post.content}</div>
               {post.media_url && post.post_type === 'image' && (
                 <img src={post.media_url} style={{ marginTop: '10px', maxWidth: '200px', borderRadius: '8px' }} />
               )}
            </div>
          ))
        )}
      </div>

    </div>
  )
}