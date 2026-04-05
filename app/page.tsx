'use client'

import { useState, useEffect, useRef, Suspense, useMemo, useCallback } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import DOMPurify from 'isomorphic-dompurify'
import ReportButton from '@/components/ReportButton'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor, PluginListenerHandle } from '@capacitor/core'
import { renderTextWithMentions, extractAndSaveTags } from '@/app/utils/tagging' // 🏷️ TAGGING
// @ts-ignore
import Microlink from '@microlink/react'

const MAX_IMAGE_SIZE_MB = 20;
const MAX_VIDEO_AUDIO_SIZE_MB = 500;
const PAGE_SIZE = 20; // Number of posts to load per infinite scroll batch

// 👇 1. THE NATIVE PUSH NOTIFICATION HOOK
export const usePushNotifications = (userId: string | null, supabase: any) => {
  useEffect(() => {
    let listeners: PluginListenerHandle[] = [];

    const hasAgreedToEula = typeof window !== 'undefined' ? localStorage.getItem('vimciety_eula_accepted') : null;
    if (!hasAgreedToEula) return; 

    if (!Capacitor.isNativePlatform() || !userId || !supabase) return;

    const setupPushNotifications = async () => {
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('User denied push notifications');
        return;
      }

      const regListener = await PushNotifications.addListener('registration', async (token) => {
        const { error } = await supabase.from('push_tokens').upsert({
          user_id: userId,
          token: token.value,
          platform: Capacitor.getPlatform(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'token' }); 
        
        if (error) console.error('Supabase failed to save token:', error.message);
      });
      listeners.push(regListener);

      const errorListener = await PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ', error);
      });
      listeners.push(errorListener);

      const receivedListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ', notification);
      });
      listeners.push(receivedListener);

      const actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        window.location.href = '/notifications';
      });
      listeners.push(actionListener);

      await PushNotifications.register();
    };

    setupPushNotifications();

    return () => {
      listeners.forEach(listener => listener.remove());
    };
  }, [userId, supabase]);
};

// 👇 2. UPDATED: POST VIEW TRACKER WITH 1.5s DELAY (DDOS PROTECTION)
function PostViewTracker({ postId, userId, supabase }: { postId: string, userId: string | undefined, supabase: any }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId || !ref.current) return;

    let timeoutId: NodeJS.Timeout;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Only count as a view if they look at it for 1.5 seconds
        timeoutId = setTimeout(() => {
          supabase.from('post_views').upsert({ 
              post_id: postId, 
              viewer_id: userId 
          }, { onConflict: 'post_id, viewer_id' }).then();
          observer.disconnect(); 
        }, 1500);
      } else {
        // They scrolled past too quickly, cancel the database call!
        clearTimeout(timeoutId);
      }
    }, { threshold: 0.5 });

    observer.observe(ref.current);
    
    return () => {
        observer.disconnect();
        clearTimeout(timeoutId);
    };
  }, [postId, userId, supabase]);

  return <div ref={ref} style={{ height: '1px', width: '100%', marginTop: '-1px' }} />;
}

