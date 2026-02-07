import { NextResponse } from 'next/server'
import { createClient } from './app/lib/supabase/server' // [cite: 10]

export async function proxy(req: Request) {
  const res = NextResponse.next()
  
  // FIX: Add 'await' before createClient()
  const supabase = await createClient()

  // Now 'supabase' is the actual client, not a Promise
  const { data: { user } } = await supabase.auth.getUser()

  const url = new URL(req.url)

  // 🛠️ Admin Protection Logic
  if (url.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // This will now work correctly
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}