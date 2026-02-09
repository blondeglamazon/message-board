import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  // 1. Initialize the response
  // We start with a basic response that we might modify later
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Create the Supabase client
  // We explicitly handle cookies here because middleware cannot use 'await cookies()'
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update the REQUEST cookies so Server Components see the new session
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value)
          )
          
          // Re-create the response with the updated request
          response = NextResponse.next({
            request,
          })
          
          // Update the RESPONSE cookies so the browser saves the new session
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Refresh the session
  // This updates the cookies if the token is expired. CRITICAL for RLS to work.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 4. Admin Protection Logic
  const url = new URL(request.url)
  
  if (url.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Check if the user is actually an admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // 5. Return the response (with any updated cookies)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}