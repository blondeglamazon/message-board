import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts"

// 🍏 1. Function to securely generate the Apple APNs JWT on the fly
async function generateAppleJwt() {
  const teamId = Deno.env.get('APNS_TEAM_ID')!
  const keyId = Deno.env.get('APNS_KEY_ID')!
  const privateKey = Deno.env.get('APNS_PRIVATE_KEY')!

  // Format the key properly for the Deno environment
  const pkcs8 = privateKey.replace(/\\n/g, '\n')
  const key = await jose.importPKCS8(pkcs8, 'ES256')
  
  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .sign(key)
    
  return jwt
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    
    // Check if this is coming from a Database Webhook (INSERT) or a direct API call
    const record = payload.type === 'INSERT' ? payload.record : payload
    
    const user_id = record.user_id
    // Provide fallback text if your database webhook doesn't pass a specific title/body
    const title = record.title || "VIMciety"
    const body = record.body || "You have a new notification!"

    if (!user_id) {
       return new Response(JSON.stringify({ error: 'No user_id provided' }), { status: 400 })
    }

    // 2. Connect to Supabase as an Admin to bypass RLS and read the push_tokens table
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Grab all registered devices for this specific user
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', user_id)

    if (error || !tokens || tokens.length === 0) {
      // Return 200 so webhooks don't fail endlessly in the background
      return new Response(JSON.stringify({ message: 'No tokens found for user, skipped.' }), { status: 200 })
    }

    const bundleId = Deno.env.get('APNS_BUNDLE_ID')!
    let apnsJwt: string | null = null
    const results = []

    // 4. Loop through their devices and route to Apple or Google
    for (const device of tokens) {
      
      if (device.platform === 'ios') {
        // --- 🍏 iOS ROUTING (Direct to Apple) ---
        if (!apnsJwt) apnsJwt = await generateAppleJwt()

        const apnsPayload = {
          aps: { alert: { title, body }, sound: 'default', badge: 1 }
        }

        const headers = {
          'authorization': `bearer ${apnsJwt}`,
          'apns-topic': bundleId,
          'apns-push-type': 'alert',
          'apns-priority': '10'
        }

        // Try Production first (App Store & TestFlight)
        let res = await fetch(`https://api.push.apple.com/3/device/${device.token}`, {
          method: 'POST', headers, body: JSON.stringify(apnsPayload)
        })

        // Smart Fallback: If it's a Sandbox token (Xcode cable testing), Apple returns 400 BadDeviceToken.
        // We catch it and reroute it to the Sandbox server automatically!
        if (res.status === 400) {
          const errorRes = await res.json()
          if (errorRes.reason === 'BadDeviceToken') {
            res = await fetch(`https://api.sandbox.push.apple.com/3/device/${device.token}`, {
              method: 'POST', headers, body: JSON.stringify(apnsPayload)
            })
          }
        }
        
        results.push({ platform: 'ios', token: device.token, status: res.status })
      } 
      
      else if (device.platform === 'android') {
        // --- 🤖 ANDROID ROUTING (Firebase FCM) ---
        // (If you have existing FCM logic, it goes here. Otherwise, Android tokens are skipped for now).
        results.push({ platform: 'android', token: device.token, status: 'FCM_PENDING' })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    })
    
  } catch (err: any) {
    console.error("Push Error:", err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})