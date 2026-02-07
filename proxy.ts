import { NextResponse } from 'next/server'
import { createClient } from './lib/supabase/server'

export async function proxy(req: Request) {
  const res = NextResponse.next()
  const supabase = createClient()

  // Check for the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = new URL(req.url)

  // 🛠️ Admin Protection Logic
  // Protect all routes starting with /admin
  if (url.pathname.startsWith('/admin')) {
    // 1. Redirect to home if not logged in at all
    if (!user) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // 2. Fetch the user's role from the database
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // 3. Redirect to home if they are not an administrator
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}