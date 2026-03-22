import { createClient } from '@/app/lib/supabase/client'

// 📱 MOBILE COMPLIANCE: 
// Notice there is NO 'use server' at the top of this file. 
// This ensures your Capacitor iOS/Android builds compile perfectly.

export async function toggleFollow(followerId: string, followingId: string, isFollowing: boolean) {
  const supabase = createClient()
  
  try {
    if (isFollowing) {
      const { error } = await supabase
        .from('followers')
        .delete()
        .match({ follower_id: followerId, following_id: followingId })
        
      if (error) throw error;
      return { success: true };
    } else {
      const { error } = await supabase
        .from('followers')
        .insert({ follower_id: followerId, following_id: followingId })

      if (error) throw error;
      return { success: true };
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    // Returning the error allows your UI to show a toast/alert to the user
    return { success: false, error };
  }
}

export async function likePost(postId: number | string, userId: string) {
  const supabase = createClient()

  try {
    // A robust insert for a "likes" table. 
    // Make sure your Supabase table has a Unique constraint on (post_id, user_id) 
    // so users can't like the same post 100 times!
    const { error } = await supabase
      .from('likes')
      .insert({ post_id: postId, user_id: userId })

    if (error) throw error;
    return { success: true };
    
  } catch (error) {
    console.error('Error liking post:', error);
    return { success: false, error };
  }
}