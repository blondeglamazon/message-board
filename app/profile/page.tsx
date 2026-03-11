'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import DOMPurify from 'isomorphic-dompurify'
import Sidebar from '@/components/Sidebar'
import { App as CapacitorApp } from '@capacitor/app'
import { Network } from '@capacitor/network'
import { Capacitor } from '@capacitor/core';

// @ts-ignore
import Microlink from '@microlink/react'

// ============================================================================
// 🔒 STRICT SECURITY & SANITIZATION RULES
// ============================================================================

const TRUSTED_EMBED_DOMAINS = [
  'spotify.com',                                             
  'canva.com',                                               
  'spotify.com',              
  'youtube.com',
  'www.youtube-nocookie.com',
  'soundcloud.com',
  'apple.com',
  'amazon.com',
  'amzn.to',
  'widgets.shein.com',
  'temu.com',
  'googleusercontent.com',
  'square.site',
  'squareup.com'
];

if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'IFRAME') {
      const src = node.getAttribute('src') || '';
      const isTrusted = TRUSTED_EMBED_DOMAINS.some(domain => 
        src.toLowerCase().includes(domain.toLowerCase())
      );
      if (!isTrusted) {
        node.setAttribute('src', 'about:blank');
        (node as HTMLElement).style.display = 'none';
      }
    }
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

