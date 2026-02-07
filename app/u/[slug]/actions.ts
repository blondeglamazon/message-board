'use server'
import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFollow(followerId: string, followingId: string, isFollowing: boolean) {
  const supabase = await createClient()
  if (isFollowing) {
    await supabase.from('follows').delete().match({ follower_id: followerId, following_id: followingId })
  } else {
    await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
  }
  revalidatePath(`/u/${followerId}`)
}

export async function likePost(postId: number, slug: string) {
  const supabase = await createClient()
  await supabase.from('posts').update({ likes_count: 1 }).eq('id', postId) // Simplified for testing
  revalidatePath(`/u/${slug}`)
}