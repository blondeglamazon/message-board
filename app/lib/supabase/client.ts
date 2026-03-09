import { createBrowserClient } from '@supabase/ssr'
import { Capacitor } from '@capacitor/core'
import { createClient as createStandardClient } from '@supabase/supabase-js'

export function createClient() {
  // 📱 If we are on iOS or Android, use standard LocalStorage instead of Cookies!
  if (Capacitor.isNativePlatform()) {
    return createStandardClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ||  'https://bbecurcljmikzkflhapy.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZWN1cmNsam1pa3prZmxoYXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDMxMjYsImV4cCI6MjA4NTExOTEyNn0.27ghmb36D5Xpe0IoLtGNRlE51RWTIURenoltoMDWMfI'
    )
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||  'https://bbecurcljmikzkflhapy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZWN1cmNsam1pa3prZmxoYXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDMxMjYsImV4cCI6MjA4NTExOTEyNn0.27ghmb36D5Xpe0IoLtGNRlE51RWTIURenoltoMDWMfI'
  )
}