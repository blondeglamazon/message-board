import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||  'https://bbecurcljmikzkflhapy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'Y=sb_secret_F-Zwz4kFVd8ps6zb07sJPw_lJPCqUAv'
  )
}