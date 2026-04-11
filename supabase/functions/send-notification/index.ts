import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts"

// 🍏 Apple APNs JWT
async function generateAppleJwt() {
  const teamId = Deno.env.get('APNS_TEAM_ID')!
  const keyId = Deno.env.get('APNS_KEY_ID')!
  const privateKey = Deno.env.get('APNS_PRIVATE_KEY')!
  const pkcs8 = privateKey.replace(/\\n/g, '\n')
  const key = await jose.importPKCS8(pkcs8, 'ES256')
  return await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .sign(key)
}

// 🤖 Google FCM v1 OAuth2 access token from service account
async function getFcmAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const privateKey = await jose.importPKCS8(serviceAccount.private_key, 'RS256')
  const jwt = await new jose.SignJWT(claim)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(privateKey)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    throw new Error(`FCM OAuth failed: ${res.status} ${await res.text()}`)
  }
  const json = await res.json()
  return json.access_token
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.type === 'INSERT' ? payload.record : payload

    const user_id = record.user_id
    const title = record.title || "VIMciety"
    const body = record.body || "You have a new notification!"

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'No user_id provided' }), { status: 400 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', user_id)

    if (error || !tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'No tokens found for user, skipped.' }), { status: 200 })
    }

    const bundleId = Deno.env.get('APNS_BUNDLE_ID')!
    let apnsJwt: string | null = null

    // Lazy-load FCM credentials only if we encounter an Android token
    let fcmAccessToken: string | null = null
    let fcmProjectId: string | null = null
    const ensureFcm = async () => {
      if (fcmAccessToken) return
      const raw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!
      const serviceAccount = JSON.parse(raw)
      fcmProjectId = serviceAccount.project_id
      fcmAccessToken = await getFcmAccessToken(serviceAccount)
    }

    const results = []

    for (const device of tokens) {
      if (device.platform === 'ios') {
        // --- 🍏 iOS (APNs) ---
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

        let res = await fetch(`https://api.push.apple.com/3/device/${device.token}`, {
          method: 'POST', headers, body: JSON.stringify(apnsPayload)
        })

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
        // --- 🤖 Android (FCM v1) ---
        try {
          await ensureFcm()

          const fcmRes = await fetch(
            `https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${fcmAccessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: {
                  token: device.token,
                  notification: { title, body },
                  android: { priority: 'HIGH' },
                },
              }),
            }
          )

          const fcmJson = await fcmRes.json()
          results.push({
            platform: 'android',
            token: device.token,
            status: fcmRes.ok ? 'FCM_SUCCESS' : 'FCM_ERROR',
            response: fcmJson,
          })
        } catch (e: any) {
          console.error('FCM send failed:', e)
          results.push({ platform: 'android', token: device.token, status: 'FCM_ERROR', error: e.message })
        }
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