'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import DOMPurify from 'isomorphic-dompurify'
import Sidebar from '@/components/Sidebar'
import { App as CapacitorApp } from '@capacitor/app'
import { Network } from '@capacitor/network'
import { Capacitor } from '@capacitor/core'
import { AdMob } from '@capacitor-community/admob'
import { renderTextWithMentions, extractAndSaveTags, extractAndSaveCommentTags } from '@/app/utils/tagging'
// @ts-ignore
import Microlink from '@microlink/react'

// ============================================================================
// 🔒 STRICT SECURITY & SANITIZATION RULES
// ============================================================================

const TRUSTED_EMBED_DOMAINS = [
  'spotify.com',
  'canva.com',
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
  cardNoPad: { backgroundColor: '#1f2937', borderRadius: '12px', marginBottom: '30px', border: '1px solid #374151', color: 'white', overflow: 'hidden' as const },
  input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: 'none', color: 'white', backgroundColor: '#374151', minHeight: '44px', boxSizing: 'border-box' as const },
  btnPrimary: { backgroundColor: '#6366f1', color: 'white', fontWeight: 'bold' as const, border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', minHeight: '44px', display: 'inline-flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const },
  btnSecondary: { backgroundColor: '#4b5563', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', minHeight: '44px', fontWeight: 'bold' as const },
  btnDanger: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' as const, minHeight: '44px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' as const, alignItems: 'center' as const, gap: '6px', minWidth: '44px', minHeight: '44px', padding: 0 }
};

const DELETED_USER_ID = '00000000-0000-0000-0000-000000000000';
const POSTS_PER_PAGE = 20;
const POST_COLLAPSE_CHARS = 150;
const COMMENT_COLLAPSE_CHARS = 150;
const MAX_MEDIA_ITEMS = 4;

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
const VALID_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
const MAX_IMAGE_SIZE_MB = 20;
const MAX_VIDEO_SIZE_MB = 500;

