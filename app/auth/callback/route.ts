import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // if "next" is in param, use it as the redirect URL, default to '/profile'
  const next = searchParams.get('next') ?? '/profile'
  
  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // ✅ MOBILE COMPLIANCE & SECURITY FIX
      // Explicitly check for your native deep link scheme to safely bounce back to the app.
      const isMobileDeepLink = next.startsWith('vimciety://');
      
      if (isMobileDeepLink) {
        return NextResponse.redirect(next)
      }
      
      // Prevent "Open Redirect" attacks: Ensure standard web redirects only go to your own domain (must start with "/")
      const safeNext = next.startsWith('/') ? next : '/profile';
      
      return NextResponse.redirect(`${origin}${safeNext}`)
    } else {
      console.error("Auth Callback Error:", error.message)
      // Pass the specific error back to the UI so the user knows what went wrong (e.g., link expired)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  // If there's no code, redirect to the login page
  return NextResponse.redirect(`${origin}/login?error=CouldNotAuthenticate`)
}