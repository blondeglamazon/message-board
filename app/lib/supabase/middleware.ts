import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // 1. Create an initial response
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 2. Create the Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update the request cookies (so Server Components see the new session)
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          
          // Reset the response to apply the new cookies
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Set the cookies on the response (so the browser sees them)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Refresh the session if needed
  // This is the critical part that rotates the token!
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 4. Protect Routes (Optional - Add your own logic here)
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/') // Allow home page
  ) {
    // Redirect to login if no user
    // const url = request.nextUrl.clone()
    // url.pathname = '/login'
    // return NextResponse.redirect(url)
  }

  return supabaseResponse
}