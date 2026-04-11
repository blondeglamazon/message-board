// app/api/admin/broadcast-push/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';
import { SignJWT, importPKCS8 } from 'jose';
import { timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel: allow up to 60s for large broadcasts

// ------------------------------------------------------------------
// Firebase Admin initialization (for Android / FCM)
// ------------------------------------------------------------------
function initFirebase(): boolean {
  if (admin.apps.length) return true;
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.warn('[broadcast] Firebase env vars missing');
    return false;
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
  return true;
}

// ------------------------------------------------------------------
// APNs JWT generator (for iOS) - same pattern as send-notification edge fn
// ------------------------------------------------------------------
async function generateAppleJwt(): Promise<string> {
  const teamId = process.env.APNS_TEAM_ID!;
  const keyId = process.env.APNS_KEY_ID!;
  const privateKey = process.env.APNS_PRIVATE_KEY!.replace(/\\n/g, '\n');
  const key = await importPKCS8(privateKey, 'ES256');
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .sign(key);
}

// ------------------------------------------------------------------
// Send one APNs push (with sandbox fallback, like the edge function)
// Returns { ok, reason } where reason is "Unregistered"|"BadDeviceToken"|etc on failure
// ------------------------------------------------------------------
async function sendApns(
  token: string,
  jwt: string,
  bundleId: string,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<{ ok: boolean; reason?: string; status: number }> {
  const payload = {
    aps: { alert: { title, body }, sound: 'default', badge: 1 },
    ...data,
  };
  const headers = {
    authorization: `bearer ${jwt}`,
    'apns-topic': bundleId,
    'apns-push-type': 'alert',
    'apns-priority': '10',
  };

  let res = await fetch(`https://api.push.apple.com/3/device/${token}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  let rb = await res.text();

  if (res.status === 400 && rb.includes('BadDeviceToken')) {
    // Retry sandbox
    res = await fetch(`https://api.sandbox.push.apple.com/3/device/${token}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    rb = await res.text();
  }

  if (res.ok) return { ok: true, status: res.status };

  let reason: string | undefined;
  try {
    reason = JSON.parse(rb)?.reason;
  } catch {
    reason = rb.slice(0, 120);
  }
  return { ok: false, reason, status: res.status };
}

// ------------------------------------------------------------------
// POST /api/admin/broadcast-push
// ------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    // --- Auth: constant-time comparison ---
    const authHeader = req.headers.get('Authorization') ?? '';
    const adminSecret = process.env.ADMIN_SECRET_KEY;
    if (!adminSecret) {
      return NextResponse.json({ error: 'Admin secret not configured' }, { status: 500 });
    }
    const provided = Buffer.from(authHeader.replace(/^Bearer\s+/, ''));
    const expected = Buffer.from(adminSecret);
    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- Parse body ---
    const { title, body, data } = await req.json();
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body' },
        { status: 400 }
      );
    }

    // FCM data payload values MUST be strings
    const dataPayload: Record<string, string> = {};
    if (data && typeof data === 'object') {
      for (const [k, v] of Object.entries(data)) {
        dataPayload[k] = String(v);
      }
    }

    // --- Fetch tokens, split by platform ---
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: rows, error } = await supabaseAdmin
      .from('push_tokens')
      .select('token, platform')
      .limit(10000);

    if (error) {
      console.error('[broadcast] failed to fetch tokens:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'No push tokens in database' },
        { status: 404 }
      );
    }

    // Dedupe per platform (same token can't exist twice but be safe)
    const androidTokens = Array.from(
      new Set(rows.filter((r) => r.platform === 'android').map((r) => r.token))
    );
    const iosTokens = Array.from(
      new Set(rows.filter((r) => r.platform === 'ios').map((r) => r.token))
    );

    const deadTokens: string[] = [];
    let androidSuccess = 0;
    let androidFail = 0;
    let iosSuccess = 0;
    let iosFail = 0;

    // --- Android: FCM multicast in batches of 500 ---
    const androidPromise = (async () => {
      if (androidTokens.length === 0) return;
      if (!initFirebase()) {
        androidFail = androidTokens.length;
        console.error('[broadcast] Firebase not initialized, skipping Android');
        return;
      }

      const CHUNK = 500;
      for (let i = 0; i < androidTokens.length; i += CHUNK) {
        const chunk = androidTokens.slice(i, i + CHUNK);
        try {
          const response = await admin.messaging().sendEachForMulticast({
            notification: { title, body },
            data: dataPayload,
            tokens: chunk,
            android: { priority: 'high', notification: { sound: 'default' } },
          });
          androidSuccess += response.successCount;
          androidFail += response.failureCount;
          response.responses.forEach((resp, idx) => {
            if (
              !resp.success &&
              (resp.error?.code === 'messaging/registration-token-not-registered' ||
                resp.error?.code === 'messaging/invalid-registration-token')
            ) {
              deadTokens.push(chunk[idx]);
            } else if (!resp.success) {
              console.error(
                `[broadcast] FCM fail [${chunk[idx].slice(0, 12)}]:`,
                resp.error?.code,
                resp.error?.message
              );
            }
          });
        } catch (e: any) {
          console.error('[broadcast] FCM batch exception:', e.message);
          androidFail += chunk.length;
        }
      }
    })();

    // --- iOS: APNs parallel sends ---
    const iosPromise = (async () => {
      if (iosTokens.length === 0) return;
      if (
        !process.env.APNS_TEAM_ID ||
        !process.env.APNS_KEY_ID ||
        !process.env.APNS_PRIVATE_KEY ||
        !process.env.APNS_BUNDLE_ID
      ) {
        iosFail = iosTokens.length;
        console.error('[broadcast] APNS env vars missing, skipping iOS');
        return;
      }

      const jwt = await generateAppleJwt();
      const bundleId = process.env.APNS_BUNDLE_ID!;

      // Parallelize with a concurrency cap to avoid hitting APNs too hard
      const CONCURRENCY = 50;
      for (let i = 0; i < iosTokens.length; i += CONCURRENCY) {
        const batch = iosTokens.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          batch.map((t) => sendApns(t, jwt, bundleId, title, body, dataPayload))
        );
        results.forEach((r, idx) => {
          if (r.ok) {
            iosSuccess++;
          } else {
            iosFail++;
            if (r.reason === 'Unregistered' || r.reason === 'BadDeviceToken') {
              deadTokens.push(batch[idx]);
            } else {
              console.error(
                `[broadcast] APNs fail [${batch[idx].slice(0, 12)}]:`,
                r.status,
                r.reason
              );
            }
          }
        });
      }
    })();

    await Promise.all([androidPromise, iosPromise]);

    // --- Cleanup dead tokens in chunks ---
    let cleanedUp = 0;
    if (deadTokens.length > 0) {
      for (let i = 0; i < deadTokens.length; i += 100) {
        const chunk = deadTokens.slice(i, i + 100);
        const { data: deleted, error: delErr } = await supabaseAdmin
          .from('push_tokens')
          .delete()
          .in('token', chunk)
          .select('id');
        if (delErr) {
          console.error('[broadcast] cleanup failed:', delErr.message);
        } else {
          cleanedUp += deleted?.length ?? 0;
        }
      }
      console.log(`[broadcast] cleaned up ${cleanedUp} stale tokens`);
    }

    const totalSuccess = androidSuccess + iosSuccess;
    const totalFail = androidFail + iosFail;

    return NextResponse.json({
      success: true,
      message: `Broadcast complete. Sent: ${totalSuccess}. Failed: ${totalFail}.`,
      breakdown: {
        android: { sent: androidSuccess, failed: androidFail, attempted: androidTokens.length },
        ios: { sent: iosSuccess, failed: iosFail, attempted: iosTokens.length },
      },
      staleTokensRemoved: cleanedUp,
    });
  } catch (err: any) {
    console.error('[broadcast] fatal:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to send broadcast' },
      { status: 500 }
    );
  }
}