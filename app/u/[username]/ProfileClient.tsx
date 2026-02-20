'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation' 
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import BlockButton from '@/components/BlockButton'
import ReportButton from '@/components/ReportButton'


// --- Helper Functions ---

// 1. Safe HTML Renderer (Used by Smart Content)
const renderSafeHTML = (html: string, isFullBackground: boolean = false) => {
  if (!html) return null;
  const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'br', 'strong', 'em', 'b', 'i', 'ul', 'li'],
      ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'frameborder', 'allow', 'allowfullscreen', 'scrolling', 'href', 'target', 'rel', 'title', 'class', 'id', 'loading', 'referrerpolicy', 'allowtransparency'],
      ADD_TAGS: ['iframe', 'link']
  })
  
  return (
    <div style={{ 
      width: '100%', 
      height: isFullBackground ? '100%' : 'auto', 
      borderRadius: isFullBackground ? '0' : '16px', 
      overflow: 'hidden', 
      marginTop: isFullBackground ? '0' : '15px',
      border: isFullBackground ? 'none' : '2px solid #111827',
      display: 'flex', justifyContent: 'center'
    }} 
    className="embed-container"
    dangerouslySetInnerHTML={{ __html: clean }} />
  )
}

// 2. RESTORED: Smart Media Content (Handles Links & HTML)
const getSmartMediaContent = (content: string) => {
  if (!content) return null
  const trimmed = content.trim()

  // A. Check for Spotify Link -> Convert to Embed
  if (trimmed.includes('open.spotify.com')) {
    const match = trimmed.match(/open\.spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/)
    if (match) {
      const [_, type, id] = match
      const embedUrl = `https://open.spotify.com/embed/${type}/${id}`
      return (
        <iframe 
          style={{ borderRadius: '12px', width: '100%', height: '352px', border: 'none', marginTop: '15px' }} 
          src={embedUrl} 
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
          loading="lazy" 
        />
      )
    }
  }

  // B. Check for HTML Tags (Safe Render)
  if (trimmed.startsWith('<')) {
    return renderSafeHTML(trimmed)
  }

  // C. Fallback: Plain Text
  return <p style={{ color: '#111827', fontSize: '16px', margin: 0, lineHeight: '1.4', fontWeight: '500' }}>{content}</p>
}