// ============================================================================
// 🎨 CENTRALIZED STYLES
// ============================================================================
const STYLES = {
  card: { backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', marginBottom: '30px', border: '1px solid #374151', color: 'white' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: 'none', color: 'white', backgroundColor: '#374151', minHeight: '44px', boxSizing: 'border-box' as const },
  btnPrimary: { backgroundColor: '#6366f1', color: 'white', fontWeight: 'bold' as const, border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', minHeight: '44px', display: 'inline-flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const },
  btnSecondary: { backgroundColor: '#4b5563', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', minHeight: '44px', fontWeight: 'bold' as const },
  btnDanger: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' as const, minHeight: '44px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' as const, alignItems: 'center' as const, gap: '6px', minWidth: '44px', minHeight: '44px', padding: 0 }
};

const MAX_POST_LENGTH = 500;
const MAX_COMMENT_LENGTH = 300;
const POSTS_PER_PAGE = 20;

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
const VALID_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
const VALID_UPLOAD_TYPES = [...VALID_IMAGE_TYPES, ...VALID_VIDEO_TYPES];
const MAX_IMAGE_SIZE_MB = 20;
const MAX_VIDEO_SIZE_MB = 500;

// ============================================================================
// 📹 VIDEO PLAYER WITH MONETIZATION TRACKING
// ============================================================================
function MonetizedVideoPlayer({ post, currentUser, supabase }: { post: any, currentUser: any, supabase: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedTime = useRef(0);
  const lastDebugTime = useRef(0);

  const handleTimeUpdate = async () => {
    const video = videoRef.current;
    if (!video) return;

    const currentTime = Math.floor(video.currentTime);

    if (currentTime > 0 && currentTime % 2 === 0 && currentTime !== lastDebugTime.current) {
        lastDebugTime.current = currentTime;
        console.log(`[Timer: ${currentTime}s] Logged In: ${!!currentUser} | Is My Video: ${currentUser?.id === post.user_id}`);
    }

    if (currentTime >= 5 && currentTime - lastSavedTime.current >= 5) {
      if (!currentUser || post.user_id === currentUser.id) return;

      lastSavedTime.current = currentTime;

      const { error } = await supabase.from('video_views').upsert({
        post_id: post.id,
        viewer_id: currentUser.id,
        watch_time_seconds: currentTime
      }, { onConflict: 'post_id, viewer_id' }); 
      
      if (error) console.error("❌ Supabase Error:", error.message, error.details);
    }
  };

  return (
    <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', maxWidth: '100%' }}>
      <video ref={videoRef} src={post.media_url} controls playsInline preload="metadata" onTimeUpdate={handleTimeUpdate} style={{ width: '100%', display: 'block' }} />
    </div>
  );
}

// ============================================================================
// UI COMPONENT
// ============================================================================

function ProfileContent() {
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    message: string;
    onConfirm: (inputValue?: string) => void;
    showInput?: boolean;
    inputPlaceholder?: string;
  } | null>(null);
  const [confirmInput, setConfirmInput] = useState('');

  const [supabase] = useState(() => createClient())
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [profileUser, setProfileUser] = useState<any>(null) 
  const [currentUser, setCurrentUser] = useState<any>(null) 
  const [posts, setPosts] = useState<any[]>([])
  
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({})
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  
  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ 
      display_name: '', avatar_url: '', background_url: '', music_embed: '', 
      bio: '', calendly_url: '', google_calendar_url: '', store_url: '', store_url_2: '', store_url_3: ''
  })

  // Post Creation State
  const [postText, setPostText] = useState('')
  const [postFile, setPostFile] = useState<File | null>(null)
  const [postFilePreview, setPostFilePreview] = useState<string | null>(null) 
  const [isSelling, setIsSelling] = useState(false)
  const [productLink, setProductLink] = useState('')

  // 🤖 AI States
  const [postTopic, setPostTopic] = useState('');
  const [postTone, setPostTone] = useState('funny');
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({})
  const [openComments, setOpenComments] = useState<Set<string>>(new Set())
  const [isBlocked, setIsBlocked] = useState(false)

  const targetId = searchParams.get('id')
  const targetSlug = searchParams.get('u')

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initNetwork = async () => {
        const status = await Network.getStatus();
        setIsOffline(!status.connected);
    };
    initNetwork();
    
    const listenerPromise = Network.addListener('networkStatusChange', status => {
        setIsOffline(!status.connected);
        if (status.connected) showToast("Back online!");
    });
    
    return () => { listenerPromise.then(handle => handle.remove()); }
  }, []);

  useEffect(() => {
    const handleUrlOpen = (event: any) => {
      if (event.url.includes('vimciety://')) router.push(event.url.replace('vimciety://', '/'));
    };
    const listenerPromise = CapacitorApp.addListener('appUrlOpen', handleUrlOpen);
    return () => { listenerPromise.then(handle => handle.remove()); };
  }, [router]);

  useEffect(() => {
    const checkGoogleConnection = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.identities) setIsGoogleLinked(user.identities.some((id) => id.provider === 'google'));
    };
    checkGoogleConnection();
  }, [supabase.auth]);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      const { data: { user: loggedInUser } } = await supabase.auth.getUser()
      setCurrentUser(loggedInUser)

      let profileData = null
      if (targetId) profileData = (await supabase.from('profiles').select('*').eq('id', targetId).single()).data
      else if (targetSlug) profileData = (await supabase.from('profiles').select('*').eq('username', targetSlug).single()).data
      else if (loggedInUser) profileData = (await supabase.from('profiles').select('*').eq('id', loggedInUser.id).single()).data

      if (!profileData) { setLoading(false); return; }
      const userIdToFetch = profileData.id

      const [allProfilesRes, blockDataRes, userPostsRes, firstPostRes, followersRes, followingRes, historyRes] = await Promise.all([
        supabase.from('profiles').select('id, username, display_name, avatar_url'),
        (loggedInUser && loggedInUser.id !== userIdToFetch) ? supabase.from('blocks').select('id').eq('blocker_id', loggedInUser.id).eq('blocked_id', userIdToFetch).single() : Promise.resolve({ data: null }),
        supabase.from('posts').select('email').eq('user_id', userIdToFetch).not('email', 'is', null).order('created_at', { ascending: false }).limit(1),
        supabase.from('posts').select('created_at').eq('user_id', userIdToFetch).order('created_at', { ascending: true }).limit(1),
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userIdToFetch),
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userIdToFetch),
        supabase.from('posts').select(`*, likes ( user_id ), comments ( id, content, email, user_id, created_at )`).eq('user_id', userIdToFetch).order('created_at', { ascending: false }).range(0, POSTS_PER_PAGE - 1)
      ]);
      
      const pMap: Record<string, any> = {}
      allProfilesRes.data?.forEach((p: any) => { pMap[p.id] = p })
      setProfilesMap(pMap)

      if (blockDataRes.data) setIsBlocked(true)

      let email = profileData?.email || 'Unknown User'
      let memberSince = new Date().toLocaleDateString()
      if (userPostsRes.data && userPostsRes.data.length > 0) email = userPostsRes.data[0].email
      if (firstPostRes.data && firstPostRes.data.length > 0) memberSince = new Date(firstPostRes.data[0].created_at).toLocaleDateString()

      setFollowerCount(followersRes.count || 0)
      setFollowingCount(followingRes.count || 0)

      setProfileUser({ 
          id: userIdToFetch, email, memberSince,
          display_name: profileData?.display_name || '', avatar_url: profileData?.avatar_url || '', background_url: profileData?.background_url || '', music_embed: profileData?.music_embed || '',
          bio: profileData?.bio || '', calendly_url: profileData?.calendly_url || '', google_calendar_url: profileData?.google_calendar_url || '', store_url: profileData?.store_url || '', store_url_2: profileData?.store_url_2 || '', store_url_3: profileData?.store_url_3 || ''
      })
      
      if (loggedInUser && loggedInUser.id === userIdToFetch) {
          setEditForm({ ...profileData, display_name: profileData?.display_name || '' })
      }

      if (historyRes.data) {
          setPosts(historyRes.data)
          if (historyRes.data.length < POSTS_PER_PAGE) setHasMorePosts(false)
      }
      setLoading(false)
    }
    loadProfile()
  }, [targetId, targetSlug, supabase])

  // ============================================================================
  // ✨ AI FUNCTIONS
  // ============================================================================
  const handleMagicBio = async () => {
    if (!editForm.bio) return showToast("Type a few keywords in the bio box first!", 'error');
    if (isOffline) return showToast("Cannot use AI while offline.", 'error');
    
    setIsGeneratingBio(true);
    try {
      const response = await fetch('/api/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bio', prompt: editForm.bio })
      });
      const data = await response.json();
      if (data.text) {
        setEditForm({ ...editForm, bio: data.text });
        showToast("✨ Magic Bio generated!");
      } else {
        showToast("Failed to generate.", 'error');
      }
    } catch (error) {
      showToast("Error connecting to AI.", 'error');
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleMagicPost = async () => {
    if (!postTopic) return showToast("Please tell me what your post is about!", 'error');
    if (isOffline) return showToast("Cannot use AI while offline.", 'error');
    
    setIsGeneratingPost(true);
    try {
      const response = await fetch('/api/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'post', prompt: postTopic, tone: postTone })
      });
      const data = await response.json();
      if (data.text) {
        setPostText(data.text);
        showToast("✨ Post generated!");
      } else {
        showToast("Failed to generate.", 'error');
      }
    } catch (error) {
      showToast("Error connecting to AI.", 'error');
    } finally {
      setIsGeneratingPost(false);
    }
  };

  async function loadMorePosts() {
      if (isOffline) return showToast("You are offline.", 'error');
      setLoadingMore(true);
      const start = posts.length;
      
      const { data } = await supabase.from('posts').select(`*, likes ( user_id ), comments ( id, content, email, user_id, created_at )`)
          .eq('user_id', profileUser.id).order('created_at', { ascending: false }).range(start, start + POSTS_PER_PAGE - 1);

      if (data) {
          if (data.length < POSTS_PER_PAGE) setHasMorePosts(false);
          setPosts(prev => [...prev, ...data]);
      }
      setLoadingMore(false);
  }

  async function handleSaveProfile() {
      if (!currentUser || isOffline) return isOffline && showToast("Cannot save while offline.", 'error');
      setActionLoading(prev => ({...prev, saveProfile: true}))
      const { error } = await supabase.from('profiles').upsert({ id: currentUser.id, ...editForm })
      if (!error) { setProfileUser({ ...profileUser, ...editForm }); setIsEditing(false); showToast("Profile saved!"); }
      setActionLoading(prev => ({...prev, saveProfile: false}))
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) { clearFile(); return; }
    
    if (!VALID_UPLOAD_TYPES.includes(file.type)) return showToast("Invalid file type.", 'error');
    const maxSize = VALID_VIDEO_TYPES.includes(file.type) ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;
    if (file.size > maxSize * 1024 * 1024) return showToast(`File too large. Max is ${maxSize}MB.`, 'error');

    setPostFile(file);
    setPostFilePreview(URL.createObjectURL(file));
  }

  function clearFile() {
    setPostFile(null);
    if (postFilePreview) URL.revokeObjectURL(postFilePreview);
    setPostFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleCreatePost() {
    if (!currentUser || isOffline) return;
    setActionLoading(prev => ({...prev, createPost: true}))

    const cleanText = DOMPurify.sanitize(postText, { ALLOWED_TAGS: [] }).trim()
    if (!cleanText && !postFile) return setActionLoading(prev => ({...prev, createPost: false}));

    let mediaUrl = null; let postType = 'text';
    if (postFile) {
        postType = VALID_VIDEO_TYPES.includes(postFile.type) ? 'video' : 'image';
        const filePath = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${postFile.name.split('.').pop()}`
        const { error } = await supabase.storage.from('posts').upload(filePath, postFile)
        if (!error) mediaUrl = supabase.storage.from('posts').getPublicUrl(filePath).data.publicUrl
    }

    const { data, error } = await supabase.from('posts').insert({ user_id: currentUser.id, content: cleanText, media_url: mediaUrl, post_type: postType, is_sell_post: isSelling, product_link: isSelling ? productLink : null }).select().single()
    if (!error && data) {
        setPosts([{ ...data, likes: [], comments: [] }, ...posts])
        setPostText(''); setPostTopic(''); clearFile(); setIsSelling(false); setProductLink('');
        showToast("Post created!");
    }
    setActionLoading(prev => ({...prev, createPost: false}))
  }

  async function handleDelete(postId: string) {
      if (isOffline) return showToast("Cannot delete while offline.", 'error');
      setConfirmModal({ message: "Delete this post?", onConfirm: async () => {
          setConfirmModal(null); setActionLoading(prev => ({...prev, [`delete-${postId}`]: true}));
          const { error } = await supabase.from('posts').delete().eq('id', postId);
          if (!error) setPosts(prev => prev.filter(p => p.id !== postId));
          setActionLoading(prev => ({...prev, [`delete-${postId}`]: false}));
      }});
  }

  async function handleLike(postId: string, isLiked: boolean) {
    if (!currentUser || isOffline || actionLoading[`like-${postId}`]) return;
    setActionLoading(prev => ({...prev, [`like-${postId}`]: true}))
    setPosts(prev => prev.map(msg => msg.id === postId ? { ...msg, likes: isLiked ? msg.likes.filter((l: any) => l.user_id !== currentUser.id) : [...(msg.likes || []), { user_id: currentUser.id }] } : msg));
    try {
        if (isLiked) await supabase.from('likes').delete().match({ user_id: currentUser.id, post_id: postId });
        else await supabase.from('likes').insert({ user_id: currentUser.id, post_id: postId });
    } catch (err) {}
    setActionLoading(prev => ({...prev, [`like-${postId}`]: false}))
  }

  const toggleComments = (postId: string) => {
    const newSet = new Set(openComments); newSet.has(postId) ? newSet.delete(postId) : newSet.add(postId);
    setOpenComments(newSet);
  }

  async function handlePostComment(postId: string) {
    if (!currentUser || isOffline) return;
    const cleanText = DOMPurify.sanitize(commentText[postId] || '', { ALLOWED_TAGS: [] }).trim()
    if (!cleanText) return;
    setActionLoading(prev => ({...prev, [`comment-${postId}`]: true}))
    
    const { data } = await supabase.from('comments').insert({ post_id: postId, user_id: currentUser.id, email: currentUser.email, content: cleanText }).select().single()
    if (data) {
        setPosts(prev => prev.map(msg => msg.id === postId ? { ...msg, comments: [...(msg.comments || []), data] } : msg));
        setCommentText(prev => ({ ...prev, [postId]: '' }));
    }
    setActionLoading(prev => ({...prev, [`comment-${postId}`]: false}))
  }

  const handleShare = async (postId: string) => {
      const url = `https://www.vimciety.com/post/${postId}`;
      if (navigator.share) try { await navigator.share({ title: 'Check out this post on VIMciety', url }); } catch {}
      else { await navigator.clipboard.writeText(url); showToast("Link copied to clipboard!"); }
  };

  async function handleBlockUser() {
      setConfirmModal({ message: `Block user?`, onConfirm: async () => {
          setConfirmModal(null); setActionLoading(prev => ({...prev, blockUser: true}));
          const { error } = await supabase.from('blocks').insert({ blocker_id: currentUser.id, blocked_id: profileUser.id });
          if (!error) { setIsBlocked(true); router.push('/'); } 
          setActionLoading(prev => ({...prev, blockUser: false}));
      }});
  }

  async function handleReportPost(postId: string) {
      setConfirmModal({ message: "Why are reporting?", showInput: true, onConfirm: async (inputValue) => {
          setConfirmModal(null); setConfirmInput(''); setActionLoading(prev => ({...prev, [`report-${postId}`]: true}));
          await supabase.from('reports').insert({ post_id: postId, reporter_id: currentUser.id, reason: inputValue?.trim() || 'No reason provided' });
          showToast("Report submitted.");
          setActionLoading(prev => ({...prev, [`report-${postId}`]: false}));
      }});
  }

  const renderSafeHTML = (html: string) => {
      if (!html) return null;
      const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'br', 'strong', 'em', 'b', 'i', 'ul', 'li'], ALLOWED_ATTR: ['src', 'href', 'target', 'width', 'height', 'style', 'title', 'class', 'id', 'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'loading', 'referrerpolicy'] })
      return <div dangerouslySetInnerHTML={{ __html: clean }} />
  }

  const renderPostContent = (post: any) => {
    if (post.post_type === 'embed') return <div style={{marginTop:'10px', overflow:'hidden', borderRadius:'8px'}}>{renderSafeHTML(post.content)}</div>;
    const urls = post.content?.match(/(https?:\/\/[^\s]+)/g);
    
    return (
      <div style={{ lineHeight: '1.5' }}>
        <p style={{ whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word' }}>
            {post.content?.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) => part.match(/(https?:\/\/[^\s]+)/g) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'underline' }}>{part}</a> : <span key={i}>{part}</span>)}
        </p>
        {urls && urls[0] && (
          <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', marginTop: '15px' }}>
              <Microlink url={urls[0]} size="large" style={{ width: '100%', minWidth: 0, borderRadius: '10px', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading Profile...</div>
  if (!profileUser) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Profile not found.</div>

  const isMyProfile = currentUser && profileUser && currentUser.id === profileUser.id
  const isEmbedBackground = profileUser?.background_url && profileUser.background_url.trim().startsWith('<');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', backgroundColor: '#111827' }}>
      
      {confirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#1f2937', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', border: '1px solid #374151' }}>
            <p style={{ color: 'white', fontSize: '16px', marginTop: 0, marginBottom: '16px' }}>{confirmModal.message}</p>
            {confirmModal.showInput && <input type="text" value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} placeholder={confirmModal.inputPlaceholder || ''} style={{ ...STYLES.input, marginBottom: '16px' }} autoFocus />}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setConfirmModal(null); setConfirmInput(''); }} style={STYLES.btnSecondary}>Cancel</button>
              <button onClick={() => confirmModal.onConfirm(confirmInput)} style={STYLES.btnPrimary}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {isOffline && <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', backgroundColor: '#ef4444', color: 'white', textAlign: 'center', padding: '10px', zIndex: 10000, fontWeight: 'bold' }}>No Internet Connection</div>}

      {toast && (
        <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: toast.type === 'error' ? '#ef4444' : '#22c55e', color: 'white', padding: '12px 24px', borderRadius: '24px', zIndex: 9999, fontWeight: 'bold', fontSize: '14px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
            {toast.msg}
        </div>
      )}

      <Sidebar />
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {isEmbedBackground ? <div style={{ width: '100%', height: '100%', opacity: 0.6 }}>{renderSafeHTML(profileUser.background_url)}</div> : <div style={{ width: '100%', height: '100%', backgroundImage: profileUser?.background_url ? `url(${profileUser.background_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />}
      </div>

      <div style={{ position: 'relative', zIndex: 1, backgroundColor: 'rgba(0,0,0,0.5)', minHeight: '100vh', padding: '20px', paddingTop: isOffline ? '60px' : '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, color: 'white', fontSize: '28px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{isMyProfile ? 'My Profile' : `${profileUser.display_name || 'User'}'s Profile`}</h1>
                <button onClick={() => router.push('/')} style={{ ...STYLES.btnSecondary, backgroundColor: 'white', color: '#333' }}>← Back to Feed</button>
            </header>

            {isBlocked ? (
                <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '20px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold' }}>You have blocked this user.</div>
            ) : (
              <>
                {isEditing && (
                    <div style={STYLES.card}>
                        <h3 style={{ color: 'white', marginTop: 0 }}>Edit Profile Theme</h3>
                        <input type="text" value={editForm.display_name} onChange={e => setEditForm({...editForm, display_name: e.target.value})} style={STYLES.input} placeholder="Display Name" />
                        <input type="text" value={editForm.avatar_url} onChange={e => setEditForm({...editForm, avatar_url: e.target.value})} style={STYLES.input} placeholder="Avatar URL" />
                        <input type="text" value={editForm.background_url} onChange={e => setEditForm({...editForm, background_url: e.target.value})} style={STYLES.input} placeholder="Background URL or Embed" />
                        <input type="text" value={editForm.music_embed} onChange={e => setEditForm({...editForm, music_embed: e.target.value})} style={STYLES.input} placeholder="Spotify/Soundcloud/Canva Embed Code" />
                        <input type="url" value={editForm.calendly_url} onChange={e => setEditForm({...editForm, calendly_url: e.target.value})} style={STYLES.input} placeholder="Calendly or Booking URL" />
                        <input type="url" value={editForm.store_url} onChange={e => setEditForm({...editForm, store_url: e.target.value})} style={STYLES.input} placeholder="Primary Store URL" />
                        
                        <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} style={{...STYLES.input, height: '60px'}} placeholder="Bio (Type a few keywords, then click Magic Write!)" />
                        
                        {/* ✨ AI BIO BUTTON */}
                        <button 
                            onClick={handleMagicBio} 
                            disabled={isGeneratingBio} 
                            type="button" 
                            style={{...STYLES.btnPrimary, width: '100%', marginBottom: '15px', backgroundColor: '#a855f7', opacity: isGeneratingBio ? 0.6 : 1}}
                        >
                            {isGeneratingBio ? '✨ Thinking...' : '✨ Magic Write Bio'}
                        </button>

                        <div style={{display:'flex', gap:'10px'}}>
                            <button onClick={handleSaveProfile} disabled={actionLoading.saveProfile} style={{...STYLES.btnPrimary, opacity: actionLoading.saveProfile ? 0.6 : 1}}>Save</button>
                            <button onClick={() => setIsEditing(false)} style={STYLES.btnSecondary}>Cancel</button>
                        </div>
                    </div>
                )}

                <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                            {profileUser?.avatar_url ? <img src={profileUser.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profileUser?.display_name || profileUser?.email)?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#111827' }}>{profileUser?.display_name || profileUser?.email}</h2>
                                {!isMyProfile && currentUser && <button onClick={handleBlockUser} disabled={actionLoading.blockUser} style={{ ...STYLES.btnDanger, opacity: actionLoading.blockUser ? 0.6 : 1 }}>🚫 Block</button>}
                            </div>
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '8px' }}>
                                <div style={{ color: '#4b5563', fontSize: '15px' }}><strong style={{ color: '#111827' }}>{followerCount}</strong> Followers</div>
                                <div style={{ color: '#4b5563', fontSize: '15px' }}><strong style={{ color: '#111827' }}>{followingCount}</strong> Following</div>
                            </div>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Member since: {profileUser?.memberSince}</p>
                            {profileUser?.bio && <p style={{ marginTop: '10px', color: '#374151', fontStyle: 'italic' }}>"{profileUser.bio}"</p>}
                        </div>
                    </div>
                    {isMyProfile && !isEditing && <button onClick={() => setIsEditing(true)} style={STYLES.btnSecondary}>✏️ Edit</button>}
                </div>

                {!isEditing && profileUser?.music_embed && (
                    <div style={{ marginBottom: '30px', width: '100%', overflow: 'hidden', borderRadius: '16px', backgroundColor: 'transparent' }}>
                        {renderSafeHTML(profileUser.music_embed)}
                    </div>
                )}

                {isMyProfile && !isEditing && (
                    <div style={STYLES.card}>
                        
                        {/* ✨ AI POST ASSISTANT SECTION */}
                        <div style={{ padding: '15px', backgroundColor: '#374151', borderRadius: '8px', marginBottom: '15px', border: '1px solid #4b5563' }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#a855f7' }}>✨ AI Story Assistant</p>
                            <input 
                              type="text" 
                              placeholder="What should the post be about? (e.g., Working out)" 
                              value={postTopic}
                              onChange={(e) => setPostTopic(e.target.value)}
                              style={{ ...STYLES.input, marginBottom: '10px', backgroundColor: '#1f2937' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select 
                                  value={postTone} 
                                  onChange={(e) => setPostTone(e.target.value)}
                                  style={{ ...STYLES.input, marginBottom: 0, flex: 1, backgroundColor: '#1f2937' }}
                                >
                                  <option value="funny">😂 Funny</option>
                                  <option value="inspirational">✨ Inspirational</option>
                                  <option value="professional">💼 Professional</option>
                                  <option value="storytelling">📖 Story</option>
                                </select>
                                <button 
                                  onClick={handleMagicPost} 
                                  disabled={isGeneratingPost}
                                  style={{ ...STYLES.btnPrimary, backgroundColor: '#a855f7', flex: 1, opacity: isGeneratingPost ? 0.6 : 1 }}
                                >
                                  {isGeneratingPost ? 'Writing...' : '✨ Generate'}
                                </button>
                            </div>
                        </div>

                        <textarea 
                            placeholder="What's on your mind? Or what are you selling?"
                            value={postText}
                            maxLength={MAX_POST_LENGTH}
                            onChange={(e) => setPostText(e.target.value)}
                            style={{ ...STYLES.input, minHeight: '80px', marginBottom: '4px' }}
                        />
                        <div style={{ textAlign: 'right', fontSize: '12px', color: postText.length >= MAX_POST_LENGTH ? '#ef4444' : '#9ca3af', marginBottom: '10px' }}>
                            {postText.length} / {MAX_POST_LENGTH}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input type="file" ref={fileInputRef} accept="image/*, video/*" onChange={handleFileSelect} hidden />
                            <button onClick={() => fileInputRef.current?.click()} style={{ ...STYLES.btnSecondary, width: '100%', textAlign: 'center' }}>📷 Upload Image or Video</button>

                            {postFile && postFilePreview && (
                              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #374151', marginTop: '4px' }}>
                                {VALID_VIDEO_TYPES.includes(postFile.type) ? <video src={postFilePreview} controls playsInline style={{ width: '100%', display: 'block', maxHeight: '300px' }} /> : <img src={postFilePreview} alt="Upload" style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'contain' }} />}
                                <button onClick={clearFile} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                              </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', minHeight: '44px' }}>
                                <input type="checkbox" id="sell-toggle" checked={isSelling} onChange={(e) => setIsSelling(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                <label htmlFor="sell-toggle" style={{ color: '#22c55e', fontWeight: 'bold', cursor: 'pointer' }}>Turn this into a "Sell" Post 🛒</label>
                            </div>

                            {isSelling && <input type="url" placeholder="Checkout Link" value={productLink} onChange={(e) => setProductLink(e.target.value)} style={{...STYLES.input, border: '1px solid #22c55e'}} />}

                            <button onClick={handleCreatePost} disabled={actionLoading.createPost || (!postText.trim() && !postFile)} style={{ ...STYLES.btnPrimary, width: '100%', marginTop: '10px', opacity: (actionLoading.createPost || (!postText.trim() && !postFile)) ? 0.6 : 1 }}>
                                {actionLoading.createPost ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {posts.map(post => {
                        const isLiked = currentUser && post.likes?.some((l: any) => l.user_id === currentUser.id);
                        return (
                        <div key={post.id} style={STYLES.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', color: '#9ca3af' }}>
                                <span>{new Date(post.created_at).toLocaleString()}</span>
                                {isMyProfile ? <button onClick={() => handleDelete(post.id)} disabled={actionLoading[`delete-${post.id}`]} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', minHeight: '44px' }}>Delete</button> : <button onClick={() => handleReportPost(post.id)} disabled={actionLoading[`report-${post.id}`]} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', minHeight: '44px' }}>Report</button>}
                            </div>
                            
                            {renderPostContent(post)}
                            {post.media_url && (post.post_type === 'video' || post.media_url.match(/\.(mp4|webm|mov|ogg)$/i) ? <MonetizedVideoPlayer post={post} currentUser={currentUser} supabase={supabase} /> : <img src={post.media_url} style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px' }} alt="Post media" />)}

                            {post.is_sell_post && post.product_link && <a href={post.product_link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '15px', backgroundColor: '#22c55e', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '8px', textDecoration: 'none', boxSizing: 'border-box' }}>💳 Buy Now / View Item</a>}

                            <div style={{ marginTop: '15px', display: 'flex', gap: '15px', borderTop: '1px solid #374151', paddingTop: '15px' }}>
                                <button aria-label="Like Post" onClick={() => handleLike(post.id, !!isLiked)} style={{ ...STYLES.iconBtn, color: isLiked ? '#ef4444' : '#9ca3af' }}><span style={{ fontSize: '20px' }}>{isLiked ? '❤️' : '🤍'}</span> <span>{post.likes?.length || 0}</span></button>
                                <button aria-label="Comment on Post" onClick={() => toggleComments(post.id)} style={STYLES.iconBtn}><span style={{ fontSize: '20px' }}>💬</span> <span>{post.comments?.length || 0}</span></button>
                                <button aria-label="Share Post" onClick={() => handleShare(post.id)} style={STYLES.iconBtn}><span style={{ fontSize: '20px' }}>↗️</span> <span>Share</span></button>
                            </div>

                            {openComments.has(post.id) && (
                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #374151' }}>
                                    {post.comments?.map((c: any) => <div key={c.id} style={{ marginBottom: '12px', fontSize: '14px' }}><span style={{ fontWeight: 'bold', color: '#d1d5db', marginRight: '8px' }}>{profilesMap[c.user_id]?.display_name || 'User'}</span><span style={{ color: '#9ca3af' }}>{c.content}</span></div>)}
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <input type="text" placeholder="Add a comment..." value={commentText[post.id] || ''} onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })} style={{ flex: 1, minWidth: 0, height: '44px', padding: '0 15px', borderRadius: '22px', border: '1px solid #4b5563', backgroundColor: '#374151', color: 'white', fontSize: '14px', boxSizing: 'border-box' }} />
                                        <button onClick={() => handlePostComment(post.id)} disabled={actionLoading[`comment-${post.id}`]} style={{ height: '44px', padding: '0 20px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '22px', fontWeight: 'bold', cursor: 'pointer' }}>Post</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )})}
                    {hasMorePosts && posts.length > 0 && <button onClick={loadMorePosts} disabled={loadingMore} style={{ ...STYLES.btnSecondary, width: '100%', marginTop: '10px', opacity: loadingMore ? 0.6 : 1 }}>Load More Posts</button>}
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  )
}