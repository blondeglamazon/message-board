import { createClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.from('profiles').upsert({
      id: user.id,
      username: user.email?.split('@')[0],
      role: 'user'
    })
  }

  return NextResponse.redirect(new URL('/', request.url))
}