const renderMedia = (mediaUrl: string) => {
  if (!mediaUrl) return null
  const isVideo = mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i)
  return (
    <div style={{ marginTop: '15px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}>
      {isVideo ? <video src={mediaUrl} controls playsInline style={{ width: '100%', display: 'block' }} /> 
               : <img src={mediaUrl} alt="Post content" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />}
    </div>
  )
}

const getCleanCanvaId = (input: string) => {
  if (!input) return null
  if (input.includes('canva.com')) {
     const match = input.match(/design\/([A-Za-z0-9_-]+)/)
     return match ? match[1] : null
  }
  return (input.includes('<') || input.includes(' ')) ? null : input
}

const getFullHeightEmbed = (embedCode: string) => {
  if (!embedCode) return ''
  return embedCode
    .replace(/height:\s*0;?/g, 'height: 100%;')
    .replace(/padding-top:\s*[^;]+;?/g, '')
    .replace(/position:\s*relative;?/g, 'position: absolute;')
}

// --- Main Component ---

interface UserProfileProps {
  username: string;
}

export default function UserProfile({ username }: UserProfileProps) {
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  const [isEditing, setIsEditing] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)

  const [editForm, setEditForm] = useState({ 
      display_name: '', 
      avatar_url: '', 
      background_url: '', 
      music_embed: '', 
      bio: '' 
  })

  useEffect(() => {
    async function fetchData() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setCurrentUser(authUser)
      if (!username) return
      const cleanUsername = decodeURIComponent(username)

      const { data: profileData } = await supabase.from('profiles').select('*').eq('username', cleanUsername).single()
      
      if (profileData) {
        setProfile(profileData)
        setEditForm({
            display_name: profileData.display_name || '',
            avatar_url: profileData.avatar_url || '',
            background_url: profileData.background_url || '',
            music_embed: profileData.music_embed || '',
            bio: profileData.bio || ''
        })

        const { data: postsData } = await supabase.from('posts').select('*').eq('user_id', profileData.id).order('created_at', { ascending: false })
        setPosts(postsData || [])

        if (authUser) {
          const { data: followData } = await supabase.from('followers').select('*').eq('follower_id', authUser.id).eq('following_id', profileData.id).single()
          setIsFollowing(!!followData)
        }

        const { count: followers } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', profileData.id)
        const { count: following } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', profileData.id)
        
        setFollowerCount(followers || 0)
        setFollowingCount(following || 0)
      }
      setLoading(false)
    }
    fetchData()
  }, [username, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const toggleFollow = async () => {
    if (!currentUser || !profile) return
    if (isFollowing) {
      await supabase.from('followers').delete().match({ follower_id: currentUser.id, following_id: profile.id })
      setIsFollowing(false)
      setFollowerCount(prev => Math.max(0, prev - 1))
    } else {
      await supabase.from('followers').insert({ follower_id: currentUser.id, following_id: profile.id })
      setIsFollowing(true)
      setFollowerCount(prev => prev + 1)
    }
  }

  // Mobile Compliant Image Upload Handler
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'avatar_url' | 'background_url') => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      if (!currentUser) throw new Error("You must be logged in to upload images.");

      if (field === 'avatar_url') setUploadingAvatar(true);
      if (field === 'background_url') setUploadingBg(true);

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${field === 'avatar_url' ? 'avatar' : 'bg'}-${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      setEditForm(prev => ({ ...prev, [field]: publicUrl }));

    } catch (error: any) {
      alert(`Error uploading image: ${error.message}`);
    } finally {
      if (field === 'avatar_url') setUploadingAvatar(false);
      if (field === 'background_url') setUploadingBg(false);
    }
  }

  async function handleSaveProfile() {
      if (!currentUser) return
      const { error } = await supabase.from('profiles').upsert({
          id: currentUser.id,
          username: profile.username,
          display_name: editForm.display_name,
          avatar_url: editForm.avatar_url,
          background_url: editForm.background_url,
          music_embed: editForm.music_embed,
          bio: editForm.bio
      })
      if (error) alert("Error: " + error.message)
      else { setProfile({ ...profile, ...editForm }); setIsEditing(false); }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) {
      alert('Error deleting post: ' + error.message)
    } else {
      setPosts(prev => prev.filter(p => p.id !== postId))
    }
  }

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#111827', fontWeight: 'bold' }}>Loading...</div>
  if (!profile) return <div style={{ padding: '100px', textAlign: 'center', color: '#111827' }}>User not found.</div>

  const isOwnProfile = currentUser?.id === profile.id
  const isEmbedBackground = profile?.background_url && profile.background_url.trim().startsWith('<');
  const canvaId = getCleanCanvaId(profile.canva_design_id)

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Background Layer */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
          {isEmbedBackground ? <div style={{ width: '100%', height: '100%', opacity: 1 }}>{renderSafeHTML(getFullHeightEmbed(profile.background_url), true)}</div>
                             : <div style={{ width: '100%', height: '100%', backgroundImage: profile.background_url ? `url(${profile.background_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f3f4f6' }} />}
      </div>

      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100, display: 'flex', gap: '10px' }}>
        {currentUser ? <button onClick={handleSignOut} style={{ height: '44px', padding: '0 20px', borderRadius: '22px', border: '2px solid #111827', backgroundColor: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', color: '#111827' }}>Log Out</button>
                      : <Link href="/login" style={{ height: '44px', display:'flex', alignItems:'center', padding: '0 20px', borderRadius: '22px', backgroundColor: 'white', color: '#111827', fontWeight: 'bold', textDecoration: 'none', border: '2px solid #111827', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>Log In</Link>}
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: 'calc(80px + env(safe-area-inset-top))', paddingLeft: '20px', paddingRight: '20px', paddingBottom: '100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '24px', border: '2px solid #111827' }}>
          
          <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginBottom: '10px' }}>
            <img src={(isEditing ? editForm.avatar_url : profile.avatar_url) || '/default-avatar.png'} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            
            {/* Clickable camera overlay when editing */}
            {isEditing && (
              <label style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: '24px', zIndex: 10 }}>
                 {uploadingAvatar ? '⏳' : '📷'}
                 <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar_url')} disabled={uploadingAvatar} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: 0 }}>{profile.display_name || profile.username}</h1>
          
          <div style={{ display: 'flex', gap: '20px', marginTop: '15px', marginBottom: '10px' }}>
            <Link href="/following" style={{ textDecoration: 'none', color: '#111827', display: 'flex', flexDirection: 'column', minWidth: '44px', minHeight: '44px', justifyContent: 'center' }}>
              <span style={{ fontWeight: '900', fontSize: '18px' }}>{followingCount}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Following</span>
            </Link>
            <Link href="/friends" style={{ textDecoration: 'none', color: '#111827', display: 'flex', flexDirection: 'column', minWidth: '44px', minHeight: '44px', justifyContent: 'center' }}>
              <span style={{ fontWeight: '900', fontSize: '18px' }}>{followerCount}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Followers</span>
            </Link>
          </div>

          {profile.bio && <p style={{ marginTop: '5px', color: '#111827', fontSize: '15px', fontWeight: '600' }}>{profile.bio}</p>}

          {isEditing && (
            <div style={{ width: '100%', marginBottom: '20px', backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '12px', border: '1px solid #111827', marginTop: '20px', textAlign: 'left' }}>
                <h3 style={{ color: '#111827', marginTop: 0, marginBottom: '15px' }}>Edit Profile</h3>
                
                <label style={{display:'block', fontSize:'14px', fontWeight:'bold', marginBottom:'5px'}}>Display Name</label>
                <input type="text" value={editForm.display_name} onChange={e => setEditForm({...editForm, display_name: e.target.value})} style={{width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'8px', border:'1px solid #d1d5db', fontSize:'16px'}} />
                
                {/* Compliant Avatar Upload Field */}
                <label style={{display:'block', fontSize:'14px', fontWeight:'bold', marginBottom:'5px'}}>Avatar Image</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input type="text" value={editForm.avatar_url} onChange={e => setEditForm({...editForm, avatar_url: e.target.value})} placeholder="URL or click upload..." style={{flex: 1, padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', fontSize:'16px'}} />
                  <label style={{ backgroundColor: '#e5e7eb', padding: '0 15px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '44px', minWidth: '44px', cursor: 'pointer', color: '#111827' }}>
                    {uploadingAvatar ? '⏳' : '📁 Upload'}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar_url')} disabled={uploadingAvatar} style={{ display: 'none' }} />
                  </label>
                </div>

                {/* Compliant Background Upload Field */}
                <label style={{display:'block', fontSize:'14px', fontWeight:'bold', marginBottom:'5px'}}>Background (URL, Embed, or Image)</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input type="text" value={editForm.background_url} onChange={e => setEditForm({...editForm, background_url: e.target.value})} placeholder="URL, iframe, or upload..." style={{flex: 1, padding:'10px', borderRadius:'8px', border:'1px solid #d1d5db', fontSize:'16px'}} />
                  <label style={{ backgroundColor: '#e5e7eb', padding: '0 15px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '44px', minWidth: '44px', cursor: 'pointer', color: '#111827' }}>
                    {uploadingBg ? '⏳' : '📁 Upload'}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'background_url')} disabled={uploadingBg} style={{ display: 'none' }} />
                  </label>
                </div>

                <label style={{display:'block', fontSize:'14px', fontWeight:'bold', marginBottom:'5px'}}>Spotify Link or Embed Code</label>
                <textarea value={editForm.music_embed} onChange={e => setEditForm({...editForm, music_embed: e.target.value})} style={{width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'8px', border:'1px solid #d1d5db', height:'80px', fontSize:'16px'}} />
                
                <label style={{display:'block', fontSize:'14px', fontWeight:'bold', marginBottom:'5px'}}>Bio</label>
                <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} style={{width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'8px', border:'1px solid #d1d5db', height:'80px', fontSize:'16px'}} />
                
                <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                    <button onClick={handleSaveProfile} style={{backgroundColor:'#111827', color:'white', border:'none', padding:'10px 20px', borderRadius:'22px', cursor:'pointer', fontWeight:'bold', height:'44px'}}>Save Changes</button>
                    <button onClick={() => setIsEditing(false)} style={{backgroundColor:'#ffffff', color:'#111827', border:'2px solid #111827', padding:'10px 20px', borderRadius:'22px', cursor:'pointer', fontWeight:'bold', height:'44px'}}>Cancel</button>
                </div>
            </div>
          )}

          {/* Use Smart Renderer here */}
          {!isEditing && profile.music_embed && getSmartMediaContent(profile.music_embed)}
          
          {!isEditing && canvaId && renderSafeHTML(`<div style="position: relative; width: 100%; height: 0; padding-top: 56.25%; overflow: hidden; border-radius: 12px;"><iframe loading="lazy" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none;" src="https://www.canva.com/design/${canvaId}/view?embed" allowfullscreen="allowfullscreen" allow="fullscreen"></iframe></div>`, true)}

          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {!isOwnProfile && currentUser && <button onClick={toggleFollow} style={{ height: '44px', padding: '0 20px', borderRadius: '22px', fontWeight: 'bold', backgroundColor: isFollowing ? '#ffffff' : '#111827', color: isFollowing ? '#111827' : '#ffffff', border: '2px solid #111827' }}>{isFollowing ? 'Following' : 'Follow'}</button>}
              {isOwnProfile && !isEditing && <button onClick={() => setIsEditing(true)} style={{ height: '44px', padding: '0 20px', borderRadius: '22px', backgroundColor: '#111827', color: 'white', fontWeight: 'bold' }}>✏️ Edit Profile</button>}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#111827', textShadow: '0 1px 1px white' }}>Recent Posts</h3>
          {posts.map(post => (
             <PostCard key={post.id} post={post} currentUser={currentUser} isOwnProfile={isOwnProfile} onDelete={handleDeletePost} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PostCard({ post, currentUser, isOwnProfile, onDelete }: { post: any, currentUser: any, isOwnProfile: boolean, onDelete: (id: string) => void }) {
  const supabase = createClient()
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [commentsCount, setCommentsCount] = useState(0)

  useEffect(() => {
    async function fetchInteractions() {
      const { count: lCount } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id)
      setLikesCount(lCount || 0)
      const { count: cCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id)
      setCommentsCount(cCount || 0)
      if (currentUser) {
        const { data } = await supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', currentUser.id).single()
        setLiked(!!data)
      }
    }
    fetchInteractions()
  }, [post.id, currentUser, supabase])

  const toggleLike = async () => {
    if (!currentUser) return
    if (liked) {
      setLiked(false); setLikesCount(p => Math.max(0, p - 1))
      await supabase.from('likes').delete().match({ post_id: post.id, user_id: currentUser.id })
    } else {
      setLiked(true); setLikesCount(p => p + 1)
      await supabase.from('likes').insert({ post_id: post.id, user_id: currentUser.id })
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/p/${post.id}`
    if (navigator.share) {
      try { await navigator.share({ title: `Post by ${post.profiles?.display_name || 'User'}`, text: post.content, url: url }) } catch (err) { console.log('Share canceled') }
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied!')
    }
  }

  return (
    <div style={{ padding: '20px', borderRadius: '20px', border: '2px solid #111827', backgroundColor: 'rgba(255,255,255,0.95)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', minHeight: '44px', alignItems: 'center' }}>
         <span style={{ fontSize: '12px', color: '#111827', fontWeight: '900' }}>{new Date(post.created_at).toLocaleDateString()}</span>
         
         {/* Compliance: 44px Delete/Report Targets */}
         {isOwnProfile ? (
            <button onClick={() => onDelete(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 'bold', fontSize: '14px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Delete
            </button>
         ) : (
            <ReportButton postId={post.id} />
         )}
      </div>
      
      {/* Use Smart Renderer for Posts */}
      {getSmartMediaContent(post.content)}
      
      {post.media_url && renderMedia(post.media_url)}

      {/* Compliance: 44px Interaction Targets */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
        <button onClick={toggleLike} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '16px', color: liked ? '#ef4444' : '#111827', padding: '0 10px', minHeight: '44px', minWidth: '44px' }}>
           <span style={{ fontSize: '20px' }}>{liked ? '❤️' : '🤍'}</span>
           <span style={{ fontWeight: 'bold' }}>{likesCount}</span>
        </button>
        <Link href={`/p/${post.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', color: '#111827', fontSize: '16px', padding: '0 10px', minHeight: '44px', minWidth: '44px' }}>
           <span style={{ fontSize: '20px' }}>💬</span>
           <span style={{ fontWeight: 'bold' }}>{commentsCount}</span>
        </Link>
        <button onClick={handleShare} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '16px', color: '#111827', padding: '0 10px', minHeight: '44px', minWidth: '44px' }}>
           <span style={{ fontSize: '20px' }}>📤</span>
        </button>
      </div>
    </div>
  )
}