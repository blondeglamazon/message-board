import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||  'https://bbecurcljmikzkflhapy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZWN1cmNsam1pa3prZmxoYXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDMxMjYsImV4cCI6MjA4NTExOTEyNn0.27ghmb36D5Xpe0IoLtGNRlE51RWTIURenoltoMDWMfI'
  )
}