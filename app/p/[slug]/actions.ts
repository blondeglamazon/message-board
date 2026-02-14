import { createClient } from '@/app/lib/supabase/client' // <--- Import createClient, not supabase

export async function toggleFollow(followerId: string, followingId: string, isFollowing: boolean) {
  const supabase = createClient() // <--- Initialize it here
  
  if (isFollowing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId })
      
    if (error) console.error('Error unfollowing:', error)
  } else {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId })

    if (error) console.error('Error following:', error)
  }
}

export async function likePost(postId: number | string) {
  const supabase = createClient() // <--- Initialize it here

  // Example logic - adjust based on your actual needs
  // Note: For a real app you might want to check if the user already liked it first
  // This is a simplified increment example
  /* const { error } = await supabase.rpc('increment_likes', { post_id: postId }) 
  */
}