// ============================================================================
// MEDIA CAROUSEL (shared rendering for single + multi media)
// ============================================================================
function MediaCarousel({ media, currentUser, supabase, postUserId, postId }: {
  media: Array<{ url: string; media_type: string }>;
  currentUser?: any;
  supabase?: any;
  postUserId?: string;
  postId?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedTime = useRef(0);

  if (!media || media.length === 0) return null;

  const handleVideoTimeUpdate = async () => {
    const video = videoRef.current;
    if (!video || !currentUser || !supabase || !postId) return;
    if (postUserId === currentUser.id) return;

    const currentTime = Math.floor(video.currentTime);
    if (currentTime >= 5 && currentTime - lastSavedTime.current >= 5) {
      lastSavedTime.current = currentTime;
      await supabase.from('video_views').upsert({
        post_id: postId,
        viewer_id: currentUser.id,
        watch_time_seconds: currentTime
      }, { onConflict: 'post_id, viewer_id' });
    }
  };

  const renderItem = (item: { url: string; media_type: string }) => {
    if (item.media_type === 'video') {
      return <video ref={videoRef} src={`${item.url}#t=0.001`} controls playsInline preload="metadata" onTimeUpdate={handleVideoTimeUpdate} style={{ width: '100%', display: 'block' }} />;
    }
    if (item.media_type === 'audio') {
      return <div style={{ padding: '20px', backgroundColor: '#f3f4f6' }}><audio controls src={item.url} preload="metadata" style={{ width: '100%' }} /></div>;
    }
    return <img src={item.url} alt="Post media" loading="lazy" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />;
  };

  if (media.length === 1) {
    return (
      <div style={{ maxWidth: '100%', backgroundColor: '#000' }}>
        {renderItem(media[0])}
      </div>
    );
  }

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  return (
    <div style={{ position: 'relative', backgroundColor: '#000' }}>
      {renderItem(media[currentIndex])}
      <button onClick={goToPrev} aria-label="Previous" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '20px', zIndex: 10 }}>‹</button>
      <button onClick={goToNext} aria-label="Next" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '20px', zIndex: 10 }}>›</button>
      <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: '12px' }}>
        {media.map((_, idx) => (
          <div key={idx} style={{ width: '6px', height: '6px', borderRadius: '50%', background: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.4)' }} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TRUNCATED TEXT
// ============================================================================
function TruncatedText({ text, maxChars, renderText }: { text: string; maxChars: number; renderText: (text: string) => React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;
  const shouldTruncate = text.length > maxChars;
  const displayText = shouldTruncate && !isExpanded ? text.substring(0, maxChars).trimEnd() + '…' : text;
  return (
    <>
      {renderText(displayText)}
      {shouldTruncate && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '4px 0', marginTop: '4px', display: 'inline-block' }}
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </>
  );
}

// ============================================================================
// 👁️ SILENT POST VIEW TRACKER
// ============================================================================
function PostViewTracker({ postId, userId, supabase }: { postId: string, userId: string | undefined, supabase: any }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId || !ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        supabase.from('post_views').upsert({
          post_id: postId,
          viewer_id: userId
        }, { onConflict: 'post_id, viewer_id' }).then();
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [postId, userId, supabase]);

  return <div ref={ref} style={{ height: '1px', width: '100%', marginTop: '-1px' }} />;
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
  const [profileViews, setProfileViews] = useState(0)

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    display_name: '', username: '', avatar_url: '', background_url: '', music_embed: '',
    bio: '', calendly_url: '', google_calendar_url: '', store_url: '', store_url_2: '', store_url_3: ''
  })

  // MULTI-MEDIA post composer state
  const [postText, setPostText] = useState('')
  const [postFiles, setPostFiles] = useState<File[]>([])
  const [postFilePreviews, setPostFilePreviews] = useState<Array<{ url: string; type: 'image' | 'video' | 'gif' }>>([])

  const [postTopic, setPostTopic] = useState('');
  const [postTone, setPostTone] = useState('funny');
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  const [commentText, setCommentText] = useState<{ [key: string]: string }>({})
  const [openComments, setOpenComments] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<{ postId: string, commentId: string, username: string } | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)

  const targetId = searchParams.get('id')
  const targetSlug = searchParams.get('u')

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URLs
  useEffect(() => {
    return () => { postFilePreviews.forEach(p => URL.revokeObjectURL(p.url)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (profileData.id === DELETED_USER_ID) { setLoading(false); return; }
      const userIdToFetch = profileData.id

      const [allProfilesRes, blockDataRes, userPostsRes, firstPostRes, followersRes, followingRes, historyRes] = await Promise.all([
        supabase.from('profiles').select('id, username, display_name, avatar_url, is_admin, is_premium, is_verified, role'),
        (loggedInUser && loggedInUser.id !== userIdToFetch) ? supabase.from('blocks').select('id').eq('blocker_id', loggedInUser.id).eq('blocked_id', userIdToFetch).single() : Promise.resolve({ data: null }),
        supabase.from('posts').select('email').eq('user_id', userIdToFetch).not('email', 'is', null).order('created_at', { ascending: false }).limit(1),
        supabase.from('posts').select('created_at').eq('user_id', userIdToFetch).order('created_at', { ascending: true }).limit(1),
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userIdToFetch),
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userIdToFetch),
        supabase.from('posts').select(`*, likes ( user_id ), comments ( id, content, user_id, created_at, parent_comment_id, comment_likes ( user_id ) ), post_views ( viewer_id ), post_media ( url, media_type, display_order )`).eq('user_id', userIdToFetch).is('is_removed', false).order('created_at', { ascending: false }).range(0, POSTS_PER_PAGE - 1)
      ]);

      const pMap: Record<string, any> = {}
      allProfilesRes.data?.forEach((p: any) => {
        pMap[p.id] = { ...p, is_premium: p.is_admin ? true : p.is_premium }
      })
      setProfilesMap(pMap)

      if (blockDataRes.data) setIsBlocked(true)

      let email = profileData?.email || 'Unknown User'
      let memberSince = new Date().toLocaleDateString()
      if (userPostsRes.data && userPostsRes.data.length > 0) email = userPostsRes.data[0].email
      if (firstPostRes.data && firstPostRes.data.length > 0) memberSince = new Date(firstPostRes.data[0].created_at).toLocaleDateString()

      setFollowerCount(followersRes.count || 0)
      setFollowingCount(followingRes.count || 0)

      setProfileUser({
        id: userIdToFetch, email, memberSince, username: profileData?.username || '',
        display_name: profileData?.display_name || '', avatar_url: profileData?.avatar_url || '', background_url: profileData?.background_url || '', music_embed: profileData?.music_embed || '',
        bio: profileData?.bio || '', calendly_url: profileData?.calendly_url || '', google_calendar_url: profileData?.google_calendar_url || '', store_url: profileData?.store_url || '', store_url_2: profileData?.store_url_2 || '', store_url_3: profileData?.store_url_3 || '',
        is_admin: profileData?.is_admin || false,
        is_verified: profileData?.is_verified || false,
        is_premium: profileData?.is_admin ? true : (profileData?.is_premium || false)
      })

      if (loggedInUser && loggedInUser.id === userIdToFetch) {
        setEditForm({
          display_name: profileData?.display_name || '',
          username: profileData?.username || '',
          avatar_url: profileData?.avatar_url || '',
          background_url: profileData?.background_url || '',
          music_embed: profileData?.music_embed || '',
          bio: profileData?.bio || '',
          calendly_url: profileData?.calendly_url || '',
          google_calendar_url: profileData?.google_calendar_url || '',
          store_url: profileData?.store_url || '',
          store_url_2: profileData?.store_url_2 || '',
          store_url_3: profileData?.store_url_3 || '',
        })
      }

      if (loggedInUser && loggedInUser.id !== userIdToFetch) {
        supabase.from('profile_views').insert({
          profile_id: userIdToFetch,
          viewer_id: loggedInUser.id
        }).then();
      }

      if (profileData?.is_premium || profileData?.is_admin) {
        const { data: viewCount } = await supabase.rpc('get_profile_views_30d', { p_id: userIdToFetch });
        setProfileViews(viewCount || 0);
      }

      if (historyRes.data) {
        setPosts(historyRes.data)
        if (historyRes.data.length < POSTS_PER_PAGE) setHasMorePosts(false)
      }
      setLoading(false)
    }
    loadProfile()
  }, [targetId, targetSlug, supabase])

  const handleMagicBio = async () => {
    if (!editForm.bio) return showToast("Type a few keywords in the bio box first!", 'error');
    if (isOffline) return showToast("Cannot use AI while offline.", 'error');

    setIsGeneratingBio(true);
    try {
      const apiUrl = Capacitor.isNativePlatform()
        ? 'https://www.vimciety.com/api/generate-bio'
        : '/api/generate-bio';

      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'bio', prompt: editForm.bio }) });
      const data = await response.json();
      if (data.text) { setEditForm({ ...editForm, bio: data.text }); showToast("✨ Magic Bio generated!"); } else showToast("Failed to generate.", 'error');
    } catch (error) { showToast("Error connecting to AI.", 'error'); } finally { setIsGeneratingBio(false); }
  };

  const handleMagicPost = async () => {
    if (!postTopic) return showToast("Please tell me what your post is about!", 'error');
    if (isOffline) return showToast("Cannot use AI while offline.", 'error');

    setIsGeneratingPost(true);
    try {
      const apiUrl = Capacitor.isNativePlatform()
        ? 'https://www.vimciety.com/api/generate-bio'
        : '/api/generate-bio';

      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'post', prompt: postTopic, tone: postTone }) });
      const data = await response.json();
      if (data.text) { setPostText(data.text); showToast("✨ Post generated!"); } else showToast("Failed to generate.", 'error');
    } catch (error) { showToast("Error connecting to AI.", 'error'); } finally { setIsGeneratingPost(false); }
  };

  async function loadMorePosts() {
    if (isOffline) return showToast("You are offline.", 'error');
    setLoadingMore(true);
    const start = posts.length;

    const { data } = await supabase.from('posts').select(`*, likes ( user_id ), comments ( id, content, user_id, created_at, parent_comment_id, comment_likes ( user_id ) ), post_views ( viewer_id ), post_media ( url, media_type, display_order )`)
      .eq('user_id', profileUser.id).is('is_removed', false).order('created_at', { ascending: false }).range(start, start + POSTS_PER_PAGE - 1);

    if (data) {
      if (data.length < POSTS_PER_PAGE) setHasMorePosts(false);
      setPosts(prev => [...prev, ...data]);
    }
    setLoadingMore(false);
  }

  async function handleSaveProfile() {
    if (!currentUser || isOffline) return isOffline && showToast("Cannot save while offline.", 'error');

    const username = (editForm.username || '').trim();
    if (!username) return showToast("Username cannot be empty.", 'error');
    if (username.length < 3) return showToast("Username must be at least 3 characters.", 'error');
    if (!/^[a-z0-9._-]+$/.test(username)) return showToast("Username can only contain lowercase letters, numbers, dots, hyphens, and underscores.", 'error');

    setActionLoading(prev => ({ ...prev, saveProfile: true }))
    const { error } = await supabase.from('profiles').upsert({ id: currentUser.id, ...editForm, username })

    if (error) {
      if (error.code === '23505') showToast("That username is already taken. Please choose another.", 'error');
      else if (error.code === '23514') showToast("Username contains invalid characters.", 'error');
      else showToast("Failed to save profile.", 'error');
    } else {
      setProfileUser({ ...profileUser, ...editForm, username });
      setIsEditing(false);
      showToast("Profile saved!");
    }
    setActionLoading(prev => ({ ...prev, saveProfile: false }))
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUser || isOffline) return;

    if (!VALID_IMAGE_TYPES.includes(file.type)) return showToast("Invalid image type.", 'error');
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) return showToast(`Image too large. Max is ${MAX_IMAGE_SIZE_MB}MB.`, 'error');

    setActionLoading(prev => ({ ...prev, uploadAvatar: true }));
    showToast("Uploading profile picture...");

    const filePath = `${currentUser.id}/avatar-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('posts').upload(filePath, file);

    if (!error) {
      const publicUrl = supabase.storage.from('posts').getPublicUrl(filePath).data.publicUrl;
      setEditForm({ ...editForm, avatar_url: publicUrl });
      showToast("Profile picture uploaded!");
    } else showToast("Failed to upload avatar.", 'error');

    if (avatarInputRef.current) avatarInputRef.current.value = '';
    setActionLoading(prev => ({ ...prev, uploadAvatar: false }));
  }

  // ==========================================================================
  // MULTI-FILE SELECT for posts
  // ==========================================================================
  function classifyFile(file: File): 'image' | 'video' | 'gif' | null {
    if (file.type === 'image/gif') return 'gif';
    if (VALID_IMAGE_TYPES.includes(file.type)) return 'image';
    if (VALID_VIDEO_TYPES.includes(file.type)) return 'video';
    return null;
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const availableSlots = MAX_MEDIA_ITEMS - postFiles.length;
    if (availableSlots <= 0) {
      showToast(`You can attach up to ${MAX_MEDIA_ITEMS} media items.`, 'error');
      if (e.target) e.target.value = '';
      return;
    }

    const toAdd = selected.slice(0, availableSlots);
    const newFiles: File[] = [];
    const newPreviews: Array<{ url: string; type: 'image' | 'video' | 'gif' }> = [];

    for (const file of toAdd) {
      const type = classifyFile(file);
      if (!type) {
        showToast(`Skipped invalid file: ${file.name}`, 'error');
        continue;
      }
      const maxSize = type === 'video' ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;
      if (file.size > maxSize * 1024 * 1024) {
        showToast(`"${file.name}" too large. Max ${maxSize}MB.`, 'error');
        continue;
      }
      newFiles.push(file);
      newPreviews.push({ url: URL.createObjectURL(file), type });
    }

    setPostFiles(prev => [...prev, ...newFiles]);
    setPostFilePreviews(prev => [...prev, ...newPreviews]);

    if (selected.length > availableSlots) {
      showToast(`Only added ${availableSlots} of ${selected.length} files (max ${MAX_MEDIA_ITEMS}).`, 'error');
    }

    if (e.target) e.target.value = '';
  }

  function removeFileAt(index: number) {
    URL.revokeObjectURL(postFilePreviews[index].url);
    setPostFiles(prev => prev.filter((_, i) => i !== index));
    setPostFilePreviews(prev => prev.filter((_, i) => i !== index));
  }

  function clearFiles() {
    postFilePreviews.forEach(p => URL.revokeObjectURL(p.url));
    setPostFiles([]);
    setPostFilePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleCreatePost() {
    if (!currentUser || isOffline) return;
    setActionLoading(prev => ({ ...prev, createPost: true }))

    const cleanText = DOMPurify.sanitize(postText, { ALLOWED_TAGS: [] }).trim()
    if (!cleanText && postFiles.length === 0) {
      setActionLoading(prev => ({ ...prev, createPost: false }));
      return;
    }

    const primaryType = postFiles.length > 0 ? postFilePreviews[0].type : 'text';

    // Insert the post record
    const { data, error } = await supabase.from('posts').insert({
      user_id: currentUser.id,
      content: cleanText,
      media_url: null,
      post_type: primaryType,
    }).select().single();

    if (error || !data) {
      showToast("Failed to create post.", "error");
      setActionLoading(prev => ({ ...prev, createPost: false }));
      return;
    }

    // Upload media + write post_media rows
    const mediaRows: Array<{ post_id: any; url: string; media_type: string; display_order: number }> = [];
    for (let i = 0; i < postFiles.length; i++) {
      const file = postFiles[i];
      const type = postFilePreviews[i].type;
      const filePath = `${currentUser.id}/${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, file);
      if (uploadError) continue;
      const publicUrl = supabase.storage.from('posts').getPublicUrl(filePath).data.publicUrl;
      mediaRows.push({
        post_id: data.id,
        url: publicUrl,
        media_type: type,
        display_order: i,
      });
    }

    if (mediaRows.length > 0) {
      await supabase.from('post_media').insert(mediaRows);
    }

    if (cleanText) {
      await extractAndSaveTags(cleanText, data.id, currentUser.id, profilesMap, supabase);
    }

    setPosts([{ ...data, post_media: mediaRows, likes: [], comments: [], post_views: [] }, ...posts]);
    setPostText('');
    setPostTopic('');
    clearFiles();
    showToast("Post created!");

    setActionLoading(prev => ({ ...prev, createPost: false }));
  }

  async function handleDelete(postId: string, isOwner: boolean) {
    if (isOffline) return showToast("Cannot delete while offline.", 'error');
    setConfirmModal({
      message: isOwner ? "Delete this post?" : "🛡️ Admin: Remove this post for violation?", onConfirm: async () => {
        setConfirmModal(null); setActionLoading(prev => ({ ...prev, [`delete-${postId}`]: true }));

        let error;
        if (isOwner) {
          const res = await supabase.from('posts').delete().eq('id', postId);
          error = res.error;
        } else {
          const res = await supabase.from('posts').update({ is_removed: true, removed_by: currentUser.id, removed_at: new Date().toISOString() }).eq('id', postId);
          error = res.error;
        }

        if (!error) {
          setPosts(prev => prev.filter(p => p.id !== postId));
          showToast(isOwner ? "Post deleted." : "Post removed by Admin.");
        } else showToast("Error deleting post.", "error");

        setActionLoading(prev => ({ ...prev, [`delete-${postId}`]: false }));
      }
    });
  }

  async function handleLike(postId: string, isLiked: boolean) {
    if (!currentUser || isOffline || actionLoading[`like-${postId}`]) return;
    setActionLoading(prev => ({ ...prev, [`like-${postId}`]: true }))

    const targetPost = posts.find(p => p.id === postId);

    setPosts(prev => prev.map(msg => msg.id === postId ? { ...msg, likes: isLiked ? msg.likes.filter((l: any) => l.user_id !== currentUser.id) : [...(msg.likes || []), { user_id: currentUser.id }] } : msg));

    try {
      if (isLiked) {
        await supabase.from('likes').delete().match({ user_id: currentUser.id, post_id: postId });
      } else {
        await supabase.from('likes').insert({ user_id: currentUser.id, post_id: postId });

        if (targetPost && targetPost.user_id !== currentUser.id) {
          const senderName = profilesMap[currentUser.id]?.display_name || profilesMap[currentUser.id]?.username || 'Someone';
          const pushUrl = Capacitor.isNativePlatform() ? 'https://www.vimciety.com/api/send-push' : '/api/send-push';
          fetch(pushUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: targetPost.user_id, title: "New Like! ❤️", body: `${senderName} liked your post.` }) }).catch(err => console.error("Push failed", err));
        }
      }
    } catch (err) { }
    setActionLoading(prev => ({ ...prev, [`like-${postId}`]: false }))
  }

  async function handleLikeComment(postId: string, commentId: string, isLiked: boolean) {
    if (!currentUser) return showToast("Please login.", 'error');

    setPosts(prev => prev.map(msg => {
      if (msg.id !== postId) return msg;
      return {
        ...msg,
        comments: (msg.comments || []).map((c: any) => {
          if (c.id !== commentId) return c;
          return {
            ...c,
            comment_likes: isLiked
              ? (c.comment_likes || []).filter((l: any) => l.user_id !== currentUser.id)
              : [...(c.comment_likes || []), { user_id: currentUser.id }]
          };
        })
      };
    }));

    if (isLiked) {
      await supabase.from('comment_likes').delete().match({ comment_id: commentId, user_id: currentUser.id });
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: currentUser.id });
    }
  }

  const toggleComments = (postId: string) => {
    const newSet = new Set(openComments);
    if (newSet.has(postId)) {
      newSet.delete(postId);
      if (replyingTo?.postId === postId) setReplyingTo(null);
    } else {
      newSet.add(postId);
    }
    setOpenComments(newSet);
  }

  async function handlePostComment(postId: string) {
    if (!currentUser || isOffline) return;
    const cleanText = DOMPurify.sanitize(commentText[postId] || '', { ALLOWED_TAGS: [] }).trim()
    if (!cleanText) return;
    setActionLoading(prev => ({ ...prev, [`comment-${postId}`]: true }))

    const targetPost = posts.find(p => p.id === postId);
    const parentId = replyingTo?.postId === postId ? replyingTo?.commentId : null;

    const { data } = await supabase.from('comments').insert({
      post_id: postId, user_id: currentUser.id, content: cleanText, parent_comment_id: parentId
    }).select('*, comment_likes(user_id)').single()

    if (data) {
      if (cleanText) {
        await extractAndSaveCommentTags(cleanText, data.id, postId, currentUser.id, profilesMap, supabase);
      }

      setPosts(prev => prev.map(msg => msg.id === postId ? { ...msg, comments: [...(msg.comments || []), data] } : msg));
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      if (replyingTo?.postId === postId) setReplyingTo(null);

      if (targetPost && targetPost.user_id !== currentUser.id) {
        const senderName = profilesMap[currentUser.id]?.display_name || profilesMap[currentUser.id]?.username || 'Someone';
        const pushUrl = Capacitor.isNativePlatform() ? 'https://www.vimciety.com/api/send-push' : '/api/send-push';
        fetch(pushUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: targetPost.user_id, title: "New Comment! 💬", body: `${senderName}: ${cleanText.substring(0, 50)}${cleanText.length > 50 ? '...' : ''}` }) }).catch(err => console.error("Push failed", err));
      }
    }
    setActionLoading(prev => ({ ...prev, [`comment-${postId}`]: false }))
  }

  const handleShare = async (postId: string) => {
    const url = `https://www.vimciety.com/post/${postId}`;
    if (navigator.share) try { await navigator.share({ title: 'Check out this post on VIMciety', url }); } catch { }
    else { await navigator.clipboard.writeText(url); showToast("Link copied to clipboard!"); }
  };

  const handleManageAdPrivacy = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.showPrivacyOptionsForm();
    } catch (error) {
      console.error("Privacy form error:", error);
      showToast("Ad privacy settings are not required in your region.", 'error');
    }
  };

  async function handleBlockUser() {
    setConfirmModal({
      message: `Block user?`, onConfirm: async () => {
        setConfirmModal(null); setActionLoading(prev => ({ ...prev, blockUser: true }));
        const { error } = await supabase.from('blocks').insert({ blocker_id: currentUser.id, blocked_id: profileUser.id });
        if (!error) { setIsBlocked(true); router.push('/'); }
        setActionLoading(prev => ({ ...prev, blockUser: false }));
      }
    });
  }

  async function handleBanUser() {
    setConfirmModal({
      message: `🛡️ Admin: Permanently ban this user?`, onConfirm: async () => {
        setConfirmModal(null); setActionLoading(prev => ({ ...prev, banUser: true }));
        const { error } = await supabase.from('profiles').update({ role: 'banned', is_banned: true }).eq('id', profileUser.id);
        if (!error) { showToast("User banned successfully."); router.push('/'); } else showToast("Failed to ban user.", "error");
        setActionLoading(prev => ({ ...prev, banUser: false }));
      }
    });
  }

  async function handleReportPost(postId: string) {
    setConfirmModal({
      message: "Why are you reporting this?", showInput: true, onConfirm: async (inputValue) => {
        setConfirmModal(null); setConfirmInput(''); setActionLoading(prev => ({ ...prev, [`report-${postId}`]: true }));
        await supabase.from('reports').insert({ post_id: postId, reporter_id: currentUser.id, reason: inputValue?.trim() || 'No reason provided' });
        showToast("Report submitted.");
        setActionLoading(prev => ({ ...prev, [`report-${postId}`]: false }));
      }
    });
  }

  const renderSafeHTML = (html: string) => {
    if (!html) return null;
    const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'br', 'strong', 'em', 'b', 'i', 'ul', 'li'], ALLOWED_ATTR: ['src', 'href', 'target', 'width', 'height', 'style', 'title', 'class', 'id', 'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'loading', 'referrerpolicy'] })
    return <div dangerouslySetInnerHTML={{ __html: clean }} />
  }

  const renderPostContent = (post: any) => {
    if (post.post_type === 'embed') return <div style={{ marginTop: '10px', overflow: 'hidden', borderRadius: '8px' }}>{renderSafeHTML(post.content)}</div>;
    const urls = post.content?.match(/(https?:\/\/[^\s]+)/g);

    return (
      <div style={{ lineHeight: '1.5' }}>
        <div style={{ whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word' }}>
          <TruncatedText
            text={post.content || ''}
            maxChars={POST_COLLAPSE_CHARS}
            renderText={(t) => <span>{renderTextWithMentions(t, profilesMap, router)}</span>}
          />
        </div>
        {urls && urls[0] && (
          <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', marginTop: '15px' }}>
            <Microlink url={urls[0]} size="large" style={{ width: '100%', minWidth: 0, borderRadius: '10px', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
          </div>
        )}
      </div>
    );
  }

  // helper to derive media list (new post_media[] OR legacy media_url)
  const getMediaForPost = (post: any): Array<{ url: string; media_type: string }> => {
    if (post.post_media && post.post_media.length > 0) {
      return [...post.post_media].sort((a: any, b: any) => a.display_order - b.display_order);
    }
    if (post.media_url) {
      return [{
        url: post.media_url,
        media_type:
          post.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' :
            post.media_url.match(/\.(mp3|wav|m4a)$/i) ? 'audio' :
              post.media_url.match(/\.gif$/i) ? 'gif' : 'image'
      }];
    }
    return [];
  };

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading Profile...</div>
  if (!profileUser) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>This profile is no longer available.</div>

  const isMyProfile = currentUser && profileUser && currentUser.id === profileUser.id
  const isEmbedBackground = profileUser?.background_url && profileUser.background_url.trim().startsWith('<');

  const isViewerAdmin = profilesMap[currentUser?.id]?.is_admin === true;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, color: 'white', fontSize: '28px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {isMyProfile ? 'My Profile' : `${profileUser.display_name || 'User'}'s Profile`}
              </h1>

              {profileUser?.is_verified && (
                <span title="Verified" style={{ color: '#3b82f6', fontSize: '24px', display: 'flex', alignItems: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  ☑️
                </span>
              )}

              {profileUser?.is_admin && (
                <span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  🛡️ Admin
                </span>
              )}

              {profileUser?.is_premium && (
                <span style={{ backgroundColor: '#fbbf24', color: '#111827', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  ⭐ VIM+
                </span>
              )}
            </div>
            <button onClick={() => router.push('/')} style={{ ...STYLES.btnSecondary, backgroundColor: 'white', color: '#333' }}>← Back to Feed</button>
          </header>

          {isBlocked ? (
            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '20px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold' }}>You have blocked this user.</div>
          ) : (
            <>
              {isEditing && (
                <div style={STYLES.card}>
                  <h3 style={{ color: 'white', marginTop: 0 }}>Edit Profile Theme</h3>

                  <input type="text" value={editForm.display_name} onChange={e => setEditForm({ ...editForm, display_name: e.target.value })} style={STYLES.input} placeholder="Display Name" />

                  <input
                    type="text"
                    value={editForm.username || ''}
                    onChange={e => {
                      const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
                      setEditForm({ ...editForm, username: cleaned });
                    }}
                    style={STYLES.input}
                    placeholder="Username (used for @tagging, e.g. theamazonalchemist)"
                    maxLength={30}
                  />
                  <p style={{ margin: '-4px 0 10px 0', fontSize: '11px', color: '#9ca3af' }}>
                    Letters, numbers, dots, hyphens, and underscores only. This is your @handle for tagging.
                  </p>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input type="text" value={editForm.avatar_url} onChange={e => setEditForm({ ...editForm, avatar_url: e.target.value })} style={{ ...STYLES.input, marginBottom: 0 }} placeholder="Avatar URL" />
                    <input type="file" ref={avatarInputRef} accept="image/*" onChange={handleAvatarUpload} hidden />
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={actionLoading.uploadAvatar}
                      style={{ ...STYLES.btnSecondary, whiteSpace: 'nowrap', opacity: actionLoading.uploadAvatar ? 0.6 : 1 }}
                    >
                      {actionLoading.uploadAvatar ? '⏳' : '📷 Upload'}
                    </button>
                  </div>

                  <input type="text" value={editForm.background_url} onChange={e => setEditForm({ ...editForm, background_url: e.target.value })} style={STYLES.input} placeholder="Background URL or Embed" />
                  <input type="text" value={editForm.music_embed} onChange={e => setEditForm({ ...editForm, music_embed: e.target.value })} style={STYLES.input} placeholder="Spotify/Soundcloud/Canva Embed Code" />

                  <input type="url" value={editForm.calendly_url} onChange={e => setEditForm({ ...editForm, calendly_url: e.target.value })} style={STYLES.input} placeholder="Calendly or Booking URL" />

                  <input type="url" value={editForm.store_url} onChange={e => setEditForm({ ...editForm, store_url: e.target.value })} style={STYLES.input} placeholder="Primary Store URL 1" />
                  <input type="url" value={editForm.store_url_2} onChange={e => setEditForm({ ...editForm, store_url_2: e.target.value })} style={STYLES.input} placeholder="Store URL 2 (Optional)" />
                  <input type="url" value={editForm.store_url_3} onChange={e => setEditForm({ ...editForm, store_url_3: e.target.value })} style={STYLES.input} placeholder="Store URL 3 (Optional)" />

                  <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} style={{ ...STYLES.input, height: '60px' }} placeholder="Bio (Type a few keywords, then click Magic Write!)" />

                  <div style={{ marginBottom: '20px' }}>
                    {profileUser?.is_premium ? (
                      <>
                        <button onClick={handleMagicBio} disabled={isGeneratingBio} type="button" style={{ ...STYLES.btnPrimary, width: '100%', backgroundColor: '#a855f7', opacity: isGeneratingBio ? 0.6 : 1 }}>
                          {isGeneratingBio ? '✨ Thinking...' : '✨ Magic Write Bio'}
                        </button>
                        <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
                          Powered by Google AI. By generating, your prompt is sent to Google.
                        </p>
                      </>
                    ) : (
                      <button onClick={() => router.push('/upgrade')} type="button" style={{ ...STYLES.btnPrimary, width: '100%', backgroundColor: '#fbbf24', color: '#111827' }}>
                        ⭐ Unlock Magic Bio (Premium)
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleSaveProfile} disabled={actionLoading.saveProfile} style={{ ...STYLES.btnPrimary, opacity: actionLoading.saveProfile ? 0.6 : 1 }}>Save</button>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <h2 style={{ margin: 0, fontSize: '24px', color: '#111827', lineHeight: 1.2 }}>
                          {profileUser?.display_name || profileUser?.email}
                        </h2>
                        {profileUser?.username && (
                          <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
                            @{profileUser.username}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        {!isMyProfile && currentUser && (
                          <button onClick={handleBlockUser} disabled={actionLoading.blockUser} style={{ ...STYLES.btnDanger, opacity: actionLoading.blockUser ? 0.6 : 1 }}>🚫 Block</button>
                        )}
                        {!isMyProfile && isViewerAdmin && (
                          <button onClick={handleBanUser} disabled={actionLoading.banUser} style={{ ...STYLES.btnDanger, backgroundColor: '#7f1d1d', color: 'white', opacity: actionLoading.banUser ? 0.6 : 1 }}>🛡️ Ban User</button>
                        )}
                      </div>
                    </div>

                    {profileUser?.is_premium && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '900', color: '#ea580c', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '4px 12px', borderRadius: '9999px', marginBottom: '10px' }} title="Profile views in the last 30 days">
                        <span>🔥</span>
                        <span>{profileViews} Views (30d)</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '15px', marginBottom: '8px' }}>
                      <div style={{ color: '#4b5563', fontSize: '15px' }}><strong style={{ color: '#111827' }}>{followerCount}</strong> Followers</div>
                      <div style={{ color: '#4b5563', fontSize: '15px' }}><strong style={{ color: '#111827' }}>{followingCount}</strong> Following</div>
                    </div>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Member since: {profileUser?.memberSince}</p>
                    {profileUser?.bio && <p style={{ marginTop: '10px', color: '#374151', fontStyle: 'italic' }}>"{profileUser.bio}"</p>}
                  </div>
                </div>

                <div style={{ width: '100%', marginBottom: '15px' }}>
                  {profileUser?.is_premium ? (
                    <button
                      onClick={() => router.push(`/storefront?u=${encodeURIComponent(profileUser?.username || '')}`)}
                      style={{
                        width: '100%', padding: '14px 24px', backgroundColor: '#10B981', color: 'white',
                        border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px',
                        cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        gap: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      🛍️ Visit VIMciety Storefront
                    </button>
                  ) : isMyProfile ? (
                    <div style={{ padding: '20px', backgroundColor: '#374151', borderRadius: '12px', border: '1px solid #4b5563', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 10px 0', color: '#d1d5db', fontSize: '14px' }}>
                        Want to sell products directly on your profile?
                      </p>
                      <button
                        onClick={() => router.push('/upgrade')}
                        style={{
                          width: '100%', padding: '12px 24px', backgroundColor: '#fbbf24', color: '#111827',
                          border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer'
                        }}
                      >
                        ⭐ Upgrade to Unlock Storefront
                      </button>
                    </div>
                  ) : null}
                </div>

                {(profileUser?.store_url || profileUser?.store_url_2 || profileUser?.store_url_3) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', width: '100%' }}>
                    {profileUser?.store_url && (
                      <Microlink url={profileUser.store_url} size="normal" style={{ width: '100%', minWidth: 0, borderRadius: '10px', border: '1px solid #e5e7eb' }} />
                    )}
                    {profileUser?.store_url_2 && (
                      <Microlink url={profileUser.store_url_2} size="normal" style={{ width: '100%', minWidth: 0, borderRadius: '10px', border: '1px solid #e5e7eb' }} />
                    )}
                    {profileUser?.store_url_3 && (
                      <Microlink url={profileUser.store_url_3} size="normal" style={{ width: '100%', minWidth: 0, borderRadius: '10px', border: '1px solid #e5e7eb' }} />
                    )}
                  </div>
                )}

                {isMyProfile && !isEditing && (
                  <button onClick={() => setIsEditing(true)} style={{ ...STYLES.btnSecondary, width: '100%', marginTop: '10px' }}>
                    ✏️ Edit Profile
                  </button>
                )}

                {isMyProfile && !isEditing && Capacitor.isNativePlatform() && (
                  <button
                    onClick={handleManageAdPrivacy}
                    style={{ ...STYLES.btnSecondary, width: '100%', marginTop: '10px' }}
                  >
                    🛡️ Manage Ad Privacy (GDPR)
                  </button>
                )}
              </div>

              {!isEditing && profileUser?.music_embed && (
                <div style={{ marginBottom: '30px', width: '100%', overflow: 'hidden', borderRadius: '16px', backgroundColor: 'transparent' }}>
                  {renderSafeHTML(profileUser.music_embed)}
                </div>
              )}

              {isMyProfile && !isEditing && (
                <div style={STYLES.card}>

                  <div style={{ padding: '15px', backgroundColor: '#374151', borderRadius: '8px', marginBottom: '15px', border: '1px solid #4b5563' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: profileUser?.is_premium ? '#a855f7' : '#fbbf24' }}>
                      {profileUser?.is_premium ? '✨ AI Story Assistant' : '⭐ AI Story Assistant (Premium)'}
                    </p>

                    {profileUser?.is_premium ? (
                      <>
                        <input type="text" placeholder="What should the post be about? (e.g., Working out)" value={postTopic} onChange={(e) => setPostTopic(e.target.value)} style={{ ...STYLES.input, marginBottom: '10px', backgroundColor: '#1f2937' }} />
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <select value={postTone} onChange={(e) => setPostTone(e.target.value)} style={{ ...STYLES.input, marginBottom: 0, flex: 1, backgroundColor: '#1f2937', minWidth: '120px' }}>
                            <option value="funny">😂 Funny</option>
                            <option value="inspirational">✨ Inspirational</option>
                            <option value="professional">💼 Professional</option>
                            <option value="storytelling">📖 Story</option>
                          </select>
                          <button onClick={handleMagicPost} disabled={isGeneratingPost} style={{ ...STYLES.btnPrimary, backgroundColor: '#a855f7', flex: 1, opacity: isGeneratingPost ? 0.6 : 1, minWidth: '120px' }}>
                            {isGeneratingPost ? 'Writing...' : '✨ Generate'}
                          </button>
                        </div>
                        <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
                          Powered by Google AI. By generating, your prompt is sent to Google.
                        </p>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <p style={{ fontSize: '13px', color: '#d1d5db', margin: '0 0 15px 0' }}>
                          Never run out of ideas! Let our AI write engaging, funny, or professional posts for you automatically.
                        </p>
                        <button onClick={() => router.push('/upgrade')} style={{ ...STYLES.btnPrimary, backgroundColor: '#fbbf24', color: '#111827', width: '100%' }}>
                          ⭐ Upgrade to Premium
                        </button>
                      </div>
                    )}
                  </div>

                  <textarea
                    placeholder="What's on your mind? Tag people with @username"
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    style={{ ...STYLES.input, minHeight: '80px', marginBottom: '10px' }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*,video/*,image/gif"
                      multiple
                      onChange={handleFileSelect}
                      hidden
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={postFiles.length >= MAX_MEDIA_ITEMS}
                      style={{ ...STYLES.btnSecondary, width: '100%', textAlign: 'center', opacity: postFiles.length >= MAX_MEDIA_ITEMS ? 0.5 : 1 }}
                    >
                      📷 Add Media ({postFiles.length}/{MAX_MEDIA_ITEMS})
                    </button>

                    {postFilePreviews.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {postFilePreviews.map((preview, idx) => (
                          <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #374151', aspectRatio: '1 / 1', backgroundColor: '#000' }}>
                            {preview.type === 'video' ? (
                              <video src={`${preview.url}#t=0.001`} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <img src={preview.url} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                            <button onClick={() => removeFileAt(idx)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button onClick={handleCreatePost} disabled={actionLoading.createPost || (!postText.trim() && postFiles.length === 0)} style={{ ...STYLES.btnPrimary, width: '100%', marginTop: '10px', opacity: (actionLoading.createPost || (!postText.trim() && postFiles.length === 0)) ? 0.6 : 1 }}>
                      {actionLoading.createPost ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* POST FEED — full-bleed media, text underneath               */}
              {/* ============================================================ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {posts.map(post => {
                  const isLiked = currentUser && post.likes?.some((l: any) => l.user_id === currentUser.id);
                  const media = getMediaForPost(post);
                  return (
                    <div key={post.id} style={STYLES.cardNoPad}>

                      <PostViewTracker postId={post.id} userId={currentUser?.id} supabase={supabase} />

                      {/* DATE + ACTIONS — padded */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px 8px 20px', fontSize: '12px', color: '#9ca3af' }}>
                        <span>{new Date(post.created_at).toLocaleString()}</span>
                        <div style={{ display: 'flex', gap: '15px' }}>
                          {isMyProfile ? (
                            <button onClick={() => handleDelete(post.id, true)} disabled={actionLoading[`delete-${post.id}`]} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', minHeight: '44px' }}>Delete</button>
                          ) : (
                            <>
                              <button onClick={() => handleReportPost(post.id)} disabled={actionLoading[`report-${post.id}`]} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', minHeight: '44px' }}>Report</button>
                              {isViewerAdmin && (
                                <button onClick={() => handleDelete(post.id, false)} disabled={actionLoading[`delete-${post.id}`]} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', minHeight: '44px' }}>🛡️ Remove</button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* MEDIA — full bleed, no side padding, rendered ABOVE text */}
                      {media.length > 0 && (
                        <MediaCarousel
                          media={media}
                          currentUser={currentUser}
                          supabase={supabase}
                          postUserId={post.user_id}
                          postId={post.id}
                        />
                      )}

                      {/* TEXT CONTENT — padded, below media */}
                      <div style={{ padding: '12px 20px 4px 20px' }}>
                        {renderPostContent(post)}
                      </div>

                      {/* LIKE / COMMENT / VIEW / SHARE — padded */}
                      <div style={{ padding: '0 20px 16px 20px', marginTop: '8px', display: 'flex', gap: '15px', borderTop: '1px solid #374151', paddingTop: '12px' }}>
                        <button aria-label="Like Post" onClick={() => handleLike(post.id, !!isLiked)} style={{ ...STYLES.iconBtn, color: isLiked ? '#ef4444' : '#9ca3af' }}><span style={{ fontSize: '20px' }}>{isLiked ? '❤️' : '🤍'}</span> <span>{post.likes?.length || 0}</span></button>
                        <button aria-label="Comment on Post" onClick={() => toggleComments(post.id)} style={STYLES.iconBtn}><span style={{ fontSize: '20px' }}>💬</span> <span>{post.comments?.length || 0}</span></button>

                        {profilesMap[currentUser?.id]?.is_premium ? (
                          <div style={{ ...STYLES.iconBtn, cursor: 'default' }} title="Total Views">
                            <span style={{ fontSize: '20px' }}>👁️</span>
                            <span style={{ fontWeight: '600', fontSize: '14px' }}>{post.post_views?.length || 0}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => router.push(currentUser ? '/upgrade' : '/login')}
                            style={{ ...STYLES.iconBtn, color: '#fbbf24' }}
                            title="Upgrade to see post views!"
                          >
                            <span style={{ fontSize: '20px' }}>👁️</span>
                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>⭐</span>
                          </button>
                        )}

                        <button aria-label="Share Post" onClick={() => handleShare(post.id)} style={{ ...STYLES.iconBtn, marginLeft: 'auto' }}><span style={{ fontSize: '20px' }}>↗️</span> <span>Share</span></button>
                      </div>

                      {/* COMMENTS — padded */}
                      {openComments.has(post.id) && (
                        <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #374151' }}>

                          {(post.comments || []).filter((c: any) => !c.parent_comment_id).map((c: any) => {
                            const commenter = profilesMap[c.user_id];
                            const isCommentDeleted = c.user_id === DELETED_USER_ID;
                            const isCommentLiked = currentUser && c.comment_likes?.some((l: any) => l.user_id === currentUser.id);
                            const replies = (post.comments || []).filter((r: any) => r.parent_comment_id === c.id);

                            return (
                              <div key={c.id} style={{ marginBottom: '16px', marginTop: '16px', fontSize: '14px', wordBreak: 'break-word' }}>
                                <div>
                                  <span style={{ fontWeight: 'bold', color: isCommentDeleted ? '#6b7280' : '#d1d5db', marginRight: '4px', fontStyle: isCommentDeleted ? 'italic' : 'normal' }}>
                                    {isCommentDeleted ? 'Deleted User' : (commenter?.display_name || commenter?.username || 'User')}
                                  </span>
                                  {!isCommentDeleted && commenter?.is_verified && <span title="Verified" style={{ color: '#3b82f6', fontSize: '14px', marginRight: '4px' }}>☑️</span>}
                                  {!isCommentDeleted && commenter?.is_premium && <span title="VIM+" style={{ color: '#fbbf24', fontSize: '12px', marginRight: '8px' }}>⭐</span>}

                                  <span style={{ color: '#9ca3af', marginLeft: '4px' }}>
                                    <TruncatedText
                                      text={c.content || ''}
                                      maxChars={COMMENT_COLLAPSE_CHARS}
                                      renderText={(t) => renderTextWithMentions(t, profilesMap, router)}
                                    />
                                  </span>

                                  <div style={{ display: 'flex', gap: '15px', marginTop: '4px', fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>
                                    <span style={{ cursor: 'pointer', color: isCommentLiked ? '#ef4444' : '#6b7280' }} onClick={() => handleLikeComment(post.id, c.id, !!isCommentLiked)}>
                                      {isCommentLiked ? '❤️' : '🤍'} {c.comment_likes?.length || 0}
                                    </span>
                                    <span style={{ cursor: 'pointer' }} onClick={() => setReplyingTo({ postId: post.id, commentId: c.id, username: commenter?.display_name || commenter?.username || 'User' })}>
                                      Reply
                                    </span>
                                  </div>
                                </div>

                                {replies.length > 0 && (
                                  <div style={{ marginLeft: '15px', marginTop: '10px', paddingLeft: '15px', borderLeft: '2px solid #4b5563', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {replies.map((reply: any) => {
                                      const replier = profilesMap[reply.user_id];
                                      const isReplyDeleted = reply.user_id === DELETED_USER_ID;
                                      const isReplyLiked = currentUser && reply.comment_likes?.some((l: any) => l.user_id === currentUser.id);
                                      return (
                                        <div key={reply.id}>
                                          <span style={{ fontWeight: 'bold', color: isReplyDeleted ? '#6b7280' : '#d1d5db', marginRight: '4px', fontStyle: isReplyDeleted ? 'italic' : 'normal' }}>
                                            {isReplyDeleted ? 'Deleted User' : (replier?.display_name || replier?.username || 'User')}
                                          </span>
                                          {!isReplyDeleted && replier?.is_verified && <span title="Verified" style={{ color: '#3b82f6', fontSize: '14px', marginRight: '4px' }}>☑️</span>}
                                          {!isReplyDeleted && replier?.is_premium && <span title="VIM+" style={{ color: '#fbbf24', fontSize: '12px', marginRight: '8px' }}>⭐</span>}

                                          <span style={{ color: '#9ca3af', marginLeft: '4px' }}>
                                            <TruncatedText
                                              text={reply.content || ''}
                                              maxChars={COMMENT_COLLAPSE_CHARS}
                                              renderText={(t) => renderTextWithMentions(t, profilesMap, router)}
                                            />
                                          </span>

                                          <div style={{ marginTop: '2px', fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>
                                            <span style={{ cursor: 'pointer', color: isReplyLiked ? '#ef4444' : '#6b7280' }} onClick={() => handleLikeComment(post.id, reply.id, !!isReplyLiked)}>
                                              {isReplyLiked ? '❤️' : '🤍'} {reply.comment_likes?.length || 0}
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                            {replyingTo?.postId === post.id && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#374151', color: '#a855f7', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                <span>Replying to {replyingTo?.username}...</span>
                                <span style={{ cursor: 'pointer', fontSize: '16px', color: '#d1d5db' }} onClick={() => setReplyingTo(null)}>✕</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <input type="text" placeholder={replyingTo?.postId === post.id ? "Write a reply..." : "Add a comment... Tag with @username"} value={commentText[post.id] || ''} onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })} style={{ flex: 1, minWidth: 0, height: '44px', padding: '0 15px', borderRadius: '22px', border: '1px solid #4b5563', backgroundColor: '#374151', color: 'white', fontSize: '14px', boxSizing: 'border-box' }} />
                              <button onClick={() => handlePostComment(post.id)} disabled={actionLoading[`comment-${post.id}`]} style={{ height: '44px', padding: '0 20px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '22px', fontWeight: 'bold', cursor: 'pointer' }}>Post</button>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  )
                })}
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
    <>
      <Suspense fallback={<div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading...</div>}>
        <ProfileContent />
      </Suspense>

      <div style={{ padding: '0 20px', maxWidth: '640px', margin: '40px auto' }}>
        <hr style={{ borderColor: '#374151', marginBottom: '40px' }} />
      </div>
    </>
  )
}