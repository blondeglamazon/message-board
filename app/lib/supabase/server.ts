import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  let cookieStore;
  
  try {
    // This will fail during static export build, so we catch it
    cookieStore = await cookies()
  } catch (e) {
    cookieStore = null;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore?.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          if (!cookieStore) return;
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // ignore in static context
          }
        },
        remove(name: string, options: any) {
          if (!cookieStore) return;
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // ignore in static context
          }
        },
      },
    }
  )
}