// 👇 3. UPDATED: CREATE POST BOX WITH AUTO-RESIZING TEXTAREA
// 🏷️ TAGGING: Added profilesMap prop
function CreatePostBox({ user, supabase, showToast, isCreate, router, onPostSuccess, profilesMap }: any) {
  const [newMessage, setNewMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isEmbedMode, setIsEmbedMode] = useState(false);
  const [postType, setPostType] = useState<string>('text');
  const [uploading, setUploading] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const micInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (mediaPreview) URL.revokeObjectURL(mediaPreview); };
  }, [mediaPreview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) { clearFile(); return; }
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');

    if (!isImage && !isVideo && !isAudio) {
      showToast("Invalid file type. Please upload an image, video, or audio file.", 'error');
      if (e.target) e.target.value = ''; 
      return;
    }

    const maxSizeMB = isImage ? MAX_IMAGE_SIZE_MB : MAX_VIDEO_AUDIO_SIZE_MB;
    if (file.size > maxSizeMB * 1024 * 1024) {
      showToast(`File too large! Max for this file type is ${maxSizeMB}MB.`, 'error');
      if (e.target) e.target.value = ''; 
      return;
    }

    setMediaFile(file);
    setIsEmbedMode(false);
    
    if (isImage) setPostType('image');
    else if (isVideo) setPostType('video');
    else if (isAudio) setPostType('audio');
    else setPostType('file');

    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    setPostType('text');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (micInputRef.current) micInputRef.current.value = '';
  };

  const handlePost = async () => {
    if (!user) { router.push('/login'); return; }
    if (!newMessage.trim() && !mediaFile) return;
    
    setUploading(true);
    try {
        let publicUrl = null;
        let finalPostType = isEmbedMode ? 'embed' : postType;

        if (mediaFile) {
            const fileExt = mediaFile.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('posts').upload(fileName, mediaFile);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
            publicUrl = data.publicUrl;
        }

        const { data: newPost, error } = await supabase.from('posts').insert([{ 
            content: newMessage, user_id: user.id, post_type: finalPostType, media_url: publicUrl 
        }]).select().single();

        if (error) throw error;

        // 🏷️ TAGGING: Extract @mentions and save tags + send notifications
        if (newPost && newMessage) {
          await extractAndSaveTags(newMessage, newPost.id, user.id, profilesMap, supabase);
        }

        setNewMessage('');
        clearFile();
        setIsEmbedMode(false);
        showToast("Post created successfully!");

        if (newPost && onPostSuccess) {
            onPostSuccess(newPost);
        }

        if (isCreate) router.push('/');

    } catch (e: any) { 
        showToast("Upload Error: " + e.message, 'error');
    }
    setUploading(false);
  };

  return (
    <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        {/* Auto-resizing textarea */}
        <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
            }}
            placeholder={isEmbedMode ? "Paste embed code here..." : "What's on your mind? Tag people with @username"}
            style={{ 
                width: '100%', padding: '12px', borderRadius: '12px', 
                border: '1px solid #d1d5db', marginBottom: '15px', 
                minHeight: '80px', maxHeight: '300px', 
                backgroundColor: isEmbedMode ? '#1f2937' : '#ffffff', 
                color: isEmbedMode ? '#00ff00' : '#111827', 
                fontSize: '16px', resize: 'none', boxSizing: 'border-box',
                overflowY: 'auto'
            }}
        />
        
        {mediaPreview && (
            <div style={{ marginBottom: '15px', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                {postType === 'video' ? (
                <video src={`${mediaPreview}#t=0.001`} controls playsInline style={{ width: '100%', display: 'block', maxHeight: '300px' }} />
                ) : postType === 'audio' ? (
                <div style={{padding:'20px', background:'#f3f4f6'}}><audio controls src={mediaPreview} style={{width:'100%'}} /></div>
                ) : (
                <img src={mediaPreview} alt="Preview" style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'contain' }} />
                )}
                <button onClick={clearFile} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => cameraInputRef.current?.click()} style={{ flex: 1, minHeight: '44px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: '20px' }} title="Camera">📷</button>
            <input type="file" ref={cameraInputRef} onChange={handleFileSelect} accept="image/*,video/*" hidden />

            <button onClick={() => micInputRef.current?.click()} style={{ flex: 1, minHeight: '44px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: '20px' }} title="Microphone">🎤</button>
            <input type="file" ref={micInputRef} onChange={handleFileSelect} accept="audio/*" hidden />

            <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, minHeight: '44px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontSize: '20px' }} title="Upload">📁</button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*,audio/*" hidden />

            <button 
                onClick={() => setIsEmbedMode(!isEmbedMode)} 
                style={{ flex: 1, minHeight: '44px', borderRadius: '8px', border: isEmbedMode ? '2px solid #6366f1' : '1px solid #e5e7eb', backgroundColor: isEmbedMode ? '#e0e7ff' : 'white', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                mb
            </button>

            <button 
                onClick={handlePost}
                disabled={uploading}
                style={{ minHeight: '44px', padding: '0 24px', backgroundColor: uploading ? '#9ca3af' : '#111827', color: 'white', borderRadius: '22px', border: 'none', cursor: uploading ? 'default' : 'pointer', fontWeight: 'bold', marginLeft: 'auto' }}
            >
                {uploading ? '...' : 'Post'}
            </button>
        </div>
    </div>
  );
}

function MessageBoardContent() {
  const [supabase] = useState(() => createClient())
  const router = useRouter()
  const searchParams = useSearchParams()

  const [messages, setMessages] = useState<any[]>([])
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({}) 
  
  const [user, setUser] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Infinite Scroll State
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ msg, type })
      setTimeout(() => setToast(null), 3000)
  }
  
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({})
  const [openComments, setOpenComments] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<{ postId: string, commentId: string, username: string } | null>(null)
  const [submittingComment, setSubmittingComment] = useState<string | null>(null)
  
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const blockedIdsRef = useRef<string[]>([])
  const [blockedIds, setBlockedIds] = useState<string[]>([])
  const followingIdsRef = useRef<Set<string>>(new Set())
  
  const currentFeed = searchParams.get('feed') || 'global' 
  const urlSearchQuery = searchParams.get('q') || ''
  const isCreate = searchParams.get('create') === 'true'

  usePushNotifications(user?.id, supabase);

  // 👇 4. UPDATED: QUERY NOW ACCEPTS AN OLDEST DATE FOR PAGINATION
  async function buildFeedQuery(authUser: any, oldestDate?: string) {
    let query = supabase
      .from('posts')
      .select(`*, likes ( user_id ), comments ( id, content, user_id, created_at, parent_comment_id, comment_likes ( user_id ) ), post_views ( viewer_id )`)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (oldestDate) {
      query = query.lt('created_at', oldestDate);
    }

    if (blockedIdsRef.current.length > 0) {
      query = query.not('user_id', 'in', `(${blockedIdsRef.current.join(',')})`)
    }

    if (authUser && currentFeed === 'following') {
      const ids = Array.from(followingIdsRef.current)
      query = ids.length > 0 ? query.in('user_id', ids) : query.in('user_id', ['00000000-0000-0000-0000-000000000000']);
    } 
    else if (authUser && currentFeed === 'friends') {
      const { data: followsMe } = await supabase.from('followers').select('follower_id').eq('following_id', authUser.id)
      const theirIds = new Set(followsMe?.map(f => f.follower_id) || [])
      const friendIds = Array.from(followingIdsRef.current).filter(id => theirIds.has(id))
      query = friendIds.length > 0 ? query.in('user_id', friendIds) : query.in('user_id', ['00000000-0000-0000-0000-000000000000']);
    }
    return query
  }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    async function initData() {
      setIsLoading(true)
      setHasMore(true) // Reset pagination on feed change
      
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)

      const { data: allProfiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url, is_premium')
      const pMap: Record<string, any> = {}
      allProfiles?.forEach(p => { pMap[p.id] = p })
      setProfilesMap(pMap)

      if (authUser) {
        const { data: blocks } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', authUser.id)
        const myBlockedIds = blocks?.map(b => b.blocked_id) || []
        setBlockedIds(myBlockedIds)
        blockedIdsRef.current = myBlockedIds

        const { data: follows } = await supabase.from('followers').select('following_id').eq('follower_id', authUser.id)
        const myFollowingIds = new Set(follows?.map(f => f.following_id) || [])
        setFollowingIds(myFollowingIds)
        followingIdsRef.current = myFollowingIds
      }

      const query = await buildFeedQuery(authUser)
      const { data: posts } = await query
      if (posts) {
        setMessages(posts)
        if (posts.length < PAGE_SIZE) setHasMore(false)
      }
      
      setIsLoading(false)
    }
    
    initData()
    
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        const newPostUserId = payload.new.user_id;
        if (blockedIdsRef.current.includes(newPostUserId)) return;
        if (currentFeed === 'following' && newPostUserId !== user?.id) {
          if (!followingIdsRef.current.has(newPostUserId)) return;
        }
        setMessages((prev) => {
            if (prev.some(p => p.id === payload.new.id)) return prev;
            return [{ ...payload.new, likes: [], comments: [], post_views: [] }, ...prev];
        });
      }).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentFeed, supabase])

  // 👇 5. INFINITE SCROLL LOADER
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    
    try {
      const oldestDate = messages[messages.length - 1].created_at;
      const query = await buildFeedQuery(user, oldestDate);
      const { data: olderPosts } = await query;

      if (olderPosts && olderPosts.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = olderPosts.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
        if (olderPosts.length < PAGE_SIZE) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more posts", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, messages, user, currentFeed]);

  // Observer to trigger infinite scroll when reaching the bottom
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !isLoading) {
        handleLoadMore();
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleLoadMore, hasMore, loadingMore, isLoading]);

  const handleSharePost = async (postId: string, postUsername: string, postContent: string) => {
    const shareUrl = `https://www.vimciety.com/post/${postId}`;
    const shareData = { title: `Post by @${postUsername} | VIMciety`, text: postContent ? postContent.substring(0, 100) + '...' : `Check out this post!`, url: shareUrl };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) {}
    } else {
      try { await navigator.clipboard.writeText(shareUrl); showToast('Post link copied to clipboard!'); } catch (err) { showToast('Failed to copy link.', 'error'); }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
  }

  async function handleFollow(targetUserId: string) {
    if (!user) return showToast("Please login to follow users.", 'error');
    if (user.id === targetUserId) return; 

    const isFollowing = followingIds.has(targetUserId);
    const newFollowing = new Set(followingIds);

    if (isFollowing) {
      newFollowing.delete(targetUserId);
      await supabase.from('followers').delete().match({ follower_id: user.id, following_id: targetUserId });
    } else {
      newFollowing.add(targetUserId);
      await supabase.from('followers').insert({ follower_id: user.id, following_id: targetUserId });
      await supabase.from('notifications').insert({ user_id: targetUserId, actor_id: user.id, type: 'follow' });
    }
    setFollowingIds(newFollowing);
    followingIdsRef.current = newFollowing;
  }

  async function handleLike(postId: string, isLiked: boolean) {
    if (!user) return showToast("Please login to like posts.", 'error')
    setMessages(prev => prev.map(msg => msg.id === postId ? { ...msg, likes: isLiked ? msg.likes.filter((l: any) => l.user_id !== user.id) : [...msg.likes, { user_id: user.id }] } : msg))
    
    if (isLiked) {
      await supabase.from('likes').delete().match({ user_id: user.id, post_id: postId })
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId })
      const targetPost = messages.find(m => m.id === postId);
      if (targetPost && targetPost.user_id !== user.id) { 
        await supabase.from('notifications').insert({ user_id: targetPost.user_id, actor_id: user.id, type: 'like', post_id: postId });
      }
    }
  }

  async function handleLikeComment(postId: string, commentId: string, isLiked: boolean) {
    if (!user) return showToast("Please login.", 'error');

    setMessages(prev => prev.map(msg => {
        if (msg.id !== postId) return msg;
        return {
            ...msg,
            comments: (msg.comments || []).map((c: any) => {
                if (c.id !== commentId) return c;
                return {
                    ...c,
                    comment_likes: isLiked 
                        ? (c.comment_likes || []).filter((l: any) => l.user_id !== user.id) 
                        : [...(c.comment_likes || []), { user_id: user.id }]
                };
            })
        };
    }));

    if (isLiked) {
        await supabase.from('comment_likes').delete().match({ comment_id: commentId, user_id: user.id });
    } else {
        await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
    }
  }

  const toggleComments = (postId: string) => {
    const newSet = new Set(openComments)
    if (newSet.has(postId)) {
        newSet.delete(postId)
        if (replyingTo?.postId === postId) setReplyingTo(null)
    } else {
        newSet.add(postId)
    }
    setOpenComments(newSet)
  }

  async function handlePostComment(postId: string) {
    if (!user) return showToast("Please login to comment.", 'error')
    const text = commentText[postId]?.trim()
    if (!text) return
    
    if (submittingComment === postId) return;
    setSubmittingComment(postId);

    try {
        const parentId = replyingTo?.postId === postId ? replyingTo?.commentId : null;

        const { data: newComment, error } = await supabase.from('comments').insert({ 
            post_id: postId, user_id: user.id, content: text, parent_comment_id: parentId 
        }).select('*, comment_likes(user_id)').single()
        
        if (error) throw error;
        
        setMessages(prev => prev.map(msg => msg.id === postId ? { ...msg, comments: [...(msg.comments || []), newComment] } : msg))
        setCommentText(prev => ({ ...prev, [postId]: '' }))
        if (replyingTo?.postId === postId) setReplyingTo(null);

        const targetPost = messages.find(m => m.id === postId);
        if (targetPost && targetPost.user_id !== user.id) { 
            await supabase.from('notifications').insert({ user_id: targetPost.user_id, actor_id: user.id, type: 'comment', post_id: postId });
        }
    } catch (error: any) {
        showToast("Error: " + error.message, 'error')
    } finally {
        setSubmittingComment(null);
    }
  }

  const handlePostSuccess = (newPost: any) => {
    setMessages((prev) => {
        if (prev.some(p => p.id === newPost.id)) return prev;
        return [{ ...newPost, likes: [], comments: [], post_views: [] }, ...prev];
    });
  };

  const renderSafeHTML = (html: string) => {
    if (!html) return null;
    const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['iframe', 'div', 'p', 'span', 'a', 'img', 'br', 'strong', 'em', 'b', 'i', 'ul', 'li', 'link'],
        ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'frameborder', 'allow', 'allowfullscreen', 'scrolling', 'href', 'target', 'rel', 'title', 'class', 'id', 'loading', 'referrerpolicy', 'data-url', 'data-image', 'data-description'],
        ADD_TAGS: ['iframe', 'link']
    })
    return <div style={{ width: '100%', overflow: 'hidden', marginTop: '10px', borderRadius: '12px' }} dangerouslySetInnerHTML={{ __html: clean }} />
  }

  const renderContent = (msg: any) => {
    if (msg.post_type === 'embed' || (typeof msg.content === 'string' && msg.content.trim().startsWith('<'))) {
      return <div style={{marginTop:'10px', overflow:'hidden', borderRadius:'8px'}}>{renderSafeHTML(msg.content)}</div>;
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = msg.content?.match(urlRegex);
    const firstUrl = urls ? urls[0] : null;

    return (
      <div>
        <div style={{ lineHeight: '1.6', color: '#111827', fontSize: '16px' }}>
          <p style={{ whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word', maxWidth: '100%' }}>
            {/* 🏷️ TAGGING: Replaced renderTextWithLinks with renderTextWithMentions */}
            {renderTextWithMentions(msg.content, profilesMap, router)}
          </p>
          
          {firstUrl && (
            <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', marginTop: '15px' }}>
                <Microlink url={firstUrl} size="large" style={{ width: '100%', minWidth: 0, borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', color: '#111827' }} />
            </div>
          )}
        </div>

        {msg.media_url && (
          <div style={{ marginTop: '15px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', maxWidth: '100%' }}>
            {msg.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
              <video src={`${msg.media_url}#t=0.001`} controls playsInline preload="metadata" style={{ width: '100%', display: 'block' }} />
            ) : msg.media_url.match(/\.(mp3|wav|m4a)$/i) ? (
              <div style={{padding:'20px', background:'#f3f4f6'}}>
                <audio controls src={msg.media_url} preload="metadata" style={{ width: '100%' }} />
              </div>
            ) : (
              <img src={msg.media_url} alt="Post media" loading="lazy" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />
            )}
          </div>
        )}
      </div>
    );
  }

  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      const query = urlSearchQuery
      if (!query) return true;
      const lowerQ = query.toLowerCase();
      const profile = profilesMap[msg.user_id];
      return (msg.content?.toLowerCase().includes(lowerQ) || profile?.username?.toLowerCase().includes(lowerQ) || profile?.display_name?.toLowerCase().includes(lowerQ));
    });
  }, [messages, urlSearchQuery, profilesMap]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      
      {toast && (
          <div style={{
              position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: toast.type === 'error' ? '#ef4444' : '#22c55e',
              color: 'white', padding: '12px 24px',
              borderRadius: '24px', zIndex: 9999, fontWeight: 'bold', fontSize: '14px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', transition: 'opacity 0.3s ease-in-out'
          }}>
              {toast.msg}
          </div>
      )}

      <Sidebar />

      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100, display: 'flex', gap: '10px' }}>
        {user ? (
          <button onClick={handleSignOut} style={{ minHeight: '44px', padding: '0 20px', borderRadius: '22px', border: '2px solid #111827', backgroundColor: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', color: '#111827' }}>Log Out</button>
        ) : (
          <button onClick={() => router.push('/login')} style={{ minHeight: '44px', display:'flex', alignItems:'center', padding: '0 20px', borderRadius: '22px', backgroundColor: 'white', color: '#111827', fontWeight: 'bold', cursor: 'pointer', border: '2px solid #111827', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>Log In</button>
        )}
      </div>
      
      <main style={{ maxWidth: '600px', margin: '0 auto', paddingTop: 'calc(20px + env(safe-area-inset-top))', paddingLeft: '20px', paddingRight: '20px', paddingBottom: '100px', overflowX: 'hidden' }}>
         
         <div style={{ marginBottom: '20px', marginTop: '40px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: 0 }}>
                {currentFeed === 'global' ? 'EXPLORE' : `${currentFeed.toUpperCase()} FEED`}
            </h2>
         </div>

         {/* 🏷️ TAGGING: Pass profilesMap to CreatePostBox */}
         {user && (
            <CreatePostBox user={user} supabase={supabase} showToast={showToast} isCreate={isCreate} router={router} onPostSuccess={handlePostSuccess} profilesMap={profilesMap} />
         )}

         <div style={{ marginBottom: '20px', width: '100%' }}>
            <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: '800', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
                DOWNLOAD THE MOBILE APP
            </p>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <a href="https://play.google.com/store/apps/details?id=com.vimciety.app" target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, minHeight: '44px', backgroundColor: '#111827', color: 'white', textDecoration: 'none', borderRadius: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>🤖 Android</a>
                <a href="https://testflight.apple.com/join/87KV8sGZ" target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, minHeight: '44px', backgroundColor: '#111827', color: 'white', textDecoration: 'none', borderRadius: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>🍎 iOS</a>
            </div>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {isLoading ? (
               <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontWeight: 'bold' }}>Loading feed...</div>
            ) : filteredMessages.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e5e7eb' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '18px', margin: '0 0 10px 0', color: '#111827' }}>No posts yet!</p>
                  <p style={{ margin: 0 }}>{currentFeed !== 'global' ? "Follow more people to see their updates here." : "Be the first one to post something."}</p>
               </div>
            ) : (
                filteredMessages.map((msg) => {
                    const profile = profilesMap[msg.user_id]
                    const username = profile?.username || 'Anonymous';
                    const displayName = profile?.display_name || username;
                    const isLiked = user && msg.likes?.some((l: any) => l.user_id === user.id);
                    
                    return (
                        <div key={msg.id} style={{ padding: '20px', borderRadius: '20px', border: '1px solid #e5e7eb', backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            
                            <PostViewTracker postId={msg.id} userId={user?.id} supabase={supabase} />

                            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div onClick={() => router.push(`/profile?u=${username}`)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                        <img src={profile?.avatar_url || '/default-avatar.png'} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '15px' }}>{displayName}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(msg.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {user && user.id !== msg.user_id && (
                                        <button onClick={() => handleFollow(msg.user_id)} style={{ padding: '6px 14px', minHeight: '44px', borderRadius: '20px', border: followingIds.has(msg.user_id) ? '1px solid #d1d5db' : 'none', backgroundColor: followingIds.has(msg.user_id) ? 'white' : '#111827', color: followingIds.has(msg.user_id) ? '#374151' : 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                                          {followingIds.has(msg.user_id) ? 'Following' : 'Follow'}
                                        </button>
                                    )}
                                    <ReportButton postId={msg.id} />
                                </div>
                            </div>

                            {renderContent(msg)}
                            
                            <div style={{ marginTop: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <button onClick={() => handleLike(msg.id, !!isLiked)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? '#ef4444' : '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px', padding: '0' }}>
                                  <span style={{ fontSize: '20px' }}>{isLiked ? '❤️' : '🤍'}</span> 
                                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{msg.likes?.length || 0}</span>
                                </button>
                                
                                <button onClick={() => toggleComments(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px', padding: '0' }}>
                                  <span style={{ fontSize: '20px' }}>💬</span> 
                                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{msg.comments?.length || 0}</span>
                                </button>

                                {profilesMap[user?.id]?.is_premium ? (
                                    <div style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px', padding: '0' }} title="Total Views">
                                        <span style={{ fontSize: '20px' }}>👁️</span> 
                                        <span style={{ fontWeight: '600', fontSize: '14px' }}>{msg.post_views?.length || 0}</span>
                                    </div>
                                ) : (
                                    <button onClick={() => router.push(user ? '/upgrade' : '/login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px', padding: '0' }} title="Upgrade to see post views!">
                                        <span style={{ fontSize: '20px' }}>👁️</span> 
                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>⭐</span>
                                    </button>
                                )}

                                <button onClick={() => handleSharePost(msg.id, username, msg.content)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '44px', minHeight: '44px', padding: '0', marginLeft: 'auto' }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                  <span style={{ fontWeight: '600', fontSize: '14px' }}>Share</span>
                                </button>
                            </div>

                            {openComments.has(msg.id) && (
                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f3f4f6' }}>
                                    
                                    {(msg.comments || []).filter((c: any) => !c.parent_comment_id).map((c: any) => {
                                        const commenter = profilesMap[c.user_id];
                                        const isCommentLiked = user && c.comment_likes?.some((l: any) => l.user_id === user.id);
                                        const replies = (msg.comments || []).filter((r: any) => r.parent_comment_id === c.id);

                                        return (
                                            <div key={c.id} style={{ marginBottom: '16px', fontSize: '14px', wordBreak: 'break-word' }}>
                                                <div>
                                                    <span style={{ fontWeight: 'bold', color: '#111827', marginRight: '8px' }}>
                                                        {commenter?.display_name || commenter?.username || 'User'}
                                                    </span>
                                                    <span style={{ color: '#4b5563' }}>{c.content}</span>
                                                    
                                                    <div style={{ display: 'flex', gap: '15px', marginTop: '4px', fontSize: '12px', fontWeight: 'bold', color: '#9ca3af' }}>
                                                        <span style={{ cursor: 'pointer', color: isCommentLiked ? '#ef4444' : '#9ca3af' }} onClick={() => handleLikeComment(msg.id, c.id, !!isCommentLiked)}>
                                                            {isCommentLiked ? '❤️' : '🤍'} {c.comment_likes?.length || 0}
                                                        </span>
                                                        <span style={{ cursor: 'pointer' }} onClick={() => setReplyingTo({ postId: msg.id, commentId: c.id, username: commenter?.display_name || commenter?.username || 'User' })}>
                                                            Reply
                                                        </span>
                                                    </div>
                                                </div>

                                                {replies.length > 0 && (
                                                    <div style={{ marginLeft: '15px', marginTop: '10px', paddingLeft: '15px', borderLeft: '2px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        {replies.map((reply: any) => {
                                                            const replier = profilesMap[reply.user_id];
                                                            const isReplyLiked = user && reply.comment_likes?.some((l: any) => l.user_id === user.id);
                                                            return (
                                                                <div key={reply.id}>
                                                                    <span style={{ fontWeight: 'bold', color: '#111827', marginRight: '8px' }}>
                                                                        {replier?.display_name || replier?.username || 'User'}
                                                                    </span>
                                                                    <span style={{ color: '#4b5563' }}>{reply.content}</span>
                                                                    <div style={{ marginTop: '2px', fontSize: '12px', fontWeight: 'bold', color: '#9ca3af' }}>
                                                                        <span style={{ cursor: 'pointer', color: isReplyLiked ? '#ef4444' : '#9ca3af' }} onClick={() => handleLikeComment(msg.id, reply.id, !!isReplyLiked)}>
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
                                        {replyingTo?.postId === msg.id && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                                <span>Replying to {replyingTo?.username}...</span>
                                                <span style={{ cursor: 'pointer', fontSize: '16px' }} onClick={() => setReplyingTo(null)}>✕</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input 
                                                type="text" 
                                                placeholder={replyingTo?.postId === msg.id ? "Write a reply..." : "Add a comment..."} 
                                                value={commentText[msg.id] || ''} 
                                                onChange={(e) => setCommentText({ ...commentText, [msg.id]: e.target.value })} 
                                                style={{ flex: 1, minWidth: 0, height: '44px', padding: '0 15px', borderRadius: '22px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }} 
                                                disabled={submittingComment === msg.id}
                                            />
                                            <button 
                                                onClick={() => handlePostComment(msg.id)} 
                                                disabled={submittingComment === msg.id}
                                                style={{ 
                                                    minHeight: '44px', 
                                                    padding: '0 20px', 
                                                    backgroundColor: submittingComment === msg.id ? '#9ca3af' : '#111827', 
                                                    color: 'white', 
                                                    border: 'none', 
                                                    borderRadius: '22px', 
                                                    fontWeight: 'bold', 
                                                    cursor: submittingComment === msg.id ? 'not-allowed' : 'pointer' 
                                                }}
                                            >
                                                {submittingComment === msg.id ? 'Posting...' : 'Post'}
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    )
                })
            )}

            {/* 👇 6. INFINITE SCROLL TRIGGER OR FALLBACK BUTTON */}
            {hasMore && filteredMessages.length > 0 && (
              <div ref={loadMoreRef} style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontWeight: 'bold' }}>
                {loadingMore ? 'Loading more posts...' : 'Scroll down for more'}
              </div>
            )}
            {!hasMore && filteredMessages.length > 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '14px', fontWeight: 'bold' }}>
                You've reached the end of the feed!
              </div>
            )}

         </div>

         <footer style={{ marginTop: '60px', padding: '20px', textAlign: 'center' }}>
            <Link href="/privacy" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>
               Privacy Policy
            </Link>
         </footer>
      </main>
    </div>
  )
}

export default function MessageBoard() {
  return (
    <Suspense fallback={<div style={{color: '#111827', padding: '20px', textAlign:'center'}}>Loading...</div>}>
      <MessageBoardContent />
    </Suspense>
  )
}