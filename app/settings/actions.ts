'use server'

import { createClient } from '@/app/lib/supabaseServer'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 2. Extract all values from the form
  const slug = formData.get('slug') as string
  const bio = formData.get('bio') as string
  const spotifyId = formData.get('spotifyId') as string
  const canvaUrl = formData.get('canvaUrl') as string
  const soundcloudUrl = formData.get('soundcloudUrl') as string

  // 3. Update the profile in Supabase
  const { error } = await supabase
    .from('profiles')
    .update({
      homepage_slug: slug,
      bio: bio,
      spotify_playlist_id: spotifyId,
      canva_design_id: canvaUrl,
      soundcloud_url: soundcloudUrl 
    })
    .eq('id', user.id)

  if (error) throw error
  
  // 4. Refresh the cache so changes show up immediately
  revalidatePath('/settings')
  revalidatePath(`/u/${slug}`)
}