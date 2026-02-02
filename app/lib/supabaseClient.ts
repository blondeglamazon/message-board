import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use createBrowserClient for Next.js Client Components
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)

/**
 * Helper to check connection status
 */
export const checkConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1)
      if (!error) return true
      console.warn(`Connection attempt ${i + 1} failed, retrying...`)
    } catch (err) {
      console.error("Connection error:", err)
    }
    await new Promise(res => setTimeout(res, 2000))
  }
  return false
}