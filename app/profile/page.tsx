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
  'spotify.com',                                             // ✅ RESTORED: Spotify support
  'canva.com',                                               // ✅ RESTORED: Canva embed support
  'spotify.com',              // ✅ FIX: Was malformed 'http://googleusercontent.com/spotify.com'
  'youtube.com',
  'www.youtube-nocookie.com',
  'soundcloud.com',
  'apple.com',
  'amazon.com',
  'amzn.to',
  'widgets.shein.com',
  'temu.com',
  'googleusercontent.com'
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

// ✅ FIX: Expanded file validation to support video uploads
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
const VALID_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
const VALID_UPLOAD_TYPES = [...VALID_IMAGE_TYPES, ...VALID_VIDEO_TYPES];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_VIDEO_SIZE_MB = 200;

// ============================================================================
// UI COMPONENT
// ============================================================================

function ProfileContent() {
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // ✅ FIX: Confirmation modal state replaces confirm()/prompt()
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
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ 
      display_name: '', avatar_url: '', background_url: '', music_embed: '', 
      bio: '', calendly_url: '', google_calendar_url: '', store_url: '', store_url_2: '', store_url_3: ''
  })

  // ✅ FIX: Toast supports success/error types (no longer always red)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  // ✅ FIX: File input ref for styled upload button (proper 44px tap target)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor Offline/Online Status
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
    
    return () => { 
        listenerPromise.then(handle => handle.remove()); 
    }
  }, []);

  // Deep Link App Listener
  useEffect(() => {
    const handleUrlOpen = (event: any) => {
      if (event.url.includes('vimciety://')) {
        const path = event.url.replace('vimciety://', '/');
        router.push(path);
      }
    };
    
    const listenerPromise = CapacitorApp.addListener('appUrlOpen', handleUrlOpen);
    
    return () => { 
        listenerPromise.then(handle => handle.remove()); 
    };
  }, [router]);

  const [postText, setPostText] = useState('')
  const [postFile, setPostFile] = useState<File | null>(null)
  const [postFilePreview, setPostFilePreview] = useState<string | null>(null) // ✅ NEW: Preview state for selected file
  const [isSelling, setIsSelling] = useState(false)
  const [productLink, setProductLink] = useState('')
  
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({})
  const [openComments, setOpenComments] = useState<Set<string>>(new Set())
  const [isBlocked, setIsBlocked] = useState(false)

  const targetId = searchParams.get('id')
  const targetSlug = searchParams.get('u')

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
      if (targetId) {
        const { data } = await supabase.from('profiles').select('*').eq('id', targetId).single()
        profileData = data
      } else if (targetSlug) {
        const { data } = await supabase.from('profiles').select('*').eq('username', targetSlug).single()
        profileData = data
      } else if (loggedInUser) {
        const { data } = await supabase.from('profiles').select('*').eq('id', loggedInUser.id).single()
        profileData = data
      }

      if (!profileData) { setLoading(false); return; }
      const userIdToFetch = profileData.id

      const [allProfilesRes, blockDataRes, userPostsRes, firstPostRes, followersRes, followingRes, historyRes] = await Promise.all([
        supabase.from('profiles').select('id, username, display_name, avatar_url'),
        (loggedInUser && loggedInUser.id !== userIdToFetch) ? supabase.from('blocks').select('id').eq('blocker_id', loggedInUser.id).eq('blocked_id', userIdToFetch).single() : Promise.resolve({ data: null }),
        // ✅ FIX: Changed .ilike() to .eq() — user_id is a UUID, not text
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

  async function loadMorePosts() {
      if (isOffline) return showToast("You are offline.", 'error');
      setLoadingMore(true);
      const start = posts.length;
      const end = start + POSTS_PER_PAGE - 1;
      
      const { data } = await supabase.from('posts')
          .select(`*, likes ( user_id ), comments ( id, content, email, user_id, created_at )`)
          .eq('user_id', profileUser.id)
          .order('created_at', { ascending: false })
          .range(start, end);

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
      if (error) showToast("Error saving profile: " + error.message, 'error')
      else { setProfileUser({ ...profileUser, ...editForm }); setIsEditing(false); showToast("Profile saved!"); }
      
      setActionLoading(prev => ({...prev, saveProfile: false}))
  }

  // ✅ FIX: File selection handler with validation and preview
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) { clearFile(); return; }
    
    if (!VALID_UPLOAD_TYPES.includes(file.type)) {
        showToast("Invalid file type. Supported: JPG, PNG, WEBP, GIF, MP4, WebM, MOV.", 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    const isVideo = VALID_VIDEO_TYPES.includes(file.type);
    const maxSize = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;

    if (file.size > maxSize * 1024 * 1024) {
        showToast(`File too large. Max ${isVideo ? 'video' : 'image'} size is ${maxSize}MB.`, 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    setPostFile(file);
    // Generate preview
    const objectUrl = URL.createObjectURL(file);
    setPostFilePreview(objectUrl);
  }

  function clearFile() {
    setPostFile(null);
    if (postFilePreview) URL.revokeObjectURL(postFilePreview);
    setPostFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleCreatePost() {
    if (!currentUser) return
    if (isOffline) return showToast("Cannot post while offline.", 'error');

    setActionLoading(prev => ({...prev, createPost: true}))

    const cleanText = DOMPurify.sanitize(postText, { ALLOWED_TAGS: [] }).trim()
    if (!cleanText && !postFile) {
        showToast("Post cannot be empty.", 'error');
        setActionLoading(prev => ({...prev, createPost: false}))
        return;
    }

    let mediaUrl = null
    let postType = 'text'

    if (postFile) {
        const isVideo = VALID_VIDEO_TYPES.includes(postFile.type);
        postType = isVideo ? 'video' : 'image';

        const filePath = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${postFile.name.split('.').pop()}`
        const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, postFile)
        if (!uploadError) {
            mediaUrl = supabase.storage.from('posts').getPublicUrl(filePath).data.publicUrl
        } else { 
            showToast("Error uploading file: " + uploadError.message, 'error'); 
            setActionLoading(prev => ({...prev, createPost: false})); 
            return;
        }
    }

    const newPost = { 
        user_id: currentUser.id, 
        content: cleanText, 
        media_url: mediaUrl, 
        post_type: postType, // ✅ FIX: Now correctly set to 'video' or 'image'
        is_sell_post: isSelling, 
        product_link: isSelling ? productLink : null 
    }

    const { data, error } = await supabase.from('posts').insert(newPost).select().single()
    if (error) showToast("Error creating post: " + error.message, 'error')
    else if (data) {
        setPosts([{ ...data, likes: [], comments: [] }, ...posts])
        setPostText(''); clearFile(); setIsSelling(false); setProductLink('');
        showToast("Post created!");
    }
    setActionLoading(prev => ({...prev, createPost: false}))
  }

  async function handleDelete(postId: string) {
      if (isOffline) return showToast("Cannot delete while offline.", 'error');
      // ✅ FIX: Use modal instead of confirm() for Capacitor/WKWebView compatibility
      setConfirmModal({
        message: "Are you sure you want to delete this post?",
        onConfirm: async () => {
          setConfirmModal(null);
          setActionLoading(prev => ({...prev, [`delete-${postId}`]: true}))
          const { error } = await supabase.from('posts').delete().eq('id', postId)
          if (!error) setPosts(prev => prev.filter(p => p.id !== postId))
          else showToast("Failed to delete post.", 'error')
          setActionLoading(prev => ({...prev, [`delete-${postId}`]: false}))
        }
      });
  }

  async function handleLike(postId: string, isLiked: boolean) {
    if (!currentUser) return showToast("Please login to like posts.", 'error');
    if (isOffline) return showToast("Cannot like while offline.", 'error');
    if (actionLoading[`like-${postId}`]) return;

    setActionLoading(prev => ({...prev, [`like-${postId}`]: true}))
    const previousPosts = [...posts];
    setPosts(prev => prev.map(msg => msg.id === postId ? { ...msg, likes: isLiked ? msg.likes.filter((l: any) => l.user_id !== currentUser.id) : [...(msg.likes || []), { user_id: currentUser.id }] } : msg));
    
    try {
        if (isLiked) {
            const { error } = await supabase.from('likes').delete().match({ user_id: currentUser.id, post_id: postId });
            if (error) throw error;
        } else {
            const { error } = await supabase.from('likes').insert({ user_id: currentUser.id, post_id: postId });
            if (error) throw error;
            if (profileUser && profileUser.id !== currentUser.id) await supabase.from('notifications').insert({ user_id: profileUser.id, actor_id: currentUser.id, type: 'like', post_id: postId });
        }
    } catch (err) {
        setPosts(previousPosts); 
        showToast("Network error. Could not save like.", 'error');
    }
    setActionLoading(prev => ({...prev, [`like-${postId}`]: false}))
  }

  const toggleComments = (postId: string) => {
    const newSet = new Set(openComments)
    if (newSet.has(postId)) newSet.delete(postId)
    else newSet.add(postId)
    setOpenComments(newSet)
  }

  async function handlePostComment(postId: string) {
    if (!currentUser) return showToast("Please login to comment.", 'error')
    if (isOffline) return showToast("Cannot comment while offline.", 'error');
    
    const rawText = commentText[postId] || ''
    const cleanText = DOMPurify.sanitize(rawText, { ALLOWED_TAGS: [] }).trim()
    if (!cleanText) return

    setActionLoading(prev => ({...prev, [`comment-${postId}`]: true}))
    const { data: newComment, error } = await supabase.from('comments').insert({ post_id: postId, user_id: currentUser.id, email: currentUser.email, content: cleanText }).select().single()
    if (error) { showToast("Error: " + error.message, 'error'); setActionLoading(prev => ({...prev, [`comment-${postId}`]: false})); return; }
    
    setPosts(prev => prev.map(msg => msg.id === postId ? { ...msg, comments: [...(msg.comments || []), newComment] } : msg))
    setCommentText(prev => ({ ...prev, [postId]: '' }))

    if (profileUser && profileUser.id !== currentUser.id) await supabase.from('notifications').insert({ user_id: profileUser.id, actor_id: currentUser.id, type: 'comment', post_id: postId });
    setActionLoading(prev => ({...prev, [`comment-${postId}`]: false}))
  }

  const handleShare = async (postId: string) => {
      // ✅ FIX: Hardcoded domain — window.location.origin returns capacitor://localhost on native
      const url = `https://www.vimciety.com/post/${postId}`;
      
      if (navigator.share) {
          try { 
              await navigator.share({ 
                  title: 'Check out this post on VIMciety', 
                  url: url 
              }); 
          } catch (err) {
              console.log('Share cancelled by user');
          }
      } else { 
          // ✅ FIX: Clipboard wrapped in try/catch for WKWebView compatibility
          try {
              await navigator.clipboard.writeText(url);
              showToast("Link copied to clipboard!");
          } catch {
              showToast("Could not copy link.", 'error');
          }
      }
  };

  async function handleBlockUser() {
      if (!currentUser || !profileUser) return
      if (isOffline) return showToast("Cannot block users while offline.", 'error');

      // ✅ FIX: Use modal instead of confirm() for WKWebView compatibility
      setConfirmModal({
        message: `Block ${profileUser.display_name || 'this user'}? You will no longer see their posts.`,
        onConfirm: async () => {
          setConfirmModal(null);
          setActionLoading(prev => ({...prev, blockUser: true}))
          const { error } = await supabase.from('blocks').insert({ blocker_id: currentUser.id, blocked_id: profileUser.id })
          if (!error) { setIsBlocked(true); showToast("User blocked."); router.push('/'); } 
          else showToast("Error blocking user.", 'error')
          setActionLoading(prev => ({...prev, blockUser: false}))
        }
      });
  }

  async function handleReportPost(postId: string) {
      if (!currentUser) return showToast("Please log in to report posts.", 'error');
      if (isOffline) return showToast("Cannot report while offline.", 'error');

      // ✅ FIX: Use modal with input instead of window.prompt() for WKWebView compatibility
      setConfirmModal({
        message: "Why are you reporting this post?",
        showInput: true,
        inputPlaceholder: "e.g., Spam, Harassment, Inappropriate",
        onConfirm: async (inputValue) => {
          const reason = inputValue?.trim() || 'No reason provided';
          setConfirmModal(null);
          setConfirmInput('');

          setActionLoading(prev => ({...prev, [`report-${postId}`]: true}))
          try {
              const { error } = await supabase.from('reports').insert({ post_id: postId, reporter_id: currentUser.id, reason });
              if (error) throw error;
              showToast("Thank you. Our moderation team will review this within 24 hours.");
          } catch (err) {
              showToast("Failed to submit report. Please try again.", 'error');
          }
          setActionLoading(prev => ({...prev, [`report-${postId}`]: false}))
        }
      });
  }

  const connectGoogleCalendar = async () => {
    if (isOffline) return showToast("You are offline.", 'error');
    const redirectUrl = Capacitor.isNativePlatform() ? 'vimciety://profile' : `${window.location.origin}/profile`;
    const { error } = await supabase.auth.linkIdentity({ provider: 'google', options: { scopes: 'https://www.googleapis.com/auth/calendar.events', redirectTo: redirectUrl } });
    if (error && !(error.message.includes('already linked') || error.message.includes('already_exists'))) showToast("Error connecting Google: " + error.message, 'error');
    else { setIsGoogleLinked(true); showToast("Google Calendar connected!"); }
  };

  const renderSafeHTML = (html: string) => {
      if (!html) return null;
      const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'br', 'strong', 'em', 'b', 'i', 'ul', 'li'], ALLOWED_ATTR: ['src', 'href', 'target', 'width', 'height', 'style', 'title', 'class', 'id', 'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'loading', 'referrerpolicy'] })
      return <div dangerouslySetInnerHTML={{ __html: clean }} />
  }

  const renderPostContent = (post: any) => {
    if (post.post_type === 'embed') return <div style={{marginTop:'10px', overflow:'hidden', borderRadius:'8px'}}>{renderSafeHTML(post.content)}</div>;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = post.content?.match(urlRegex);
    const firstUrl = urls ? urls[0] : null;

    const renderTextWithLinks = (text: string) => {
      if (!text) return null;
      const parts = text.split(urlRegex);
      return parts.map((part, i) => {
        if (part.match(urlRegex)) return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'underline' }}>{part}</a>;
        return <span key={i}>{part}</span>;
      });
    };

    return (
      <div style={{ lineHeight: '1.5' }}>
        <p style={{ whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word' }}>{renderTextWithLinks(post.content)}</p>
        {firstUrl && (
          <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', marginTop: '15px' }}>
              <Microlink url={firstUrl} size="large" style={{ width: '100%', minWidth: 0, borderRadius: '10px', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
          </div>
        )}
      </div>
    );
  }

  // ✅ NEW: Render media for a post (supports both images and videos)
  const renderPostMedia = (post: any) => {
    if (!post.media_url) return null;

    const isVideo = post.post_type === 'video' || post.media_url.match(/\.(mp4|webm|mov|ogg)$/i);
    
    if (isVideo) {
      return (
        <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', maxWidth: '100%' }}>
          {/* ✅ iOS COMPLIANCE: playsInline prevents fullscreen hijacking */}
          <video 
            src={post.media_url} 
            controls 
            playsInline 
            preload="metadata"
            style={{ width: '100%', display: 'block' }} 
          />
        </div>
      );
    }

    return (
      <img 
        src={post.media_url} 
        style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px' }} 
        alt="Post media" 
      />
    );
  }

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading Profile...</div>
  if (!profileUser) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Profile not found.</div>

  const isMyProfile = currentUser && profileUser && currentUser.id === profileUser.id
  const isEmbedBackground = profileUser?.background_url && profileUser.background_url.trim().startsWith('<');
  const isPostInvalid = (!postText.trim() && !postFile) || postText.length > MAX_POST_LENGTH;

  return (
    <div style={{ minHeight: '100vh', position: 'relative', backgroundColor: '#111827' }}>
      
      {/* ✅ FIX: Confirmation Modal (replaces confirm/prompt for WKWebView) */}
      {confirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1f2937', borderRadius: '16px', padding: '24px',
            maxWidth: '400px', width: '100%', border: '1px solid #374151'
          }}>
            <p style={{ color: 'white', fontSize: '16px', marginTop: 0, marginBottom: '16px' }}>
              {confirmModal.message}
            </p>
            {confirmModal.showInput && (
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={confirmModal.inputPlaceholder || ''}
                style={{ ...STYLES.input, marginBottom: '16px' }}
                autoFocus
              />
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setConfirmModal(null); setConfirmInput(''); }} 
                style={STYLES.btnSecondary}
              >
                Cancel
              </button>
              <button 
                onClick={() => confirmModal.onConfirm(confirmInput)}
                style={STYLES.btnPrimary}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Banner */}
      {isOffline && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', backgroundColor: '#ef4444', color: 'white', textAlign: 'center', padding: '10px', zIndex: 10000, fontWeight: 'bold' }}>
          No Internet Connection
        </div>
      )}

      {/* ✅ FIX: Toast uses type-based coloring */}
      {toast && (
        <div style={{
            position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: toast.type === 'error' ? '#ef4444' : '#22c55e',
            color: 'white', padding: '12px 24px', borderRadius: '24px', zIndex: 9999, fontWeight: 'bold', fontSize: '14px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', transition: 'opacity 0.3s ease-in-out'
        }}>
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
                <button onClick={() => router.push('/')} style={{ ...STYLES.btnSecondary, backgroundColor: 'white', color: '#333' }}>
                    ← Back to Feed
                </button>
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
                        
                        {/* ✅ RESTORED: Music/Canva Embed Code Field! */}
                        <input type="text" value={editForm.music_embed} onChange={e => setEditForm({...editForm, music_embed: e.target.value})} style={STYLES.input} placeholder="Spotify/Soundcloud/Canva Embed Code" />
                        
                        <input type="url" value={editForm.calendly_url} onChange={e => setEditForm({...editForm, calendly_url: e.target.value})} style={STYLES.input} placeholder="Calendly or Booking URL" />
                        <input type="url" value={editForm.store_url} onChange={e => setEditForm({...editForm, store_url: e.target.value})} style={STYLES.input} placeholder="Primary Store URL" />
                        <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} style={{...STYLES.input, height: '60px'}} placeholder="Bio" />
                        <div style={{display:'flex', gap:'10px'}}>
                            <button onClick={handleSaveProfile} disabled={actionLoading.saveProfile} style={{...STYLES.btnPrimary, opacity: actionLoading.saveProfile ? 0.6 : 1}}>
                                {actionLoading.saveProfile ? 'Saving...' : 'Save'}
                            </button>
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
                                {!isMyProfile && currentUser && (
                                    <button onClick={handleBlockUser} disabled={actionLoading.blockUser} style={{ ...STYLES.btnDanger, opacity: actionLoading.blockUser ? 0.6 : 1 }}>
                                        {actionLoading.blockUser ? 'Blocking...' : '🚫 Block User'}
                                    </button>
                                )}
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

                {/* ✅ RESTORED: Profile Widget/Embed Renderer! */}
                {!isEditing && profileUser?.music_embed && (
                    <div style={{ marginBottom: '30px', width: '100%', overflow: 'hidden', borderRadius: '16px', backgroundColor: 'transparent' }}>
                        {renderSafeHTML(profileUser.music_embed)}
                    </div>
                )}

                {/* ✅ Post Creation — now supports video uploads with preview */}
                {isMyProfile && !isEditing && (
                    <div style={STYLES.card}>
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
                            {/* ✅ FIX: Styled upload button wrapping hidden input for 44px tap target */}
                            <input 
                              type="file" 
                              ref={fileInputRef}
                              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, video/mp4, video/webm, video/quicktime"
                              onChange={handleFileSelect} 
                              hidden 
                            />
                            <button 
                              onClick={() => fileInputRef.current?.click()} 
                              style={{ ...STYLES.btnSecondary, width: '100%', textAlign: 'center' }}
                            >
                              📷 Upload Image or Video
                            </button>

                            {/* ✅ NEW: File preview for images and videos */}
                            {postFile && postFilePreview && (
                              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #374151', marginTop: '4px' }}>
                                {VALID_VIDEO_TYPES.includes(postFile.type) ? (
                                  <video 
                                    src={postFilePreview} 
                                    controls 
                                    playsInline 
                                    style={{ width: '100%', display: 'block', maxHeight: '300px' }} 
                                  />
                                ) : (
                                  <img 
                                    src={postFilePreview} 
                                    alt="Upload preview" 
                                    style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'contain' }} 
                                  />
                                )}
                                <button 
                                  onClick={clearFile}
                                  style={{ 
                                    position: 'absolute', top: '8px', right: '8px', 
                                    background: 'rgba(0,0,0,0.7)', color: 'white', 
                                    border: 'none', borderRadius: '50%', 
                                    width: '44px', height: '44px', 
                                    cursor: 'pointer', fontSize: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}
                                >
                                  ✕
                                </button>
                                <div style={{ padding: '8px 12px', backgroundColor: '#374151', fontSize: '13px', color: '#9ca3af' }}>
                                  {postFile.name} ({(postFile.size / (1024 * 1024)).toFixed(1)}MB)
                                </div>
                              </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', minHeight: '44px' }}>
                                <input type="checkbox" id="sell-toggle" checked={isSelling} onChange={(e) => setIsSelling(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                <label htmlFor="sell-toggle" style={{ color: '#22c55e', fontWeight: 'bold', cursor: 'pointer' }}>Turn this into a "Sell" Post 🛒</label>
                            </div>

                            {isSelling && <input type="url" placeholder="Checkout Link" value={productLink} onChange={(e) => setProductLink(e.target.value)} style={{...STYLES.input, border: '1px solid #22c55e'}} />}

                            <button 
                                onClick={handleCreatePost} 
                                disabled={actionLoading.createPost || isPostInvalid}
                                style={{ ...STYLES.btnPrimary, width: '100%', marginTop: '10px', opacity: (actionLoading.createPost || isPostInvalid) ? 0.6 : 1 }}
                            >
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
                                {isMyProfile ? (
                                    <button onClick={() => handleDelete(post.id)} disabled={actionLoading[`delete-${post.id}`]} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', minHeight: '44px' }}>
                                        {actionLoading[`delete-${post.id}`] ? '...' : 'Delete'}
                                    </button>
                                ) : (
                                    <button onClick={() => handleReportPost(post.id)} disabled={actionLoading[`report-${post.id}`]} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', minHeight: '44px' }}>
                                        {actionLoading[`report-${post.id}`] ? 'Reporting...' : 'Report Post'}
                                    </button>
                                )}
                            </div>
                            
                            {renderPostContent(post)}
                            
                            {/* ✅ FIX: Unified media renderer supports video + image with playsInline */}
                            {renderPostMedia(post)}

                            {post.is_sell_post && post.product_link && (
                                <a href={post.product_link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '15px', backgroundColor: '#22c55e', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '8px', textDecoration: 'none', boxSizing: 'border-box' }}>💳 Buy Now / View Item</a>
                            )}

                            <div style={{ marginTop: '15px', display: 'flex', gap: '15px', borderTop: '1px solid #374151', paddingTop: '15px' }}>
                                <button aria-label="Like Post" onClick={() => handleLike(post.id, !!isLiked)} style={{ ...STYLES.iconBtn, color: isLiked ? '#ef4444' : '#9ca3af' }}>
                                    <span style={{ fontSize: '20px' }}>{isLiked ? '❤️' : '🤍'}</span> <span>{post.likes?.length || 0}</span>
                                </button>
                                <button aria-label="Comment on Post" onClick={() => toggleComments(post.id)} style={STYLES.iconBtn}>
                                    <span style={{ fontSize: '20px' }}>💬</span> <span>{post.comments?.length || 0}</span>
                                </button>
                                <button aria-label="Share Post" onClick={() => handleShare(post.id)} style={STYLES.iconBtn}>
                                    <span style={{ fontSize: '20px' }}>↗️</span> <span>Share</span>
                                </button>
                            </div>

                            {openComments.has(post.id) && (
                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #374151' }}>
                                    {post.comments?.map((c: any) => {
                                        const commenter = profilesMap[c.user_id]
                                        return (
                                            <div key={c.id} style={{ marginBottom: '12px', fontSize: '14px' }}>
                                                <span style={{ fontWeight: 'bold', color: '#d1d5db', marginRight: '8px' }}>{commenter?.display_name || commenter?.username || 'User'}</span>
                                                <span style={{ color: '#9ca3af' }}>{c.content}</span>
                                            </div>
                                        )
                                    })}
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <input 
                                            type="text" placeholder="Add a comment..." maxLength={MAX_COMMENT_LENGTH}
                                            value={commentText[post.id] || ''} onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })} 
                                            style={{ flex: 1, minWidth: 0, height: '44px', padding: '0 15px', borderRadius: '22px', border: '1px solid #4b5563', backgroundColor: '#374151', color: 'white', fontSize: '14px', boxSizing: 'border-box' }} 
                                        />
                                        <button 
                                            onClick={() => handlePostComment(post.id)} 
                                            disabled={actionLoading[`comment-${post.id}`]}
                                            style={{ height: '44px', padding: '0 20px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '22px', fontWeight: 'bold', cursor: 'pointer', opacity: actionLoading[`comment-${post.id}`] ? 0.6 : 1 }}
                                        >
                                            {actionLoading[`comment-${post.id}`] ? '...' : 'Post'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )})}
                    
                    {hasMorePosts && posts.length > 0 && (
                        <button 
                            onClick={loadMorePosts} 
                            disabled={loadingMore}
                            style={{ ...STYLES.btnSecondary, width: '100%', marginTop: '10px', opacity: loadingMore ? 0.6 : 1 }}
                        >
                            {loadingMore ? 'Loading...' : 'Load More Posts'}
                        </button>
                    )}
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