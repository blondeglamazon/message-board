import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||  'https://bbecurcljmikzkflhapy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||'S_Pz_u30snnYnI610KDajw_ISKYlf-n'
  )
}